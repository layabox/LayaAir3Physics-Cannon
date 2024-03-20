# Adapted Cannon.js physics engine for LayaAir3
> Tips: Engine version must be >= LayaAir 3.1

Starting from LayaAir 3.1, developers are able to independently integrate third-party physics engines. This project has completed the adaptation and integration of LayaAir 3.1 based on the Cannon.js physics engine. Developers can refer to the code and process of this open-source project to attempt integration with other physics engines.

[中文说明](README.zh-CN.md)

## Environment

1. In the root directory of the engine, execute the following command in the command line to install node modules:

```sh
cnpm i
```

2. Obtaining and updating the LayaAir engine is too basic for this document, so it will not be covered here.

   The engine's GitHub address is: https://github.com/layabox/LayaAir.git

3. In the `"scripts"` directory, create a file named `"enginePath.txt"` and configure the absolute path of the LayaAir engine on your computer. The format of the path should follow the example below:

```text
D:\Github\LayaAir
```

> Replace "D:\Github\LayaAir" with the actual absolute path of the LayaAir engine directory on your computer.

4. In the root directory of the engine, execute the following command in the command line to compile the engine into the project directory:

```shell
cnpm run update-engine
```



## Compile

In the root directory of the engine, execute the following command in the command line to compile the physics engine into a standalone JavaScript library file:

```
cnpm run build
```

The compiled JavaScript library file `laya.cannon.js` is located in the `out` directory.