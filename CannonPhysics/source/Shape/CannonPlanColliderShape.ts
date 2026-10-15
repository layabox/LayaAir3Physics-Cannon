import IPlaneColliderShape = Laya.IPlaneColliderShape;
import { CannonColliderShape } from "./CannonColliderShape";

export class CannonPlanColliderShape extends CannonColliderShape implements IPlaneColliderShape {

    constructor() {
        super();
    }

    protected createColliderShape() {
        this._type = CannonColliderShape.SHAPETYPES_PLAN;
        this._btShape = new CANNON.Plane();
    }
}
