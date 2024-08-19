import { ISpringJoint, Vector3 } from "../../libs/LayaAir";
import { CannonPysiceManager } from "../CannonPysiceManager";
import { CannonCollider } from "../Collider/CannonCollider";
import { ConnonJoint } from "./ConnonJoint";

export class CannonSpringJoint extends ConnonJoint implements ISpringJoint {
    _spring: CANNON.Spring;
    constructor(manager: CannonPysiceManager) {
        super(manager);
        this._spring = new CANNON.Spring({})
    }

    setCollider(owner: CannonCollider): void {
        super.setCollider(owner);
        this._spring.bodyA = owner._cannonColliderObject;
        this._manager.addJoint(this);
    }

    setConnectedCollider(other: CannonCollider): void {
        super.setConnectedCollider(other);
        this._spring.bodyB = other._cannonColliderObject;
        this._manager.addJoint(this);
    }

    setConnectedAnchor(value: Vector3, otherValue: Vector3): void {
        this._spring.localAnchorA.set(value.x, value.y, value.z);
        this._spring.localAnchorB.set(otherValue.x, otherValue.y, otherValue.z);
    }
    setSwingOffset(value: Vector3): void {
        throw new Error("Method not implemented.");
    }
    setMinDistance(distance: number): void {
        throw new Error("Method not implemented.");
    }
    setMaxDistance(distance: number): void {
        throw new Error("Method not implemented.");
    }
    setTolerance(tolerance: number): void {
        this._spring.restLength = tolerance;
    }
    setStiffness(stiffness: number): void {
        this._spring.stffness = stiffness;
    }
    setDamping(damping: number): void {
        this._spring.damping = damping;
    }

}