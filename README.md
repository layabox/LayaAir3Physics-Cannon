# Cannon.js physics and test project for LayaAir 3

A runnable LayaAir project with separate development source, build output, and installable package directories.

[中文说明](README.zh-CN.md)

| Path | Purpose |
| --- | --- |
| `CannonPhysics.laya` | LayaAir IDE project entry |
| `CannonPhysics/source/` | Adapter TypeScript source |
| `CannonPhysics/source/libs/` | Original Cannon.js runtime and declarations |
| `scripts/build.js` | Type checking, bundling, and runtime copy |
| `CannonPhysics/dist/` | Installable package files only |
| `packages/manifest.json` | Local package dependency |
| `assets/PhysicsTest.ls` | Startup test scene |
| `src/Main.ts` | Falling boxes and spheres; click to reset |
| `engine/types/LayaAir.d.ts` | Fixed engine declarations |
| `settings/` | Project settings and Cannon backend selection |

## Develop and test

Requires Node.js 20.10+ and LayaAir IDE 3.4. CLI workflows require LayaAir CLI.

```sh
npm ci
npm run build
```

Open `CannonPhysics.laya` and run the startup scene. Twelve bodies fall onto the floor, with boundaries to retain rolling spheres. Click to reset. Rebuild after editing `CannonPhysics/source/`, then refresh the preview. Build before the first preview after cloning; generated JS is ignored by Git.

```sh
npm run check
npm run preview
npm run build:web
```

## Backend registration

The package manifest uses `contributes.engine` to add the `laya.cannon` backend to `laya.physics3D`, pointing to `laya.cannon.js` inside the package.

PlayerSettings enables `laya.d3` and `laya.physics3D`, and selects `physics3dModule: "laya.cannon"`. The engine module system loads the library, so ordinary script import is disabled in its `.meta`. The generated page loads Cannon instead of Bullet.

After installing this package in another project, select Cannon.js as the 3D physics backend in the engine module settings.

## Build and export

The build checks TypeScript and bundles Cannon.js and the adapter directly into `CannonPhysics/dist/laya.cannon.js`.

```sh
npm run package
```

Exports `CannonPhysics/dist` directly to `out/com.layabox.cannon-js.layapkg`, containing only:

```text
package.json
package.json.meta
laya.cannon.js
laya.cannon.js.meta
```

Source files, build tools, test assets, and engine declarations stay outside the package.

After building, you may also export the directory through IDE Tools → Export Installable Package, or run:

```sh
layaair export-installable-package CannonPhysics/dist --output out/com.layabox.cannon-js.layapkg
```
