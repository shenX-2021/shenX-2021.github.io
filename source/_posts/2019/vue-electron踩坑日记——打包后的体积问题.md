---
title: vue-electron踩坑日记——构建后的体积问题
date: 2019-04-29 19:47:12
tags:
  - Node.js
  - Electron
  - vue-electron
categories: IT
keywords: Node.js,Electron,vue-electron
description: Electron构建后的体积过大，可通过更改配置解决。
comments: true
toc: true
---

*本文仅针对vue-electron框架下的打包处理，不一定符合您的情况，请自行辨别*

### 1.问题描述及原因分析
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;解决了[多窗口界面显示问题](https://blog.csdn.net/weixin_41855143/article/details/89408218)，发现每次打包的时间都特别长，可是项目大小也就几M，这种情况太异常了，于是去查看了项目大小，发现是300多M，整整大了十倍有余。
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;因为项目小，需要的依赖不多，按理说打包后的大小不应该超过50M。但打包后的大小超过了300M，说明问题出现在打包加入的依赖太大。原因可能有：1、加入了不该引入的依赖（将devDependencies加入了进来）；2、因为多窗口的原因，重复引入了相同的依赖；

### 2.踩坑过程
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;虽然知道了可能的原因，但还是无从下手，查阅了一些资料后，决定先找出是什么文件导致项目如此巨大，发现app.asar特别大，然后就去了解了一下[asar](https://github.com/electron/asar)，asar是electron框架一个简单存档的文件，并可以反编译，于是乎，反编译一下。发现这个文件将整个项目的文件都存档进去了，怪不得会那么大。而且，asar反编译如此简单，那岂不是项目和裸奔没什么区别了？然后迅速去查阅资料.......
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;经过思考和资料，我发现打包过程是错误的，正确的打包过程是：
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1、webpack打包src目录的代码至`dist/electron`目录
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2、electron-builder打包`dist/electron`目录的代码

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;如何去实现第二步呢？
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;在`package.json`文件中有`builder`字段是用作`electron-builder`配置的
```javascript
"build": {
	// 产品名称
    "productName": "Shorthands",
    // appid
    "appId": "com.example.yourapp",
    // 打包地址配置
    "directories": {
      // 打包输出的目录
      "output": "build",
      // 需要打包的目录，之前因为这里是“./”导致将整个项目的文件都打包了
      "app": "./dist/electron"
    },
    ...
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**这里有个地方要注意的是在`build.app`填写的地址处需要添加`package.json`文件，详情可以参考[Two package.json Structure](https://www.electron.build/tutorials/two-package-structure.html)**

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;配置完成后，就可以打包了。然后解压app.asar，代码都是经过webpack打包后的压缩版，再也不怕项目裸奔了。

### 3.思考
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;虽说经过优化，但项目依然有100M那么大，应该是`electron`封装的C++代码，用于调用原生系统API，但项目应该只用了部分，不知是否可以按需打包，有时间再做深入。