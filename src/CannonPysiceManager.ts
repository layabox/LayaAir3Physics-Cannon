
import { IPhysicsManager, Vector3, Event, Collision, PhysicsUpdateList, PhysicsSettings, ContactPoint, Ray, HitResult, ICollider, IColliderShape, Quaternion } from "../libs/LayaAir";
import { CannonCollisionTool } from "./CannonCollisionTool";
import { CannonCollider } from "./Collider/CannonCollider";
import { ConnonJoint } from "./Joint/ConnonJoint";
import { CannonSpringJoint } from "./Joint/CannonSpringJoint";



export class CannonPysiceManager implements IPhysicsManager {
	/**默认碰撞组 */
	static COLLISIONFILTERGROUP_DEFAULTFILTER: number = 0x1;
	/**静态碰撞组 */
	static COLLISIONFILTERGROUP_STATICFILTER: number = 0x2;

	/** @internal */
	static PHYSICSENGINEFLAGS_NONE: number = 0x0;
	/** @internal */
	static PHYSICSENGINEFLAGS_COLLISIONSONLY: number = 0x1;
	/** @internal */
	static PHYSICSENGINEFLAGS_SOFTBODYSUPPORT: number = 0x2;
	/** @internal */
	static PHYSICSENGINEFLAGS_MULTITHREADED: number = 0x4;
	/** @internal */
	static PHYSICSENGINEFLAGS_USEHARDWAREWHENPOSSIBLE: number = 0x8;

	/** @internal */
	static SOLVERMODE_RANDMIZE_ORDER: number = 1;
	/** @internal */
	static SOLVERMODE_FRICTION_SEPARATE: number = 2;
	/** @internal */
	static SOLVERMODE_USE_WARMSTARTING: number = 4;
	/** @internal */
	static SOLVERMODE_USE_2_FRICTION_DIRECTIONS: number = 16;
	/** @internal */
	static SOLVERMODE_ENABLE_FRICTION_DIRECTION_CACHING: number = 32;
	/** @internal */
	static SOLVERMODE_DISABLE_VELOCITY_DEPENDENT_FRICTION_DIRECTION: number = 64;
	/** @internal */
	static SOLVERMODE_CACHE_FRIENDLY: number = 128;
	/** @internal */
	static SOLVERMODE_SIMD: number = 256;
	/** @internal */
	static SOLVERMODE_INTERLEAVE_CONTACT_AND_FRICTION_CONSTRAINTS: number = 512;
	/** @internal */
	static SOLVERMODE_ALLOW_ZERO_LENGTH_FRICTION_DIRECTIONS: number = 1024;

	/**所有过滤 */
	static COLLISIONFILTERGROUP_ALLFILTER: number = -1;

	/** @internal */
	private static _btTempVector30: CANNON.Vec3;
	/** @internal */
	private static _btTempVector31: CANNON.Vec3;
	/** @internal */
	private static _tempVector30: Vector3 = new Vector3();

	/*是否禁用所有模拟器。*/
	static disableSimulation: boolean = false;



	static __init__(): void {
		CannonPysiceManager._btTempVector30 = new CANNON.Vec3(0, 0, 0);
		CannonPysiceManager._btTempVector31 = new CANNON.Vec3(0, 0, 0);;
	}


	/** @internal */
	private _discreteDynamicsWorld: CANNON.World;
	/** @internal */
	private _broadphase: CANNON.NaiveBroadphase;
	/** @internal */
	private _gravity: Vector3 = new Vector3(0, -10, 0);
	/** @internal */
	private _iterations: number;
	/** @internal */
	private _closestRayResultCallback: CANNON.RaycastResult = new CANNON.RaycastResult();
	/** @internal */
	private _rayoption: any = {};

	/** @internal */
	private _collisionsUtils: CannonCollisionTool = new CannonCollisionTool();
	/** @internal */
	private _previousFrameCollisions: Collision[] = [];
	/** @internal */
	private _currentFrameCollisions: Collision[] = [];
	/** @internal */
	_physicsUpdateList: PhysicsUpdateList = new PhysicsUpdateList();

	/**@internal	*/
	_updatedRigidbodies: number = 0;
	protected _updateCount = 0;

	/**物理引擎在一帧中用于补偿减速的最大次数：模拟器每帧允许的最大模拟次数，如果引擎运行缓慢,可能需要增加该次数，否则模拟器会丢失“时间",引擎间隔时间小于maxSubSteps*fixedTimeStep非常重要。*/
	maxSubSteps: number = 1;
	/**物理模拟器帧的间隔时间:通过减少fixedTimeStep可增加模拟精度，默认是1.0 / 60.0。*/
	fixedTimeStep: number = 1.0 / 60.0;

	//Joint
	/** @internal */
	private _currentConstraint: Map<number, ConnonJoint> = new Map<number, ConnonJoint>();
	private _springConstraint: Map<number, CannonSpringJoint> = new Map<number, CannonSpringJoint>();



	constructor(physicsSettings: PhysicsSettings) {

		this.maxSubSteps = physicsSettings.maxSubSteps;
		this.fixedTimeStep = physicsSettings.fixedTimeStep;
		this._discreteDynamicsWorld = new CANNON.World();
		this._broadphase = new CANNON.NaiveBroadphase();
		this._discreteDynamicsWorld.broadphase = this._broadphase;

		this._discreteDynamicsWorld.defaultContactMaterial.contactEquationRelaxation = 3;
		this._discreteDynamicsWorld.defaultContactMaterial.contactEquationStiffness = 1e7;
		this.setGravity(this._gravity);
	}
	setActiveCollider(collider: CannonCollider, value: boolean): void {
		// throw new Error("Method not implemented.");
		collider.active = value;
        if (value) {
            collider._physicsManager = this;
        } else {
            collider._physicsManager = null;
        }
	}
	enableDebugDrawer?(value: boolean): void {
		throw new Error("Method not implemented.");
	}
	shapeCast(shape: IColliderShape, fromPosition: Vector3, toPosition: Vector3, out: HitResult, fromRotation?: Quaternion, toRotation?: Quaternion, collisonGroup?: number, collisionMask?: number, allowedCcdPenetration?: number): boolean {
		throw new Error("Method not implemented.");
	}
	shapeCastAll(shape: IColliderShape, fromPosition: Vector3, toPosition: Vector3, out: HitResult[], fromRotation?: Quaternion, toRotation?: Quaternion, collisonGroup?: number, collisionMask?: number, allowedCcdPenetration?: number): boolean {
		throw new Error("Method not implemented.");
	}

	/**
	* @internal
	*/
	private _simulate(deltaTime: number): void {
		this._updatedRigidbodies = 0;
		if (this._discreteDynamicsWorld) {
			this._discreteDynamicsWorld.callBackBody.length = 0;
			this._discreteDynamicsWorld.allContacts.length = 0;
			this._discreteDynamicsWorld.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);
		}
		var callBackBody: CANNON.Body[] = this._discreteDynamicsWorld.callBackBody;

		for (var i: number = 0, n = callBackBody.length; i < n; i++) {
			var cannonBody: CANNON.Body = callBackBody[i];
			var rigidbody: CannonCollider = CannonCollider._physicObjectsMap.get(cannonBody.layaID);
			this._updatedRigidbodies++;
			rigidbody._updateTransformComponent(rigidbody._cannonColliderObject);
		}
		this._springConstraint.forEach((value) => {
			value._spring.applyForce();
		})

	}

	/**
	 * @internal
	 */
	private _updatePhysicsTransformFromRender(): void {
		var elements: any = this._physicsUpdateList.elements;
		for (var i = 0, n = this._physicsUpdateList.length; i < n; i++) {
			var physicCollider: CannonCollider = elements[i];
			physicCollider._derivePhysicsTransformation(false);
			physicCollider.inPhysicUpdateListIndex = -1;//置空索引
		}
		this._physicsUpdateList.length = 0;//清空物理更新队列
	}


	/**
	 * @internal
	 */
	_updateCollisions(): void {
		this._collisionsUtils.recoverAllContactPointsPool();
		var previous: Collision[] = this._currentFrameCollisions;
		this._currentFrameCollisions = this._previousFrameCollisions;
		this._currentFrameCollisions.length = 0;
		this._previousFrameCollisions = previous;

		var loopCount: number = this._updateCount;
		var allContacts: CANNON.ContactEquation[] = this._discreteDynamicsWorld.allContacts;
		var numManifolds: number = allContacts.length;
		for (var i: number = 0; i < numManifolds; i++) {
			var contactEquation: CANNON.ContactEquation = allContacts[i];
			var componentA = CannonCollider._physicObjectsMap.get(contactEquation.bi.layaID);
			var componentB = CannonCollider._physicObjectsMap.get(contactEquation.bj.layaID);
			var collision: Collision = null;
			var isFirstCollision: boolean;//可能同时返回A和B多次,需要过滤
			var contacts: ContactPoint[] = null;
			var isTrigger: boolean = componentA._isTrigger || componentB._isTrigger;
			if (isTrigger) {
				collision = this._collisionsUtils.getCollision(componentA, componentB);
				contacts = collision.contacts;
				isFirstCollision = collision._updateFrame !== loopCount;
				if (isFirstCollision) {
					collision._isTrigger = true;
					contacts.length = 0;
				}

			} else {
				if (componentA._enableProcessCollisions || componentB._enableProcessCollisions) {//例：A和B均为运动刚体或PhysicCollider

					var contactPoint: ContactPoint = this._collisionsUtils.getContactPoints();
					contactPoint._colliderA = componentA;
					contactPoint._colliderB = componentB;
					var normal: Vector3 = contactPoint.normal;
					var positionOnA: Vector3 = contactPoint.positionOnA;
					var positionOnB: Vector3 = contactPoint.positionOnB;
					var connectNormal: CANNON.Vec3 = contactEquation.ni;
					var connectOnA: CANNON.Vec3 = contactEquation.ri;
					var connectOnB: CANNON.Vec3 = contactEquation.rj;

					normal.setValue(connectNormal.x, connectNormal.y, connectNormal.z);
					positionOnA.setValue(connectOnA.x, connectOnA.y, connectOnA.z);
					positionOnB.setValue(connectOnB.x, connectOnB.y, -connectOnB.z);
					collision = this._collisionsUtils.getCollision(componentA, componentB);
					contacts = collision.contacts;
					isFirstCollision = collision._updateFrame !== loopCount;
					if (isFirstCollision) {
						collision._isTrigger = false;
						contacts.length = 0;
					}
					contacts.push(contactPoint);
				}
			}
			if (collision && isFirstCollision) {
				this._currentFrameCollisions.push(collision);
				collision._setUpdateFrame(loopCount);
			}
		}
	}

	/**
	 * 这个只是给对象发送事件，不会挨个组件调用碰撞函数
	 * 组件要响应碰撞的话，要通过监听事件
	 */
	dispatchCollideEvent(): void {
		let loopCount = this._updateCount;
		for (var i: number = 0, n: number = this._currentFrameCollisions.length; i < n; i++) {
			var curFrameCol: Collision = this._currentFrameCollisions[i];
			var colliderA = curFrameCol._colliderA.component;
			var colliderB = curFrameCol._colliderB.component;
			if (colliderA._destroyed || colliderB._destroyed)//前一个循环可能会销毁后面循环的同一物理组件
				continue;
			let ownerA = colliderA.owner;
			let ownerB = colliderB.owner;
			if (loopCount - curFrameCol._lastUpdateFrame === 1) {
				if (curFrameCol._isTrigger) {
					ownerA.event(Event.TRIGGER_STAY, colliderB);
					ownerB.event(Event.TRIGGER_STAY, colliderA);
				} else {
					curFrameCol.other = colliderB.component;
					ownerA.event(Event.COLLISION_STAY, curFrameCol);
					curFrameCol.other = colliderA.component;
					ownerB.event(Event.COLLISION_STAY, curFrameCol);
				}
			} else {
				if (curFrameCol._isTrigger) {
					ownerA.event(Event.TRIGGER_ENTER, colliderB);
					ownerB.event(Event.TRIGGER_ENTER, colliderA);
				} else {
					curFrameCol.other = colliderB.component;
					ownerA.event(Event.COLLISION_ENTER, curFrameCol);
					curFrameCol.other = colliderA.component;
					ownerB.event(Event.COLLISION_ENTER, curFrameCol);
				}
			}
		}

		for (i = 0, n = this._previousFrameCollisions.length; i < n; i++) {
			var preFrameCol = this._previousFrameCollisions[i];
			var preColliderA = preFrameCol._colliderA.component;
			var preColliderB = preFrameCol._colliderB.component;
			if (preColliderA._destroyed || preColliderB._destroyed)
				continue;
			let ownerA = preColliderA.owner;
			let ownerB = preColliderB.owner;
			if (loopCount - preFrameCol._updateFrame === 1) {
				this._collisionsUtils.recoverCollision(preFrameCol);//回收collision对象
				if (preFrameCol._isTrigger) {
					ownerA.event(Event.TRIGGER_EXIT, preColliderB);
					ownerB.event(Event.TRIGGER_EXIT, preColliderA);
				} else {
					preFrameCol.other = preColliderB.component;
					ownerA.event(Event.COLLISION_EXIT, preFrameCol);
					preFrameCol.other = preColliderA.component;
					ownerB.event(Event.COLLISION_EXIT, preFrameCol);
				}
			}
		}
	}



	/**
	 * 设置全局加速度
	 * @param gravity 
	 */
	setGravity(gravity: Vector3): void {
		gravity.cloneTo(this._gravity);
		if (!this._discreteDynamicsWorld)
			throw "Simulation:Cannot perform this action when the physics engine is set to CollisionsOnly";
		this._discreteDynamicsWorld.gravity.set(this._gravity.x, this._gravity.y, this._gravity.z);
	}

	/**
  *添加碰撞体实例到管理器
  * @param collider 
  */
	addCollider(collider: CannonCollider): void {
		if (!this._discreteDynamicsWorld)
			throw "Simulation:Cannot perform this action when the physics engine is set to CollisionsOnly";
		if (collider._isSimulate) {
			return;
		}
		collider._derivePhysicsTransformation(true);
		this._discreteDynamicsWorld.addBody(collider._cannonColliderObject);
		collider._isSimulate = true;

	}
	/**	
	 * 从管理器移除撞体实例
	 * @param collider 
	 */
	removeCollider(collider: CannonCollider): void {
		if (!this._discreteDynamicsWorld)
			throw "Simulation:Cannot perform this action when the physics engine is set to CollisionsOnly";
		if (!collider._isSimulate) {
			return;
		}
		collider.inPhysicUpdateListIndex != undefined && (collider.inPhysicUpdateListIndex = -1);
		this._discreteDynamicsWorld.removeBody(collider._cannonColliderObject);
		collider._isSimulate = false;
	}

	/**
	 * 添加关节点到管理器
	 * @param joint 关节点
	 * @returns 
	 */
	addJoint(joint: ConnonJoint) {
		if (!this._discreteDynamicsWorld)
			throw "Cannot perform this action when the physics engine is set to CollisionsOnly";
		if (this._currentConstraint.has(joint._id)) {
			return;
		}
		this._currentConstraint.set(joint._id, joint);
		if (joint instanceof CannonSpringJoint) {
			this._springConstraint.set(joint._id, joint);
		} else {
			this._discreteDynamicsWorld.addConstraint(joint._constraint);
		}

	}
	/**
	 * 从管理器移除关节点
	 * @param joint 关节点
	 * @returns 
	 */
	removeJoint(joint: ConnonJoint) {
		if (!this._discreteDynamicsWorld)
			throw "Cannot perform this action when the physics engine is set to CollisionsOnly";
		if (!this._currentConstraint.has(joint._id)) {
			return;
		}
		this._currentConstraint.delete(joint._id);
		if (joint instanceof CannonSpringJoint) {
			this._springConstraint.delete(joint._id);
		} else {
			this._discreteDynamicsWorld.removeConstraint(joint._constraint);
		}
	}

	/**
	 * 更新物理引擎心跳 由系统调用
	 * @param elapsedTime 帧间隔时间(单位： 秒)
	 */
	update(elapsedTime: number): void {
		this._updatePhysicsTransformFromRender();
		CannonCollider._addUpdateList = false;
		this._simulate(elapsedTime);
		CannonCollider._addUpdateList = true;
		this._updateCollisions();
		this.dispatchCollideEvent();
		this._updateCount++;
	}

	/**
	 *  射线检测第一个碰撞物体。
	 * @param  	ray        射线
	 * @param  	outHitInfo 与该射线发生碰撞的第一个碰撞器的碰撞信息
	 * @param  	distance   射线长度,默认为最大值
	 * @param   collisonGroup 射线所属碰撞组。
	 * @param   collisionMask 与射线可产生碰撞的组。
	 * @return 	是否检测成功。
	 */
	rayCast(ray: Ray, outHitResult: HitResult, distance: number = 2147483647, collisonGroup: number = CannonPysiceManager.COLLISIONFILTERGROUP_DEFAULTFILTER, collisionMask: number = CannonPysiceManager.COLLISIONFILTERGROUP_ALLFILTER): boolean {
		var from: Vector3 = ray.origin;
		var to: Vector3 = CannonPysiceManager._tempVector30;
		Vector3.normalize(ray.direction, to);
		Vector3.scale(to, distance, to);
		Vector3.add(from, to, to);
		return this.raycastFromTo(from, to, outHitResult, collisonGroup, collisionMask);
	}


	/**
	 * 射线检测所有碰撞的物体。
	 * @param  	ray        射线
	 * @param  	out 碰撞结果[数组元素会被回收]。
	 * @param  	distance   射线长度,默认为最大值
	 * @param   collisonGroup 射线所属碰撞组。
	 * @param   collisionMask 与射线可产生碰撞的组。
	 * @return 	是否检测成功。
	 */
	rayCastAll(ray: Ray, out: HitResult[], distance: number = 2147483647, collisonGroup: number = CannonPysiceManager.COLLISIONFILTERGROUP_DEFAULTFILTER, collisionMask: number = CannonPysiceManager.COLLISIONFILTERGROUP_ALLFILTER): boolean {
		var from: Vector3 = ray.origin;
		var to: Vector3 = CannonPysiceManager._tempVector30;
		Vector3.normalize(ray.direction, to);
		Vector3.scale(to, distance, to);
		Vector3.add(from, to, to);
		return this.raycastAllFromTo(from, to, out, collisonGroup, collisionMask);
	}

	/**
	 * 射线检测第一个碰撞物体。
	 * @param	from 起始位置。
	 * @param	to 结束位置。
	 * @param	out 碰撞结果。
	 * @param   collisonGroup 射线所属碰撞组。
	 * @param   collisionMask 与射线可产生碰撞的组。
	 * @return 	是否成功。
	 */
	raycastFromTo(from: Vector3, to: Vector3, out: HitResult = null, collisonGroup: number = CannonPysiceManager.COLLISIONFILTERGROUP_DEFAULTFILTER, collisionMask: number = CannonPysiceManager.COLLISIONFILTERGROUP_ALLFILTER): boolean {
		var rayResultCall: CANNON.RaycastResult = this._closestRayResultCallback;
		rayResultCall.hasHit = false;
		var rayOptions: any = this._rayoption;
		var rayFrom: CANNON.Vec3 = CannonPysiceManager._btTempVector30;
		var rayTo: CANNON.Vec3 = CannonPysiceManager._btTempVector31;
		rayFrom.set(from.x, from.y, from.z);
		rayTo.set(to.x, to.y, to.z);
		rayOptions.skipBackfaces = true;
		rayOptions.collisionFilterMask = collisionMask;
		rayOptions.collisionFilterGroup = collisonGroup;
		rayOptions.result = rayResultCall;
		this._discreteDynamicsWorld.raycastClosest(rayFrom, rayTo, rayOptions, rayResultCall);
		if (rayResultCall.hasHit) {
			if (out) {
				out.succeeded = true;
				out.collider = CannonCollider._physicObjectsMap.get(rayResultCall.body.layaID);
				var point: Vector3 = out.point;
				var normal: Vector3 = out.normal;
				var resultPoint: CANNON.Vec3 = rayResultCall.hitPointWorld;
				var resultNormal: CANNON.Vec3 = rayResultCall.hitNormalWorld;
				point.setValue(resultPoint.x, resultPoint.y, resultPoint.z);
				normal.setValue(resultNormal.x, resultNormal.y, resultNormal.z)
			}
			return true
		} else {
			out.succeeded = false;
		}
		return false;
	}

	/**
	 * 射线检测所有碰撞的物体。
	 * @param	from 起始位置。
	 * @param	to 结束位置。
	 * @param	out 碰撞结果[数组元素会被回收]。
	 * @param   collisonGroup 射线所属碰撞组。
	 * @param   collisionMask 与射线可产生碰撞的组。
	 * @return 	是否成功。
	 */
	raycastAllFromTo(from: Vector3, to: Vector3, out: HitResult[], collisonGroup: number = CannonPysiceManager.COLLISIONFILTERGROUP_DEFAULTFILTER, collisionMask: number = CannonPysiceManager.COLLISIONFILTERGROUP_ALLFILTER): boolean {
		var rayOptions: any = this._rayoption;
		var rayFrom: CANNON.Vec3 = CannonPysiceManager._btTempVector30;
		var rayTo: CANNON.Vec3 = CannonPysiceManager._btTempVector31;
		rayFrom.set(from.x, from.y, from.z);
		rayTo.set(to.x, to.y, to.z);
		rayOptions.skipBackfaces = true;
		rayOptions.collisionFilterMask = collisionMask;
		rayOptions.collisionFilterGroup = collisonGroup;
		out.length = 0;
		let collisionsUtils = this._collisionsUtils;
		this._discreteDynamicsWorld.raycastAll(rayFrom, rayTo, rayOptions, function (result: CANNON.RaycastResult) {
			var hitResult: HitResult = collisionsUtils.getHitResult();
			out.push(hitResult);
			hitResult.succeeded = true
			hitResult.collider = CannonCollider._physicObjectsMap.get(result.body.layaID);
			//TODO:out.hitFraction
			var point: Vector3 = hitResult.point;
			var normal: Vector3 = hitResult.normal;
			var resultPoint: CANNON.Vec3 = result.hitPointWorld;
			var resultNormal: CANNON.Vec3 = result.hitNormalWorld;
			point.setValue(resultPoint.x, resultPoint.y, resultPoint.z);
			normal.setValue(resultNormal.x, resultNormal.y, resultNormal.z);
		});
		if (out.length != 0)
			return true;
		else
			return false;
	}


	destroy(): void {
		//TODO:移除调所有的RigidBody
		this._discreteDynamicsWorld = null;
		this._broadphase = null;
	}
}