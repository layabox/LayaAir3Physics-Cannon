
import { CannonPysiceManager } from "./CannonPysiceManager";
import { CannonRigidBodyCollider } from "./Collider/CannonRigidBodyCollider";
import { CannonBoxColliderShape } from "./Shape/CannonBoxColliderShape";
import { CannonSphereColliderShape } from "./Shape/CannonSphereColliderShape";
import { CannonCapsuleColliderShape } from "./Shape/CannonCapsuleColliderShape";
import { CannonCylinderColliderShape } from "./Shape/CannonCylinderColliderShape";
import { CannonConeColliderShape } from "./Shape/CannonConeColliderShape";
import { CannonPlanColliderShape } from "./Shape/CannonPlanColliderShape";
import { CannonStaticCollider } from "./Collider/CannonStaticCollider";
import { CannonCollider } from "./Collider/CannonCollider";
import { CannonColliderShape } from "./Shape/CannonColliderShape";
import { CannonSpringJoint } from "./Joint/CannonSpringJoint";
import { CannonMeshCollderShape } from "./Shape/CannonMeshCollderShape";
import { EPhysicsCapable, ICharacterController, ICustomJoint, ID6Joint, IFixedJoint, IHingeJoint, IPhysicsCreateUtil, IPhysicsManager, Laya3D, Mesh, PhysicsSettings } from "../libs/LayaAir";
import { ConnonHeightFieldShape } from "./Shape/ConnonHeightFieldShape";


export class CannonPhysicsCreateUtil implements IPhysicsCreateUtil {
    // capable map
    protected _physicsEngineCapableMap: Map<any, any>;

    /**@internal */
    static _cannon: any;

    //初始化物理引擎
    initialize(): Promise<void> {
        CannonPhysicsCreateUtil._cannon = CANNON;
        CannonCollider.__init__();
        CannonRigidBodyCollider.__init__();
        CannonColliderShape.__init__();
        CannonPysiceManager.__init__();
        CannonStaticCollider.initCapable();
        this.initPhysicsCapable()
        return Promise.resolve();
    }

    /**
     * 初始化物理引擎具备的能力
     */
    initPhysicsCapable(): void {
        this._physicsEngineCapableMap = new Map();
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_Gravity, true);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_StaticCollider, true);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_DynamicCollider, true);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_CharacterCollider, false);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_BoxColliderShape, true);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_SphereColliderShape, true);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_CapsuleColliderShape, true);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_CylinderColliderShape, true);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_ConeColliderShape, true);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_MeshColliderShape, true);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_CompoundColliderShape, false);

        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_Joint, true);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_D6Joint, false);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_FixedJoint, false);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_SpringJoint, true);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_HingeJoint, false);
        this._physicsEngineCapableMap.set(EPhysicsCapable.Physics_CreateCorveMesh, false);
    }

    /**
     * 根据属性id判断是否具备该中能力
     */
    getPhysicsCapable(value: EPhysicsCapable): boolean {
        return this._physicsEngineCapableMap.get(value);
    }

    /**
     * 创建一个物理引擎管理类实例
     *  @param physicsSettings  初始化系数
     */
    createPhysicsManger(physicsSettings: PhysicsSettings): CannonPysiceManager {
        return new CannonPysiceManager(physicsSettings);
    }

    /**
     *  创建动态碰撞体实例
     *  @param manager 
     */
    createDynamicCollider(manager: CannonPysiceManager): CannonRigidBodyCollider {
        return new CannonRigidBodyCollider(manager);
    }

    /**
    *  创建静态碰撞体对实例
    *  @param manager 
    */
    createStaticCollider(manager: CannonPysiceManager): CannonStaticCollider {
        return new CannonStaticCollider(manager);
    }

    /**
     * 创建角色碰撞体实例  cannon暂未实现
     * @param manager 
     */
    createCharacterController(manager: CannonPysiceManager): ICharacterController {
        throw new Error("Method not suport.");
    }

    /**
    * 创建固定关节点实例 cannon暂未实现
    * @param manager 
    */
    createFixedJoint(manager: CannonPysiceManager): IFixedJoint {
        throw new Error("Method not implemented.");
    }

    /**
    * 创建铰链关节点实例 cannon暂未实现
    * @param manager 
    */
    createHingeJoint(manager: CannonPysiceManager): IHingeJoint {
        throw new Error("Method not implemented.");
    }

    /**
    * 创建弹簧关节点实例 cannon暂未实现
    * @param manager 
    */
    createSpringJoint(manager: CannonPysiceManager): CannonSpringJoint {
        return new CannonSpringJoint(manager)
    }

    /**
    * 创建自定义关节点实例 cannon暂未实现
    * @param manager 
    */
    createCustomJoint(manager: CannonPysiceManager): ICustomJoint {
        throw new Error("Method not implemented.");
    }

    /**
    * 创建立方体实例
    */
    createBoxColliderShape(): CannonBoxColliderShape {
        return new CannonBoxColliderShape();
    }

    /**
     * 创建球体实例
     */
    createSphereColliderShape(): CannonSphereColliderShape {
        return new CannonSphereColliderShape()
    }

    /**
     * 创建胶囊体实例
     */
    createCapsuleColliderShape(): CannonCapsuleColliderShape {
        return new CannonCapsuleColliderShape()
    }

    /**
     * 创建Mesh实例
     */
    createMeshColliderShape(): CannonMeshCollderShape {
        return new CannonMeshCollderShape();
    }

    /**
     * 创建面片实例
     */
    createPlaneColliderShape(): CannonPlanColliderShape {
        return new CannonPlanColliderShape();
    }

    /**
     * 创建圆柱体实例
     */
    createCylinderColliderShape(): CannonCylinderColliderShape {
        return new CannonCylinderColliderShape();
    }

    /**
    * 创建圆锥体实例
    */
    createConeColliderShape(): CannonConeColliderShape {
        return new CannonConeColliderShape();
    }

    createD6Joint(manager: IPhysicsManager): ID6Joint {
        throw new Error("Method not implemented.");
    }
    createHeightFieldShape?(): ConnonHeightFieldShape {
        return new ConnonHeightFieldShape();
    }
    createCorveMesh?(mesh: Mesh): Mesh {
        throw new Error("Method not implemented.");
    }
}


Laya3D.PhysicsCreateUtil = new CannonPhysicsCreateUtil();