const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test, before } = require('node:test');

// Use the actual engine and adapter exported by the project's Web build.
const root = path.resolve(__dirname, '..');
const context = { document: {}, console, performance, TextDecoder, TextEncoder, setTimeout, clearTimeout, setInterval, clearInterval };
context.window = context;
context.self = context;
vm.createContext(context);
for (const file of ['laya.core.js', 'laya.d3.js', 'laya.physics3D.js', 'laya.cannon.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'release/web/libs', file), 'utf8'), context, { filename: file });
}
const Laya = context.Laya;
const CANNON = context.CANNON;

before(async () => {
    await Laya.Laya3D.PhysicsCreateUtil.initialize();
});

function near(actual, expected, tolerance = 1e-5) {
    assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
}

function vector(actual, expected) {
    for (const axis of ['x', 'y', 'z']) near(actual[axis], expected[axis]);
}

function manager() {
    const result = new Laya.CannonPysiceManager({ maxSubSteps: 1, fixedTimeStep: 1 / 60 });
    result.setGravity(new Laya.Vector3());
    return result;
}

function collider(world, dynamic = false, configure = () => {}) {
    const result = dynamic ? new Laya.CannonRigidBodyCollider(world) : new Laya.CannonStaticCollider(world);
    const events = [];
    const owner = { transform: new Laya.Transform3D(null), event(type, data) { events.push({ type, data, other: data?.other }); } };
    result.setOwner(owner);
    result.component = { owner };
    result.componentEnable = true;
    world.setActiveCollider(result, true);
    owner.transform.on(Laya.Event.TRANSFORM_CHANGED, result, result.transformChanged);
    configure(result, owner.transform);
    result.setColliderShape(new Laya.CannonBoxColliderShape());
    return { collider: result, owner, events, body: result._cannonColliderObject };
}

function axisRotation(x, y, z, angle) {
    const rotation = new Laya.Quaternion();
    Laya.Quaternion.createFromAxisAngle(new Laya.Vector3(x, y, z), angle, rotation);
    return rotation;
}

test('trigger toggles preserve static, dynamic, and kinematic body types', () => {
    const world = manager();
    const a = collider(world);
    const b = collider(world);
    const dynamic = collider(world, true);
    const kinematic = collider(world, true, result => result.setIsKinematic(true));
    for (const [item, type] of [[a, CANNON.Body.STATIC], [dynamic, CANNON.Body.DYNAMIC], [kinematic, CANNON.Body.KINEMATIC]]) {
        for (const value of [false, true, false, true, false]) {
            item.collider.setTrigger(value);
            assert.equal(item.body.type, type);
            assert.equal(item.body.collisionResponse, !value);
        }
    }
    const broadphase = new CANNON.NaiveBroadphase();
    assert.equal(broadphase.needBroadphaseCollision(a.body, b.body), false);
    dynamic.collider.allowSleep(false);
    dynamic.collider.setIsKinematic(true);
    dynamic.collider.setIsKinematic(false);
    assert.equal(dynamic.body.allowSleep, false);
    dynamic.collider.sleep();
    assert.equal(dynamic.collider.isSleeping(), true);
    dynamic.collider.wakeUp();
    assert.equal(dynamic.collider.isSleeping(), false);
});

test('local offset round trips with nonuniform/negative scale, rotation, and a parent', () => {
    const world = manager();
    for (const scale of [new Laya.Vector3(2, 1, 3), new Laya.Vector3(-2, 1, 3)]) {
        const item = collider(world, true);
        const transform = item.owner.transform;
        transform.localScale = scale;
        transform.position = new Laya.Vector3(4, 5, 6);
        transform.rotation = axisRotation(0, 1, 0, 0.7);
        const offset = new Laya.Vector3(1, 2, 3);
        item.collider._colliderShape.setOffset(offset);
        const position = transform.position.clone();
        const center = new Laya.Vector3();
        Laya.Vector3.transformCoordinate(offset, transform.worldMatrix, center);
        vector(item.body.position, center);
        // Offset is applied by the body transform, never a second time by the shape.
        vector(item.body.shapeOffsets[0], new Laya.Vector3());
        item.collider._updateTransformComponent(item.body);
        vector(transform.position, position);
        transform.localScale = new Laya.Vector3(3, 2, 1);
        transform.rotation = axisRotation(1, 0, 0, 0.4);
        item.collider._derivePhysicsTransformation(false);
        Laya.Vector3.transformCoordinate(offset, transform.worldMatrix, center);
        vector(item.body.position, center);
        item.collider._updateTransformComponent(item.body);
        vector(transform.position, position);
    }
    const item = collider(world, true);
    const parent = new Laya.Transform3D(null);
    parent.localScale = new Laya.Vector3(2, 3, 4);
    parent.localRotation = axisRotation(0, 1, 0, 0.3);
    item.owner.transform._setParent(parent);
    item.owner.transform.localPosition = new Laya.Vector3(2, 1, 0);
    item.collider._colliderShape.setOffset(new Laya.Vector3(1, 1, 0));
    const position = item.owner.transform.position.clone();
    item.collider._updateTransformComponent(item.body);
    vector(item.owner.transform.position, position);
});

test('kinematic trigger pairs send ENTER, STAY, EXIT with component arguments', () => {
    const world = manager();
    const setup = result => { result.setIsKinematic(true); result.setTrigger(true); };
    const a = collider(world, true, setup);
    const b = collider(world, true, setup);
    world.update(1 / 60);
    world.update(1 / 60);
    b.owner.transform.position = new Laya.Vector3(10, 0, 0);
    world.update(1 / 60);
    assert.deepEqual(a.events.map(event => event.type), [Laya.Event.TRIGGER_ENTER, Laya.Event.TRIGGER_STAY, Laya.Event.TRIGGER_EXIT]);
    assert.ok(a.events.every(event => event.data === b.collider.component));
    assert.ok(b.events.every(event => event.data === a.collider.component));
    near(b.body.position.x, 10);
});

test('solid contacts send collision ENTER, STAY, EXIT', () => {
    const world = manager();
    world.setGravity(new Laya.Vector3(0, -10, 0));
    const floor = collider(world);
    const item = collider(world, true, (_, transform) => { transform.position = new Laya.Vector3(0, 0.9, 0); });
    world.update(1 / 60);
    world.update(1 / 60);
    item.collider.setWorldPosition(new Laya.Vector3(10, 0, 0));
    world.update(1 / 60);
    assert.deepEqual(item.events.map(event => event.type), [Laya.Event.COLLISION_ENTER, Laya.Event.COLLISION_STAY, Laya.Event.COLLISION_EXIT]);
    assert.ok(item.events.every(event => event.data instanceof Laya.Collision && event.other === floor.collider.component));
});

test('dynamic triggers remain simulated and fall under gravity', () => {
    const world = manager();
    world.setGravity(new Laya.Vector3(0, -10, 0));
    const item = collider(world, true, result => result.setTrigger(true));
    world.update(1 / 60);
    assert.ok(item.body.position.y < 0);
    assert.equal(item.body.type, CANNON.Body.DYNAMIC);
});

test('shape replacement keeps the collider in the world; clearing it removes the body', () => {
    const world = manager();
    const item = collider(world, true);
    const shape = new Laya.CannonSphereColliderShape();
    item.collider.setColliderShape(shape);
    assert.equal(item.collider._isSimulate, true);
    assert.equal(world._discreteDynamicsWorld.bodies.length, 1);
    assert.equal(item.body.shapes[0], shape.getPhysicsShape());
    item.collider.setColliderShape(null);
    assert.equal(item.collider._isSimulate, false);
    assert.equal(world._discreteDynamicsWorld.bodies.length, 0);
});

test('reused/moved static colliders update their AABB for raycasts', () => {
    const world = manager();
    const item = collider(world);
    const hit = new Laya.HitResult();
    assert.equal(world.raycastFromTo(new Laya.Vector3(0, 2, 0), new Laya.Vector3(0, -2, 0), hit), true);
    world.removeCollider(item.collider);
    item.owner.transform.position = new Laya.Vector3(10, 0, 0);
    world.addCollider(item.collider);
    assert.equal(world.raycastFromTo(new Laya.Vector3(10, 2, 0), new Laya.Vector3(10, -2, 0), hit), true);
    assert.equal(world.raycastFromTo(new Laya.Vector3(0, 2, 0), new Laya.Vector3(0, -2, 0), hit), false);
    item.owner.transform.position = new Laya.Vector3(20, 0, 0);
    world.update(1 / 60);
    assert.equal(world.raycastFromTo(new Laya.Vector3(20, 2, 0), new Laya.Vector3(20, -2, 0), hit), true);
});

test('raycast result pool is reused across frames', () => {
    const world = manager();
    collider(world);
    const out = [];
    const from = new Laya.Vector3(0, 2, 0), to = new Laya.Vector3(0, -2, 0);
    assert.equal(world.raycastAllFromTo(from, to, out), true);
    const first = out[0];
    const size = world._collisionsUtils._hitResultsPool.length;
    for (let i = 0; i < 10; i++) {
        world.update(1 / 60);
        assert.equal(world.raycastAllFromTo(from, to, out), true);
    }
    assert.equal(out[0], first);
    assert.equal(world._collisionsUtils._hitResultsPool.length, size);
});

test('removing a queued collider leaves no stale or duplicate transform entries', () => {
    const world = manager();
    const a = collider(world), b = collider(world);
    a.owner.transform.position = new Laya.Vector3(2, 0, 0);
    b.owner.transform.position = new Laya.Vector3(3, 0, 0);
    assert.equal(world._physicsUpdateList.length, 2);
    world.removeCollider(a.collider);
    world.setActiveCollider(a.collider, false);
    assert.equal(world._physicsUpdateList.length, 1);
    assert.equal(b.collider.inPhysicUpdateListIndex, 0);
    world.update(1 / 60);
    vector(b.body.position, b.owner.transform.position);
    assert.equal(world._physicsUpdateList.length, 0);
});

test('spring stiffness changes the actual force, and shape axes map native Z correctly', () => {
    const joint = new Laya.CannonSpringJoint(manager());
    const a = new CANNON.Body({ mass: 1 }), b = new CANNON.Body({ mass: 1 });
    b.position.set(2, 0, 0);
    joint._spring.bodyA = a;
    joint._spring.bodyB = b;
    joint.setDamping(0);
    joint.setStiffness(25);
    joint._spring.applyForce();
    near(Math.abs(a.force.x), 25);
    for (const [axis, expected] of [[0, new Laya.Vector3(1, 0, 0)], [1, new Laya.Vector3(0, 1, 0)], [2, new Laya.Vector3(0, 0, 1)]]) {
        const rotation = new Laya.Quaternion();
        Laya.CannonColliderShape.getLocalQuatation(axis, rotation);
        const direction = new Laya.Vector3();
        Laya.Vector3.transformQuat(new Laya.Vector3(0, 0, 1), rotation, direction);
        vector(direction, expected);
    }
});
