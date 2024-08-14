import { IStaticCollider, EColliderCapable } from "../../libs/LayaAir";
import { CannonPysiceManager } from "../CannonPysiceManager";
import { CannonCollider, CannonColliderType } from "./CannonCollider";


export class CannonStaticCollider extends CannonCollider implements IStaticCollider {
	 /**@internal */
	static _staticCapableMap: Map<any, any>;
    constructor(physicsManager: CannonPysiceManager) {
		super(physicsManager);
        this._cannonColliderObject.type = CANNON.Body.STATIC;
	}

	static getStaticColliderCapable(value: EColliderCapable): boolean {
        return this._staticCapableMap.get(value);
    }

    static initCapable(): void {
        this._staticCapableMap = new Map();
        this._staticCapableMap.set(EColliderCapable.Collider_AllowTrigger, true);
        this._staticCapableMap.set(EColliderCapable.Collider_CollisionGroup, true);
        this._staticCapableMap.set(EColliderCapable.Collider_Friction, true);
        this._staticCapableMap.set(EColliderCapable.Collider_Restitution, true);
        this._staticCapableMap.set(EColliderCapable.Collider_RollingFriction, false);
        this._staticCapableMap.set(EColliderCapable.Collider_DynamicFriction, false);
        this._staticCapableMap.set(EColliderCapable.Collider_StaticFriction, false);
        this._staticCapableMap.set(EColliderCapable.Collider_BounceCombine, false);
        this._staticCapableMap.set(EColliderCapable.Collider_FrictionCombine, false);
    }

	getCapable(value: number): boolean {
        return CannonStaticCollider.getStaticColliderCapable(value);
    }

    protected getColliderType(): CannonColliderType {
        return CannonColliderType.StaticCollider;
    }

    
    setTrigger(value: boolean): void {
        this._isTrigger = value;
        if (this._cannonColliderObject) {
			this._cannonColliderObject.isTrigger = value;
			if (value) {
				var flag = this._cannonColliderObject.type;
				//TODO:可能要改
				this._cannonColliderObject.collisionResponse = false;
				if((flag&CANNON.Body.STATIC)===0)
				this._cannonColliderObject.type |= CANNON.Body.STATIC;
			} else {
				//TODO：可能要改
				this._cannonColliderObject.collisionResponse = true;
				if((flag &CANNON.Body.STATIC) !== 0)
				this._cannonColliderObject.type ^= CANNON.Body.STATIC;
			}
		}
    }
}