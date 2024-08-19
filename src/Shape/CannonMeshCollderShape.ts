import { IMeshColliderShape, Mesh, Vector3 } from "../../libs/LayaAir";
import { CannonColliderShape } from "./CannonColliderShape";

export class CannonMeshCollderShape extends CannonColliderShape implements IMeshColliderShape {
    /** @interanl */
    private _mesh: Mesh;
    private _meshPoints: Vector3[] = []
    private _faces: number[][];
    constructor() {
        super();
    }
    setPhysicsMeshFromMesh(value: Mesh): void {
        throw new Error("Method not implemented.");
    }
    setConvexMesh(value: Mesh): void {
        throw new Error("Method not implemented.");
    }
    setLimitVertex(limit: number): void {
        throw new Error("Method not implemented.");
    }

    protected createColliderShape() {
        this._meshPoints = [];
        this._type = CannonColliderShape.SHAPETYPES_MESH;
        this._faces = [];
    }


    protected _updateShapeContent() {
        let btColliderObject = null;
        if (this._attatchedCollisionObject && this._attatchedCollisionObject._cannonColliderObject) {
            btColliderObject = this._attatchedCollisionObject._cannonColliderObject;
        }
        if (this._btShape && btColliderObject) {
            btColliderObject.shapes.length = 0;
            btColliderObject.shapeOffsets.length = 0;
            btColliderObject.shapeOrientations.length = 0;
            this._btShape = undefined;
        }

        const pointCount = this._meshPoints.length;
        this._meshPoints.length = pointCount;
        let verts: CANNON.Vec3[] = []
        for (var i = 0; i < pointCount; i++) {
            let p: Vector3 = this._meshPoints[i];
            verts[i] = new CANNON.Vec3(p.x * this._scale.x, p.y * this._scale.y, p.z * this._scale.z);
        }
        this._btShape = new CANNON.ConvexPolyhedron(verts, this._faces as any);
        this.addToCannonBody();
    }

    createPhysicsMeshFromMesh(value: Mesh): void {
        if (this._mesh == value) {
            return;
        }
        this._mesh = value;
        this._mesh.getPositions(this._meshPoints);
        const faceCount = this._mesh.indexCount / 3;
        const indices = this._mesh.getIndices();
        this._faces.length = faceCount;
        for (var i = 0; i < faceCount; i++) {
            const index = i * 3;
            this._faces[i] = [indices[index], indices[index + 2], indices[index + 1]]
        }

        this._updateShapeContent()
    }
}