import { IHeightFieldShape, Vector3 } from "../../libs/LayaAir";
import { CannonColliderShape } from "./CannonColliderShape";


export class ConnonHeightFieldShape extends CannonColliderShape implements IHeightFieldShape {
    /**@internal */
    private _numRows: number = 2;
    /**@internal */
    private _numCols: number = 2;
    /**@internal */
    private _heightData: Float32Array;
    /**@internal */
    private _flag: Uint8Array;
    /**@internal */
    private _heightFiled: any;
    /**@internal */
    private _minHeight: number;
    /**@internal */
    private _maxHeight: number;

    constructor() {
        super();
    }

    /**
     * get height data tranform
     * @returns 
     */
    private getHeightData(): any {
        this._minHeight = Number.MAX_VALUE;
        this._maxHeight = -Number.MAX_VALUE;
        this._heightData.forEach((value) => {
            this._maxHeight = Math.max(value, this._maxHeight);
            this._minHeight = Math.min(value, this._minHeight);
        })
        let deltaHeight = this._maxHeight - this._minHeight;
        let datas = []
        for (var i = 0; i < this._numRows; i++) {
            let data = datas[i] = [];
            let offIndex = i * this._numCols;
            for (var j = 0; j < this._numCols; j++) {
                data[j] = (this._heightData[offIndex + j] - this._minHeight) / deltaHeight;
            }
        };
        return datas;
    }


    /**
     * create HeightField Geometry
     */
    private _createHeightField() {
        //heightData
        let heightdata = this.getHeightData();
        this._heightFiled = new CANNON.Heightfield(heightdata, {
            maxValue: this._maxHeight,
            minValue: this._minHeight,
            elementSize: this._scale.x,
        });

    }

    /**
     * set height field Data
     * @param numRows 
     * @param numCols 
     * @param heightData 
     * @param flag 
     * @param scale 
     */
    setHeightFieldData(numRows: number, numCols: number, heightData: Float32Array, flag: Uint8Array, scale: Vector3): void {
        this._numRows = numRows;
        this._numCols = numCols;
        this._heightData = heightData;
        this._flag = flag;
        scale.cloneTo(this._scale);
        this._createHeightField();
    }

    /**
     * get rows number
     * @returns 
     */
    getNbRows(): number {
        return this._numRows;
    }

    /**
     * get cols number
     * @returns
     */
    getNbColumns(): number {
        return this._numCols;
    }

    /**
     * get height number
     * @param rows 
     * @param cols 
     * @returns 
     */
    getHeight(rows: number, cols: number): number {
        return this._heightFiled.getHeightAt(rows, cols, true);
    }

}