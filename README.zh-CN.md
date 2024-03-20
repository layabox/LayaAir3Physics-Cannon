# 适配了LayaAir3的物理引擎Cannon.js

> 提醒： 引擎版本必须 >= LayaAir 3.1

LayaAir3.1开始，支持开发者自主接入第三方的物理引擎。本项目基于Cannon.js物理引擎完成了LayaAir3.1的适配接入，开发者可以参照本开源项目的代码与流程，尝试接入其它物理引擎。

[English](README.md)

## 环境准备

1、引擎根目录下，用命令行执行以下命令，安装node模块，如下所示：

```sh
cnpm i
```

2、获得LayaAir引擎，如何获得与更新引擎过于基础，本篇文档中不展开介绍。

引擎Github地址为：https://github.com/layabox/LayaAir.git

3、在scripts目录下创建enginePath.txt文件，并配置引擎Github在电脑中的绝对路径，路径的格式参照如下：

```text
D:\Github\LayaAir
```

4、引擎根目录下，用命令行执行以下命令，编译引擎到项目内，如下所示：

```shell
cnpm run update-engine
```



## 编译为物理引擎库

引擎根目录下，用命令行执行以下命令，将物理引擎编译为独立的JS库文件，如下所示：

```
cnpm run build
```

编译后的JS库文件`laya.cannon.js`位于`out`目录下。

