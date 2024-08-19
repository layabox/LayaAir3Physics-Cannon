
import { ICapsuleColliderShape ,Physics3DColliderShape} from "../../libs/LayaAir";
import { CannonColliderShape } from "./CannonColliderShape";

export class CannonCapsuleColliderShape extends CannonColliderShape implements ICapsuleColliderShape {
    static _halfAngleToRandin: number = 90 / Math.PI;
    /**@internal */
    private _radius: number = 0.5;
    /**@internal */
    private _height: number = 2;
    /**@internal */
    private _orientation: number = Physics3DColliderShape.SHAPEORIENTATION_UPY;
    private _sphereShape:CANNON.Sphere;
    constructor() {
        super();
        
    }
	protected createColliderShape(){
        this._type = CannonColliderShape.SHAPETYPES_CAPSULE;
        this._sphereShape = new CANNON.Sphere(this._radius);
	}

    protected _updateShapeContent(){
        if(!this._attatched){
            return;
        }

        let scalex = Math.abs(this._scale.x);
        let scaley = Math.abs(this._scale.y);
        let scalez = Math.abs(this._scale.z);

        let cvec3:CANNON.Vec3 = CannonColliderShape._btVector30;
        let body:CANNON.Body = this._attatchedCollisionObject._cannonColliderObject;
        body.shapes.length = 0;
		body.shapeOffsets.length = 0;
		body.shapeOrientations.length = 0;
        let height:number = this._height*scaley;
        let radius:number = this._radius*Math.max(scalex, scalez);
        let length:number = Math.max(0,height-2*radius);
        let halflength:number = length*0.5;
        this._sphereShape.radius = radius;
        cvec3.set(0,0,halflength);
        body.addShape(this._sphereShape,cvec3);
        cvec3.set(0,0,-halflength);
        body.addShape(this._sphereShape,cvec3);
        let cylinderShape = new CANNON.Cylinder(radius,radius,length,60);
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