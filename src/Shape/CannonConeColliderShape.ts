import { IConeColliderShape, Physics3DColliderShape } from "../../libs/LayaAir";
import { CannonColliderShape } from "./CannonColliderShape";

export class CannonConeColliderShape extends CannonColliderShape implements IConeColliderShape {
    static _halfAngleToRandin: number = 90 / Math.PI;
    /**@internal */
    private _radius: number = 0.5;
    /**@internal */
    private _height: number = 2;
    /**@internal */
    private _orientation: number = Physics3DColliderShape.SHAPEORIENTATION_UPY;
    constructor() {
        super();
        
    }
	protected createColliderShape(){
        this._type = CannonColliderShape.SHAPETYPES_CONE;
	}

    protected _updateShapeContent(){
        if(!this._attatched){
            return;
        }
        let scalex = Math.abs(this._scale.x);
        let scaley = Math.abs(this._scale.y);
        let scalez = Math.abs(this._scale.z);
        let body:CANNON.Body = this._attatchedCollisionObject._btColliderObject;
        body.shapes.length = 0;
		body.shapeOffsets.length = 0;
		body.shapeOrientations.length = 0;
        let height:number = this._height*scaley;
        let radius:number = this._radius*Math.max(scalex, scalez);
        let cylinderShape = new CANNON.Cylinder(0,radius,height,60);
        body.addShape(cylinderShape);
        body.updateMassProperties();
        body.updateBoundingRadius();
        body.aabbNeedsUpdate = true;
	}
    setRadius(radius: number): void {
        if (this._radius == radius)
            return;
        this._radius = radius;
        this._updateShapeContent();
    }

    setHeight(height: number): void {
        if (this._height == height)
            return;
        this._height = height;
        this._updateShapeContent();
    }
    setUpAxis(upAxis: number): void {
        this._orientation = upAxis;
        CannonColliderShape.getLocalQuatation(this._orientation,this._localRotation); 
    }

    addToCannonBody(){
		this._updateShapeContent();
	}
}