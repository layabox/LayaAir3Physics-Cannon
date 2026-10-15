const { regClass } = Laya;

/** Minimal scene for checking Cannon gravity, contacts, and resetting bodies. */
@regClass()
export class Main extends Laya.Script {
    private scene: Laya.Scene3D;
    private bodies: Laya.Sprite3D[] = [];
    private status: Laya.Text;

    onStart(): void {
        this.scene = new Laya.Scene3D();
        this.owner.addChild(this.scene);
        this.scene.ambientColor = new Laya.Color(0.5, 0.5, 0.5);

        const camera = this.scene.addChild(new Laya.Camera(0, 0.1, 100));
        camera.transform.position = new Laya.Vector3(10, 8, 14);
        camera.transform.lookAt(new Laya.Vector3(0, 2, 0), Laya.Vector3.UnitY);
        camera.clearColor = new Laya.Color(0.08, 0.1, 0.15, 1);
        const light = this.scene.addChild(new Laya.Sprite3D());
        light.addComponent(Laya.DirectionLightCom);
        light.transform.localRotationEuler = new Laya.Vector3(-45, -30, 0);

        const floor = this.mesh(Laya.PrimitiveMesh.createBox(14, 0.5, 14), new Laya.Color(0.35, 0.4, 0.48));
        floor.transform.position = new Laya.Vector3(0, -0.25, 0);
        floor.addComponent(Laya.PhysicsCollider).colliderShape = new Laya.BoxColliderShape(14, 0.5, 14);
        // Keep rolling spheres inside the test area.
        for (const [x, z, width, depth] of [[-7, 0, 0.3, 14], [7, 0, 0.3, 14], [0, -7, 14, 0.3], [0, 7, 14, 0.3]]) {
            const wall = this.mesh(Laya.PrimitiveMesh.createBox(width, 1.5, depth), new Laya.Color(0.25, 0.3, 0.38));
            wall.transform.position = new Laya.Vector3(x, 0.75, z);
            wall.addComponent(Laya.PhysicsCollider).colliderShape = new Laya.BoxColliderShape(width, 1.5, depth);
        }

        this.status = this.owner.addChild(new Laya.Text());
        this.status.pos(24, 24);
        this.status.fontSize = 24;
        this.status.color = '#ffffff';
        this.status.text = 'Cannon.js | Boxes + spheres\nClick to reset';
        this.owner.on(Laya.Event.CLICK, this, this.reset);
        this.reset();
    }

    private mesh(mesh: Laya.Mesh, color: Laya.Color): Laya.Sprite3D {
        const node = this.scene.addChild(new Laya.Sprite3D());
        node.addComponent(Laya.MeshFilter).sharedMesh = mesh;
        const material = new Laya.BlinnPhongMaterial();
        material.albedoColor = color;
        node.addComponent(Laya.MeshRenderer).sharedMaterial = material;
        return node;
    }

    private reset(): void {
        for (const body of this.bodies) body.destroy();
        this.bodies.length = 0;
        for (let i = 0; i < 12; i++) {
            const sphere = i % 2 === 1;
            const node = this.mesh(
                sphere ? Laya.PrimitiveMesh.createSphere(0.5) : Laya.PrimitiveMesh.createBox(1, 1, 1),
                sphere ? new Laya.Color(0.25, 0.75, 1) : new Laya.Color(1, 0.6, 0.2),
            );
            node.transform.position = new Laya.Vector3((i % 3 - 1) * 2, 2 + Math.floor(i / 3) * 2, 0);
            const body = node.addComponent(Laya.Rigidbody3D);
            body.colliderShape = sphere ? new Laya.SphereColliderShape(0.5) : new Laya.BoxColliderShape(1, 1, 1);
            body.mass = 1;
            body.restitution = 0.25;
            this.bodies.push(node);
        }
    }

    onUpdate(): void {
        if (!this.status || !this.bodies.length) return;
        const lowest = Math.min(...this.bodies.map(body => body.transform.position.y));
        this.status.text = `Cannon.js | 12 bodies | lowest Y: ${lowest.toFixed(2)}\nClick to reset`;
    }
}
