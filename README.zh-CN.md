# LayaAir 3 Cannon.js 物理引擎与测试工程

这是可以直接在 LayaAir IDE 中打开的项目。本地安装包、开发源码和构建目录相互独立。

[English](README.md)

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `CannonPhysics.laya` | LayaAir IDE 项目入口 |
| `CannonPhysics/source/` | Cannon 适配层 TypeScript 源码 |
| `CannonPhysics/source/libs/` | Cannon.js 原库及其类型声明 |
| `scripts/build.js` | 类型检查、编译和复制最终 JS |
| `CannonPhysics/dist/` | 安装包目录：最终 JS、包描述、资源元数据 |
| `packages/manifest.json` | 引用本地 CannonPhysics 包 |
| `assets/PhysicsTest.ls` | 默认测试场景 |
| `src/Main.ts` | 箱体、球体落地碰撞测试；点击重置 |
| `engine/types/LayaAir.d.ts` | 固定的引擎声明文件，无需更新 |
| `settings/` | 场景入口、引擎模块及构建配置 |

## 打开与测试

需要 Node.js 20.10+、LayaAir IDE 3.4；命令行预览、构建、导出还需要支持 `export-installable-package` 的 LayaAir CLI。

```sh
npm ci
npm run build
```

用 IDE 打开 `CannonPhysics.laya`，运行默认的 `PhysicsTest` 场景。12 个箱体、球体会落向地面，左上角显示最低高度；点击场景重新投放。场地边界防止球体滚出。

修改 `CannonPhysics/source/` 后重新执行 `npm run build`，再刷新预览。首次打开或拉取源码后先构建；生成的 JS 不提交。

```sh
npm run check      # 检查适配层和测试脚本
npm run preview    # 编译后启动 LayaAir CLI 预览
npm run build:web  # 编译后发布测试工程到 release/web
```

## 物理后端注册

`CannonPhysics/dist/package.json` 的 `contributes.engine` 为 `laya.physics3D` 添加 `laya.cannon` 后端，文件为包内的 `laya.cannon.js`。

测试工程的 `settings/PlayerSettings.json` 开启 `laya.d3`、`laya.physics3D`，并设置 `physics3dModule: "laya.cannon"`。IDE 和发布流程通过引擎模块机制加载该文件，而非普通脚本自动导入；JS 的 `.meta` 中 `import` 因此设为 `false`。构建后的页面加载 Cannon 后端，不加载 Bullet。

其他项目安装此包后，在引擎模块设置中选择 Cannon.js 作为 3D 物理后端。

## 构建与导出

`npm run build` 先检查类型，再将 Cannon.js 和适配层直接打包至 `CannonPhysics/dist/laya.cannon.js`。

```sh
npm run package
```

该命令先编译，再直接导出当前工程的 `CannonPhysics/dist`，生成 `out/com.layabox.cannon-js.layapkg`。安装包仅含：

```text
package.json
package.json.meta
laya.cannon.js
laya.cannon.js.meta
```

源码、Cannon 原库、构建脚本、测试场景及引擎声明均在包目录外。

也可以先编译，再通过 IDE 的“工具 → 导出可安装包”选择 `CannonPhysics/dist`，或执行：

```sh
layaair export-installable-package CannonPhysics/dist --output out/com.layabox.cannon-js.layapkg
```
