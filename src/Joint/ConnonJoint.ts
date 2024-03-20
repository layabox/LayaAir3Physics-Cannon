import { IJoint, Sprite3D, Vector3 } from "../../libs/LayaAir";
import { CannonPysiceManager } from "../CannonPysiceManager";
import { CannonCollider } from "../Collider/CannonCollider";


export class ConnonJoint implements IJoint {
    /**@internal */
    owner: Sprite3D;
    /**@internal */
    _id: number;
    _manager: CannonPysiceManager;
    _constraint: CANNON.Constraint;
    protected _ownerCollider: CannonCollider;
    protected _otherCollider: CannonCollider;
    constructor(manager: CannonPysiceManager) {
        this._manager = manager;
    }
    setLocalPos(pos: Vector3): void {
        throw new Error("Method not implemented.");
    }
    setConnectLocalPos(pos: Vector3): void {
        throw new Error("Method not implemented.");
    }
    getlinearForce(): Vector3 {
        throw new Error("Method not implemented.");
    }
    getAngularForce(): Vector3 {
        throw new Error("Method not implemented.");
    }
    isValid(): boolean {
        throw new Error("Method not implemented.");
    }
    isEnable(value: boolean): void {
        throw new Error("Method not implemented.");
    }
    isCollision(value: boolean): void {
        throw new Error("Method not implemented.");
    }
    setOwner(owner: Sprite3D) {
        this.owner = owner;
    }

    setCollider(owner: CannonCollider): void {
        this._manager && this._manager.removeJoint(this);
        this._ownerCollider = owner;
    }
    setConnectedCollider(other: CannonCollider): void {
        this._manager && this._manager.removeJoint(this);
        this._otherCollider = other;
    }

    setConnectedAnchor(value: Vector3, otherValue: Vector3): void {
        throw new Error("Method not implemented.");
    }
    setConnectedMassScale(value: number): void {
        throw new Error("Method not implemented.");
    }
    setConnectedInertiaScale(value: number): void {
        throw new Error("Method not implemented.");
    }
    setMassScale(value: number): void {
        throw new Error("Method not implemented.");
    }
    setInertiaScale(value: number): void {
        throw new Error("Method not implemented.");
    }
    setBreakForce(value: number): void {
        throw new Error("Method not implemented.");
    }
    setBreakTorque(value: number): void {
        throw new Error("Method not implemented.");
    }



}