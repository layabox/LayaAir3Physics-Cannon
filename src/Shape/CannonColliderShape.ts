import { CannonCollider } from "Collider/CannonCollider";
import { IColliderShape, Vector3, Quaternion, Physics3DColliderShape, Matrix4x4 } from "../../libs/LayaAir";

/**
 * <code>ColliderShape</code> 类用于创建形状碰撞器的父类，该类为抽象类。
 */
export class CannonColliderShape implements IColliderShape {

	/** @internal */
	static SHAPETYPES_BOX: number = 0;
	/** @internal */
	static SHAPETYPES_SPHERE: number = 1;
	/** @internal */
	static SHAPETYPES_CYLINDER: number = 2;
	/** @internal */
	static SHAPETYPES_CAPSULE: number = 3;
	/** @internal */
	static SHAPETYPES_CONVEXHULL: number = 4;
	/** @internal */
	static SHAPETYPES_COMPOUND: number = 5;
	/** @internal */
	static SHAPETYPES_STATICPLANE: number = 6;
	/** @internal */
	static SHAPETYPES_CONE: number = 7;
	/** @internal */
	static SHAPETYPES_PLAN: number = 8;
	/** @internal */
	static SHAPETYPES_MESH: number = 9;

	/** @internal */
	static _tempVector30: Vector3 = new Vector3();
	/** @internal */
	protected static _btScale: CANNON.Vec3;
	/**@internal */
	protected static _btVector30: CANNON.Vec3;
	/**@internal */
	protected static _btQuaternion0: CANNON.Quaternion;

	/**
	 * @internal
	 */
	static __init__(): void {
		CannonColliderShape._btScale = new CANNON.Vec3();
		CannonColliderShape._btVector30 = new CANNON.Vec3();
		CannonColliderShape._btQuaternion0 = new CANNON.Quaternion();
	}


	static getLocalQuatation(upAxis: number, rotation: Quaternion): void {
		switch (upAxis) {
			case Physics3DColliderShape.SHAPEORIENTATION_UPX:
				rotation.identity();
				break;
			case Physics3DColliderShape.SHAPEORIENTATION_UPY:
				Quaternion.createFromAxisAngle(Vector3.UnitX, Math.PI / 2, rotation);

				break;
			case Physics3DColliderShape.SHAPEORIENTATION_UPZ:
				Quaternion.createFromAxisAngle(Vector3.UnitZ, -Math.PI / 2, rotation);
				break;
			default:
				throw "CapsuleColliderShape:unknown orientation.";
		}

	}

	/**
	 * @internal
	 */
	static _createAffineTransformation(trans: Vector3, rot: Quaternion, outE: Float32Array): void {

		var x: number = rot.x, y: number = rot.y, z: number = rot.z, w: number = rot.w, x2: number = x + x, y2: number = y + y, z2: number = z + z;
		var xx: number = x * x2, xy: number = x * y2, xz: number = x * z2, yy: number = y * y2, yz: number = y * z2, zz: number = z * z2;
		var wx: number = w * x2, wy: number = w * y2, wz: number = w * z2;

		outE[0] = (1 - (yy + zz));
		outE[1] = (xy + wz);
		outE[2] = (xz - wy);
		outE[3] = 0;
		outE[4] = (xy - wz);
		outE[5] = (1 - (xx + zz));
		outE[6] = (yz + wx);
		outE[7] = 0;
		outE[8] = (xz + wy);
		outE[9] = (yz - wx);
		outE[10] = (1 - (xx + yy));
		outE[11] = 0;
		outE[12] = trans.x;
		outE[13] = trans.y;
		outE[14] = trans.z;
		outE[15] = 1;
	}


	/**@internal */
	_btShape: CANNON.Shape;
	/**@internal */
	_type: number;//TODO:可以删掉
	/**@internal */
	_centerMatrix: Matrix4x4 = new Matrix4x4();

	/**@internal */
	_attatched: boolean = false;
	/**@internal */
	_indexInCompound: number = -1;
	/**@internal */
	_compoundParent: any = null;
	/**@internal */
	_attatchedCollisionObject: CannonCollider = null;


	/**@internal */
	_scale: Vector3 = new Vector3(1, 1, 1);

	/**@internal */
	_localOffset: Vector3 = new Vector3(0, 0, 0);
	/**@internal */
	_localRotation: Quaternion = new Quaternion(0, 0, 0, 1);

	needsCustomCollisionCallback: boolean = false;//TODO:默认值,TODO:::::::::::::::::::::::::::::::
	/**
	 * 碰撞类型。
	 */
	get type(): number {
		return this._type;
	}


	setOffset(position: Vector3): void {
		position.cloneTo(this._localOffset);
	}


	setWorldScale(value: Vector3): void {
		if (Vector3.equals(this._scale, value)) {
			return;
		}
		value.cloneTo(this._scale);
		this._updateShapeContent();
	}

	/**
	 * 创建一个新的 <code>ColliderShape</code> 实例。
	 */
	constructor() {
		this.createColliderShape();
	}

	protected createColliderShape() {

	}

	protected _updateShapeContent() {
	}

	/**
	 * 更新本地偏移,如果修改LocalOffset或LocalRotation需要调用。
	 */
	updateLocalTransformations(): void {//TODO:是否需要优化
		if (this._compoundParent) {
			var offset: Vector3 = CannonColliderShape._tempVector30;
			Vector3.multiply(this._localOffset, this._scale, offset);
			CannonColliderShape._createAffineTransformation(offset, this._localRotation, this._centerMatrix.elements);
		} else {
			CannonColliderShape._createAffineTransformation(this._localOffset, this._localRotation, this._centerMatrix.elements);
		}
	}

	/**
	 * 更新物理世界模型
	 */
	addToCannonBody() {
		let btColliderObject = null;
		if (this._attatchedCollisionObject && this._attatchedCollisionObject._btColliderObject) {
			btColliderObject = this._attatchedCollisionObject._btColliderObject;
		}
		if (this._btShape && btColliderObject) {
			var localOffset = this._localOffset;
			var scale = this._scale;
			var vecs: CANNON.Vec3 = new CANNON.Vec3(localOffset.x * scale.x, localOffset.y * scale.y, localOffset.z * scale.z);
			btColliderObject.addShape(this._btShape, vecs);
		}
	}
	/**
	 * 销毁。
	 */
	destroy(): void {
		if (this._btShape) {
			this._btShape = null;
		}
	}

}


