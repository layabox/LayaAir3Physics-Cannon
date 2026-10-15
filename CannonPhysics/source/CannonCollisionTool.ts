import HitResult = Laya.HitResult;
import ContactPoint = Laya.ContactPoint;
import { CannonCollider } from "./Collider/CannonCollider";

// Collision bookkeeping belongs to the backend and is absent from the public d.ts.
export class CannonCollision extends Laya.Collision {
    _colliderA: CannonCollider;
    _colliderB: CannonCollider;
    _isTrigger = false;
    _updateFrame = -2147483648;
    _lastUpdateFrame = -2147483648;

    _setUpdateFrame(frame: number): void {
        this._lastUpdateFrame = this._updateFrame;
        this._updateFrame = frame;
    }
}

/**
 * <code>CollisionMap</code> 类用于实现碰撞组合实例图。
 */
export class CannonCollisionTool {
    private _hitResultsPoolIndex: number = 0;
    private _hitResultsPool: HitResult[] = [];
    private _contactPonintsPoolIndex: number = 0;
    private _contactPointsPool: ContactPoint[] = [];
    private _collisionsPool: CannonCollision[] = [];

    private _collisions: any = {};

    /**
     * 创建一个 <code>CollisionMap</code> 实例。
     */
    constructor() {

    }

    /**
     * @internal
     */
    getHitResult(): HitResult {
        var hitResult: HitResult = this._hitResultsPool[this._hitResultsPoolIndex++];
        if (!hitResult) {
            hitResult = new HitResult();
            this._hitResultsPool.push(hitResult);
        }
        return hitResult;
    }

    /**
     * @internal
     */
    recoverAllHitResultsPool(): void {
        this._hitResultsPoolIndex = 0;
    }

    /**
     * @internal
     */
    getContactPoints(): ContactPoint {
        var contactPoint: ContactPoint = this._contactPointsPool[this._contactPonintsPoolIndex++];
        if (!contactPoint) {
            contactPoint = new ContactPoint();
            this._contactPointsPool.push(contactPoint);
        }
        return contactPoint;
    }

    /**
     * @internal
     */
    recoverAllContactPointsPool(): void {
        this._contactPonintsPoolIndex = 0;
    }

    /**
     * @internal
     */
    getCollision(physicComponentA: CannonCollider, physicComponentB: CannonCollider): CannonCollision {
        var collision: CannonCollision;
        var idA: number = physicComponentA._id;
        var idB: number = physicComponentB._id;
        var subCollisionFirst: any = this._collisions[idA];
        if (subCollisionFirst)
            collision = subCollisionFirst[idB];
        if (!collision) {
            if (!subCollisionFirst) {
                subCollisionFirst = {};
                this._collisions[idA] = subCollisionFirst;
            }
            collision = this._collisionsPool.length === 0 ? new CannonCollision() : this._collisionsPool.pop();
            collision._colliderA = physicComponentA;
            collision._colliderB = physicComponentB;
            subCollisionFirst[idB] = collision;
        }
        return collision;
    }

    /**
     * @internal
     */
    recoverCollision(collision: CannonCollision): void {
        var idA: number = (<CannonCollider>collision._colliderA)._id;
        var idB: number = (<CannonCollider>collision._colliderB)._id;
        this._collisions[idA][idB] = null;
        this._collisionsPool.push(collision);
    }

    /**
     * @internal
     */
    garbageCollection(): void {//TODO:哪里调用
        this._hitResultsPoolIndex = 0;
        this._hitResultsPool.length = 0;

        this._contactPonintsPoolIndex = 0;
        this._contactPointsPool.length = 0;

        this._collisionsPool.length = 0;
        for (var subCollisionsKey in this._collisionsPool) {
            var subCollisions: any = this._collisionsPool[subCollisionsKey];
            var wholeDelete: boolean = true;
            for (var collisionKey in subCollisions) {
                if (subCollisions[collisionKey])
                    wholeDelete = false;
                else
                    delete subCollisions[collisionKey];
            }
            if (wholeDelete)
                delete this._collisionsPool[subCollisionsKey];
        }
    }
}
