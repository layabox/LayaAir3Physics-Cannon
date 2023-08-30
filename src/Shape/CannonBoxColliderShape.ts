import { IBoxColliderShape, Vector3 } from "../../libs/LayaAir";
import { CannonColliderShape } from "./CannonColliderShape";

export class CannonBoxColliderShape extends CannonColliderShape implements IBoxColliderShape {
    /** @interanl */
    private _size: Vector3;

    constructor() {
        super();
    }

    protected createColliderShape() {
        this._size = new Vector3(1, 1, 1);
        this._type = CannonColliderShape.SHAPETYPES_BOX;
        var btsize = new CANNON.Vec3(this._size.x / 2, this._size.y / 2, this._size.z / 2);
        this._btShape = new CANNON.Box(btsize);
    }
    

    protected _updateShapeContent() {
        let box: CANNON.Box = this._btShape as CANNON.Box;
        box.halfExtents.set(this._size.x / 2 * this._scale.x, this._size.y / 2 * this._scale.y, this._size.z / 2 * this._scale.z);
        box.updateConvexPolyhedronRepresentation();
        box.updateBoundingSphereRadius();
        super._updateShapeContent();
    }

    setSize(size: Vector3): void {
        if (size.equal(this._size)) {
            return;
        }
        size.cloneTo(this._size);
        this._updateShapeContent()
    }
}