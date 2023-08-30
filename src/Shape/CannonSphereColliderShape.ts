import { ISphereColliderShape } from "../../libs/LayaAir";
import { CannonColliderShape } from "./CannonColliderShape";

export class CannonSphereColliderShape extends CannonColliderShape implements ISphereColliderShape {
    /** @internal */
    private _radius: number;

    constructor() {
        super();
    }

    protected createColliderShape() {
        this._radius = 0.5;
        this._type = CannonColliderShape.SHAPETYPES_SPHERE;
        this._btShape = new CANNON.Sphere(this._radius);
    }

    protected _updateShapeContent() {
        let sphere: CANNON.Sphere = this._btShape as CANNON.Sphere;
        var max: number = Math.max(this._scale.x, this._scale.y, this._scale.z);
        this._scale.setValue(max, max, max);
        sphere.radius = max * this._radius;
        sphere.updateBoundingSphereRadius()
    }

    setRadius(radius: number): void {
        if (this._radius == radius) return;
        this._radius = radius;
        this._updateShapeContent();
    }
}