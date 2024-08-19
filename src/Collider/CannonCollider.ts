
import { ICollider, Vector3, Quaternion, Matrix4x4, Sprite3D, Transform3D, PhysicsColliderComponent } from "../../libs/LayaAir";
import { CannonPysiceManager } from "../CannonPysiceManager";
import { CannonColliderShape } from "../Shape/CannonColliderShape";

export enum CannonColliderType {
	RigidbodyCollider,
	CharactorCollider,
	StaticCollider
}

export class CannonCollider implements ICollider {
	static _colliderID: number = 0;
	static _addUpdateList: boolean = true;


	/** @internal */
	protected static _tempVector30: Vector3 = new Vector3();
	/** @internal */
	protected static _tempQuaternion0: Quaternion = new Quaternion();
	/** @internal */
	protected static _tempQuaternion1: Quaternion = new Quaternion();
	/** @internal */
	protected static _tempMatrix4x40: Matrix4x4 = new Matrix4x4();
	/** @internal */
	protected static _btVector30: CANNON.Vec3;
	/** @internal */
	protected static _btQuaternion0: CANNON.Quaternion;

	active: boolean;


	/** @internal */
	static _physicObjectsMap: Map<number, CannonCollider>;


	/**
	 * @internal
	 */
	private static physicQuaternionMultiply(lx: number, ly: number, lz: number, lw: number, right: Quaternion, out: Quaternion): void {
		var rx: number = right.x;
		var ry: number = right.y;
		var rz: number = right.z;
		var rw: number = right.w;
		var a: number = (ly * rz - lz * ry);
		var b: number = (lz * rx - lx * rz);
		var c: number = (lx * ry - ly * rx);
		var d: number = (lx * rx + ly * ry + lz * rz);
		out.x = (lx * rw + rx * lw) + a;
		out.y = (ly * rw + ry * lw) + b;
		out.z = (lz * rw + rz * lw) + c;
		out.w = lw * rw - d;
	}


	_physicsManager: CannonPysiceManager;
	/** @internal */
	protected _transformFlag: number = 2147483647 /*int.MAX_VALUE*/;
	/** @internal */
	protected _collisionGroup: number;
	/** @internal */
	protected _canCollideWith: number;

	/** @internal 触发器*/
	_isTrigger: boolean;

	_enableProcessCollisions: boolean;



	_destroyed: boolean = false;

	owner: Sprite3D;

	_transform: Transform3D;
	/** @internal */
	_id: number;
	_type: CannonColliderType;

	_colliderShape: CannonColliderShape;

	//update list index
	inPhysicUpdateListIndex: number;


	/** @internal */
	_cannonColliderObject: CANNON.Body;//TODO:不用声明,TODO:删除相关判断

	_isSimulate: boolean = false;//是否已经生效

	componentEnable: boolean;
	component: PhysicsColliderComponent;
	/** @internal  弹力*/
	private _restitution: number = 0.0;
	/** @internal  摩擦力*/
	private _friction: number = 0.5;

	private _scale: Vector3;


	/**
	* @internal
	*/
	static __init__(): void {
		CannonCollider._btVector30 = new CANNON.Vec3(0, 0, 0);
		CannonCollider._btQuaternion0 = new CANNON.Quaternion(0, 0, 0, 1);
		CannonCollider._physicObjectsMap = new Map<number, CannonCollider>();
	}

	constructor(physicsManager: CannonPysiceManager) {
		this._cannonColliderObject = new CANNON.Body();
		this._cannonColliderObject.material = new CANNON.Material();
		this._physicsManager = physicsManager;
		this._id = this._cannonColliderObject.layaID = CannonCollider._colliderID++;
		this._isTrigger = false;
		this._enableProcessCollisions = false;
		this._scale = new Vector3(1, 1, 1);
		CannonCollider._physicObjectsMap.set(this._id, this);
		this._type = this.getColliderType();
		this._initCollider();
		this.setCollisionGroup(CannonPysiceManager.COLLISIONFILTERGROUP_DEFAULTFILTER);
		this.setCanCollideWith(CannonPysiceManager.COLLISIONFILTERGROUP_ALLFILTER);
	}

	getCapable(value: number): boolean {
		return true;
	}
	setOwner(node: Sprite3D): void {
		this.owner = node;
		this._transform = node.transform;
	}

	setCollisionGroup(value: number) {
		if (value != this._collisionGroup) {
			this._cannonColliderObject.collisionFilterGroup = this._collisionGroup = value;
		}
	}

	setCanCollideWith(value: number) {
		if (value != this._canCollideWith) {
			this._cannonColliderObject.collisionFilterMask = this._canCollideWith = value;
		}
	}

	protected _initCollider() {
		this.setBounciness(this._restitution);
		this.setfriction(this._friction);
	}

	protected getColliderType(): CannonColliderType {
		return null;
	}

	/**
	 * @internal
	 */
	protected _onScaleChange(scale: Vector3): void {
		if (Vector3.equals(scale, this._scale)) {
			return;
		}
		scale.cloneTo(this._scale);
		if (this._colliderShape) {
			this._colliderShape.setWorldScale(this._scale);
			this._cannonColliderObject.updateMassProperties();
			this._cannonColliderObject.updateBoundingRadius();
		}
	}
	/**
	 * @internal
	 */
	protected _onShapeChange(shape: CannonColliderShape) {
		//TODO:
	}


	/**
	 * @inheritDoc
	 * @override
	 * @internal
	 */
	protected _addToSimulation(): void {
		this._physicsManager.addCollider(this);
	}

	/**
	 * @inheritDoc
	 * @override
	 * @internal
	 */
	protected _removeFromSimulation(): void {
		this._physicsManager.removeCollider(this);
	}


	setColliderShape(shape: CannonColliderShape) {
		if (shape == this._colliderShape)
			return;
		shape.setWorldScale(this._scale);
		var lastColliderShape: CannonColliderShape = this._colliderShape;
		if (lastColliderShape) {
			lastColliderShape._attatched = false;
			lastColliderShape._attatchedCollisionObject = null;
		}
		this._colliderShape = shape;
		if (shape) {
			if (shape._attatched) {
				throw "PhysicsComponent: this shape has attatched to other entity.";
			} else {
				shape._attatched = true;
				shape._attatchedCollisionObject = this;
			}
			if (this._cannonColliderObject) {
				this._cannonColliderObject.shapes.length = 0;
				this._cannonColliderObject.shapeOffsets.length = 0;
				this._cannonColliderObject.shapeOrientations.length = 0;
				shape.addToCannonBody();
				(this._isSimulate && lastColliderShape) && (this._removeFromSimulation());//修改shape必须把Collison从物理世界中移除再重新添加
				this._onShapeChange(shape);//
				if ((this._isSimulate || !lastColliderShape) && this.componentEnable) {
					this._derivePhysicsTransformation(true);
					this._addToSimulation();
				}
			}
		} else if (this._isSimulate) {
			lastColliderShape && this._removeFromSimulation();
		}
	}

	/**
	* 	@internal
	* 通过渲染矩阵更新物理矩阵。
	*/
	_derivePhysicsTransformation(force: boolean): void {
		var btColliderObject: CANNON.Body = this._cannonColliderObject;
		this._innerDerivePhysicsTransformation(btColliderObject, force);
	}


	/**
	 * 	@internal
	 *	通过渲染矩阵更新物理矩阵。
	 */
	_innerDerivePhysicsTransformation(physicTransformOut: CANNON.Body, force: boolean): void {
		var transform: Transform3D = ((<Sprite3D>this.owner)).transform;

		if (force || this._getTransformFlag(Transform3D.TRANSFORM_WORLDPOSITION)) {
			var shapeOffset: Vector3 = this._colliderShape._localOffset;
			var position: Vector3 = transform.position;
			var btPosition: CANNON.Vec3 = CannonCollider._btVector30;
			if (shapeOffset.x !== 0 || shapeOffset.y !== 0 || shapeOffset.z !== 0) {
				var physicPosition: Vector3 = CannonCollider._tempVector30;
				var worldMat: Matrix4x4 = transform.worldMatrix;
				Vector3.transformCoordinate(shapeOffset, worldMat, physicPosition);
				btPosition.set(physicPosition.x, physicPosition.y, physicPosition.z);
			} else {
				btPosition.set(position.x, position.y, position.z);
			}
			physicTransformOut.position.set(btPosition.x, btPosition.y, btPosition.z);
			this._setTransformFlag(Transform3D.TRANSFORM_WORLDPOSITION, false);
		}

		if (force || this._getTransformFlag(Transform3D.TRANSFORM_WORLDQUATERNION)) {
			var shapeRotation: Quaternion = this._colliderShape._localRotation;
			var btRotation: CANNON.Quaternion = CannonCollider._btQuaternion0;
			var rotation: Quaternion = transform.rotation;
			if (shapeRotation.x !== 0 || shapeRotation.y !== 0 || shapeRotation.z !== 0 || shapeRotation.w !== 1) {
				var physicRotation: Quaternion = CannonCollider._tempQuaternion0;
				CannonCollider.physicQuaternionMultiply(rotation.x, rotation.y, rotation.z, rotation.w, shapeRotation, physicRotation);
				btRotation.set(physicRotation.x, physicRotation.y, physicRotation.z, physicRotation.w)
			} else {
				btRotation.set(rotation.x, rotation.y, rotation.z, rotation.w)
			}
			physicTransformOut.quaternion.set(btRotation.x, btRotation.y, btRotation.z, btRotation.w);
			this._setTransformFlag(Transform3D.TRANSFORM_WORLDQUATERNION, false);
		}

		if (force || this._getTransformFlag(Transform3D.TRANSFORM_WORLDSCALE)) {
			this._onScaleChange(transform.getWorldLossyScale());
			this._setTransformFlag(Transform3D.TRANSFORM_WORLDSCALE, false);
		}
	}

	/**
	 * @internal
	 * 通过物理矩阵更新渲染矩阵。
	 */
	_updateTransformComponent(physicsTransform: CANNON.Body): void {
		var colliderShape: CannonColliderShape = this._colliderShape;
		var localOffset: Vector3 = colliderShape._localOffset;
		var localRotation: Quaternion = colliderShape._localRotation;

		var transform: Transform3D = (<Sprite3D>this.owner).transform;
		var position: Vector3 = transform.position;
		var rotation: Quaternion = transform.rotation;

		var btPosition: CANNON.Vec3 = physicsTransform.position;
		var btRotation: CANNON.Quaternion = physicsTransform.quaternion;

		var btRotX: number = btRotation.x;
		var btRotY: number = btRotation.y;
		var btRotZ: number = btRotation.z;
		var btRotW: number = btRotation.w;

		if (localRotation.x !== 0 || localRotation.y !== 0 || localRotation.z !== 0 || localRotation.w !== 1) {
			var invertShapeRotaion: Quaternion = CannonCollider._tempQuaternion0;
			localRotation.invert(invertShapeRotaion);
			CannonCollider.physicQuaternionMultiply(btRotX, btRotY, btRotZ, btRotW, invertShapeRotaion, rotation);
		} else {
			rotation.x = btRotX;
			rotation.y = btRotY;
			rotation.z = btRotZ;
			rotation.w = btRotW;
		}
		transform.rotation = rotation;

		if (localOffset.x !== 0 || localOffset.y !== 0 || localOffset.z !== 0) {
			var rotShapePosition: Vector3 = CannonCollider._tempVector30;

			rotShapePosition.x = localOffset.x;
			rotShapePosition.y = localOffset.y;
			rotShapePosition.z = localOffset.z;
			Vector3.transformQuat(rotShapePosition, rotation, rotShapePosition);

			position.x = btPosition.x - rotShapePosition.x;
			position.y = btPosition.y - rotShapePosition.z;
			position.z = btPosition.z - rotShapePosition.y;
		} else {
			position.x = btPosition.x;
			position.y = btPosition.y;
			position.z = btPosition.z;

		}
		transform.position = position;
	}

	/**
	 * @internal
	 */
	_getTransformFlag(type: number): boolean {
		return (this._transformFlag & type) != 0;
	}

	/**
	 * @internal
	 */
	_setTransformFlag(type: number, value: boolean): void {
		if (value)
			this._transformFlag |= type;
		else
			this._transformFlag &= ~type;
	}

	transformChanged(flag: number): void {
		this._transformFlag = flag;
		if (this.inPhysicUpdateListIndex == -1 && !this._enableProcessCollisions) {
			this._physicsManager._physicsUpdateList.add(this);
		}
	}

	setBounciness(value: number): void {
		this._restitution = value;
		this._cannonColliderObject && (this._cannonColliderObject.material.restitution = value);
	}

	setfriction(value: number): void {
		this._friction = value;
		this._cannonColliderObject && (this._cannonColliderObject.material.friction = value);
	}
	destroy(): void {
		this._destroyed = true;
		CannonCollider._physicObjectsMap.delete(this._id);
		this._cannonColliderObject = null;
		this._colliderShape.destroy();
		this._cannonColliderObject = null;
		this._colliderShape = null;
		this._physicsManager = null;
	}
}