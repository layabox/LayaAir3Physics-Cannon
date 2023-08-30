import { IDynamicCollider, EColliderCapable, Vector3, PhysicsForceMode, Quaternion } from "../../libs/LayaAir";
import { CannonPysiceManager } from "../CannonPysiceManager";
import { CannonColliderShape } from "../Shape/CannonColliderShape";
import { CannonCollider, CannonColliderType } from "./CannonCollider";

export class CannonRigidBodyCollider extends CannonCollider implements IDynamicCollider {

	/** @internal */
	private static _btTempVector30: CANNON.Vec3;
	/** @internal */
	private static _btTempVector31: CANNON.Vec3;
	/**
	 * @internal
	 */
	static __init__(): void {
		CannonRigidBodyCollider._btTempVector30 =new CANNON.Vec3();
		CannonRigidBodyCollider._btTempVector31 = new CANNON.Vec3();
		this.initCapable();
	}
	/** @internal */
	private _isKinematic: boolean = false;
	/** @internal */
	private _mass: number = 1.0;


    /**@internal */
    static _rigidBodyCapableMap: Map<any, any>;
	static getRigidBodyCapable(value: EColliderCapable): boolean {
        return this._rigidBodyCapableMap.get(value);
    }

    static initCapable(): void {
        this._rigidBodyCapableMap = new Map();
        this._rigidBodyCapableMap.set(EColliderCapable.Collider_AllowTrigger, true);
        this._rigidBodyCapableMap.set(EColliderCapable.Collider_CollisionGroup, true);
        this._rigidBodyCapableMap.set(EColliderCapable.Collider_Friction, true);
        this._rigidBodyCapableMap.set(EColliderCapable.Collider_Restitution, true);
        this._rigidBodyCapableMap.set(EColliderCapable.Collider_RollingFriction, false);
        this._rigidBodyCapableMap.set(EColliderCapable.Collider_DynamicFriction, false);
        this._rigidBodyCapableMap.set(EColliderCapable.Collider_StaticFriction, false);
        this._rigidBodyCapableMap.set(EColliderCapable.Collider_BounceCombine, false);
        this._rigidBodyCapableMap.set(EColliderCapable.Collider_FrictionCombine, false);

        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_AllowSleep, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_Gravity, false);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_LinearDamp, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_AngularDamp, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_LinearVelocity, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_AngularVelocity, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_Mass, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_InertiaTensor, false);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_MassCenter, false);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_MaxAngularVelocity, false);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_MaxDepenetrationVelocity, false);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_SleepThreshold, false);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_SleepAngularVelocity, false);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_SolverIterations, false);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_AllowDetectionMode, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_AllowKinematic, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_LinearFactor, false);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_AngularFactor, false);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_ApplyForce, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_ClearForce, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_ApplyForceWithOffset, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_ApplyTorque, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_ApplyImpulse, true);
        this._rigidBodyCapableMap.set(EColliderCapable.RigidBody_ApplyTorqueImpulse, true);
    }

	getCapable(value: number): boolean {
        return CannonRigidBodyCollider.getRigidBodyCapable(value);
    }


	/**
	 * 刚体的线阻力。
	 */
	setLinearDamping(value: number) {
		if (this._btColliderObject)
			this._btColliderObject.linearDamping = value;
	}

	/**
	 * 刚体的角阻力。
	 */
	setAngularDamping(value: number) {
		if (this._btColliderObject)
			this._btColliderObject.angularDamping = value;
	}


	/**
	 * 线速度
	 */
	setLinearVelocity(value: Vector3) {
		if (this._btColliderObject) {
			var btValue: CANNON.Vec3= this._btColliderObject.velocity;
			(this.isSleeping)&&(this.wakeUp());
			btValue.set(value.x,value.y,value.z);
			this._btColliderObject.velocity = btValue;
		}
	}

	/**
	 * 角速度。
	 */

	setAngularVelocity(value: Vector3) {
		if (this._btColliderObject) {
			var btValue: CANNON.Vec3= this._btColliderObject.angularVelocity;
			(this.isSleeping)&&(this.wakeUp());
			btValue.set(value.x,value.y,value.z);
			this._btColliderObject.angularVelocity = btValue;
		}
	}

    /**
	 * 质量。
	 */
	setMass(value: number) {
		value = Math.max(value, 1e-07);//质量最小为1e-07
		this._mass = value;
		(this._isKinematic) || (this._updateMass(value));
	}

    setCenterOfMass(value: Vector3) {
       
    }

	setInertiaTensor(value: Vector3): void {
		
    }
	

	/**
	 * 是否处于睡眠状态。
	 */
	get isSleeping(): boolean {
		if (this._btColliderObject)
			return this._btColliderObject.sleepState!=CANNON.Body.AWAKE;
		return false;
	}

    /**
	 * 是否为运动物体，如果为true仅可通过transform属性移动物体,而非其他力相关属性。
	 */
	setIsKinematic(value: boolean) {
		this._isKinematic = value;
		var canInSimulation: boolean = !!(this._isSimulate && this._colliderShape);
		canInSimulation && this._removeFromSimulation();
		var natColObj: CANNON.Body = this._btColliderObject;
		if (value) {
			natColObj.type = CANNON.Body.KINEMATIC;
			this._enableProcessCollisions = false;
			this._updateMass(0);//必须设置Mass为0来保证InverMass为0
		} else {
			natColObj.allowSleep = true;
			natColObj.type = CANNON.Body.DYNAMIC;
			this._enableProcessCollisions = true;
			this._updateMass(this._mass);
		}
		natColObj.velocity.set(0.0,0.0,0.0);
		natColObj.angularVelocity.set(0.0,0.0,0.0);
		canInSimulation && this._addToSimulation();
	}

	

	/**
	 * 应用作用力。
	 * @param	force 作用力。
	 * @param	localOffset 偏移,如果为null则为中心点
	 */
    addForce(force: Vector3, mode: PhysicsForceMode, localOffset: Vector3): void {
        //    this._btColliderObject.applyForce()
        var btForce: CANNON.Vec3 = CannonRigidBodyCollider._btTempVector30;
        btForce.set(force.x,force.y,force.z);
        var btOffset :CANNON.Vec3 = CannonRigidBodyCollider._btTempVector31;
        if(localOffset)
            btOffset.set(localOffset.x,localOffset.y,localOffset.z);
        else
            btOffset.set(0.0,0.0,0.0);
        if(mode == PhysicsForceMode.Force){
            this._btColliderObject.applyForce(btForce,btOffset);
        }else{
            this._btColliderObject.applyImpulse(btForce,btOffset);
        }
       
      
    }


	
	/**
	 * 应用扭转力。
	 * @param	torque 扭转力。
	 */
	addTorque(torque: Vector3,mode: PhysicsForceMode): void {
		if (this._btColliderObject == null)
			throw "Attempted to call a Physics function that is avaliable only when the Entity has been already added to the Scene.";
		var btTorque: CANNON.Vec3 = CannonRigidBodyCollider._btTempVector30;
		btTorque.set(torque.x,torque.y,torque.z);
		var oriTorque:CANNON.Vec3 = this._btColliderObject.torque;
		oriTorque.set(oriTorque.x+btTorque.x,oriTorque.y+btTorque.y,oriTorque.z+btTorque.z);
		if(mode == PhysicsForceMode.Force){
			this._btColliderObject.torque = oriTorque;
		}else{
			throw "Cannon not support ............"
		}
	}
	 /**
     * 休眠刚体。
     */
	sleep(): void{
		this._btColliderObject && this._btColliderObject.sleep();
	}

	
	/**
	 * 唤醒刚体。
	 */
	wakeUp(): void {
		this._btColliderObject && this._btColliderObject.wakeUp();
	}

	setWorldPosition(value: Vector3): void{
		this._btColliderObject && this._btColliderObject.position.set(value.x,value.y,value.z);
	}
	setWorldRotation(value: Quaternion): void{
		this._btColliderObject && this._btColliderObject.quaternion.set(value.x,value.y,value.z,value.w);
	}

	
	setSleepThreshold(value: number): void {
		this._btColliderObject.sleepSpeedLimit = value;
	}

	setTrigger(value:boolean){
		this._isTrigger = value;
        if (this._btColliderObject) {
			this._btColliderObject.isTrigger = value;
			if (value) {
				var flag = this._btColliderObject.type;
				//TODO:可能要改
				this._btColliderObject.collisionResponse = false;
				if((flag&CANNON.Body.STATIC)===0)
				this._btColliderObject.type |= CANNON.Body.STATIC;
			} else {
				//TODO：可能要改
				this._btColliderObject.collisionResponse = true;
				if((flag &CANNON.Body.STATIC) !== 0)
				this._btColliderObject.type ^= CANNON.Body.STATIC;
			}
		}
	}

	/**
	 * 创建一个 <code>RigidBody3D</code> 实例。
	 * @param collisionGroup 所属碰撞组。
	 * @param canCollideWith 可产生碰撞的碰撞组。
	 */
	constructor(physicsManager: CannonPysiceManager) {
		super(physicsManager);
		if(!this._isKinematic)
			this._btColliderObject.type = CANNON.Body.DYNAMIC;
		else
			this._btColliderObject.type = CANNON.Body.KINEMATIC;
	}


	protected getColliderType(): CannonColliderType {
        return CannonColliderType.RigidbodyCollider;
    }
	
	setCollisionDetectionMode(value: number): void {
		
	}
	setConstraints(linearFactor: Vector3, angularFactor: Vector3): void {
		// this._btColliderObject
	}



	/**
	 * @internal
	 */
	private _updateMass(mass: number): void {
		if (this._btColliderObject && this._colliderShape) {
			this._btColliderObject.mass = mass;
			this._btColliderObject.updateMassProperties();
			this._btColliderObject.updateSolveMassProperties();
		}
	}

	/**
	 * @inheritDoc
	 * @override
	 * @internal
	 */
	protected _onScaleChange(scale: Vector3): void {
		super._onScaleChange(scale);
		this._updateMass(this._isKinematic ? 0 : this._mass);//修改缩放需要更新惯性
	}

	


	/**
	 * @inheritDoc
	 * @override
	 * @internal
	 */
	_onShapeChange(colShape: CannonColliderShape): void {
		super._onShapeChange(colShape);		
		if (this._isKinematic) {
			this._updateMass(0);
		} else {
			this._updateMass(this._mass);
		}
	}
			
	
}