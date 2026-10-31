---
title: Electron踩坑日记
date: 2019-04-16 11:53:43
tags:
  - Node.js
  - Electron
  - vue-electron
categories: IT-Frontend
keywords: Node.js,Electron,vue-electron
description: 记录Electron开发遇到的坑。
comments: true
toc: true
---

最近开始接触[electron](https://electronjs.org/docs)，在此记录遇到的坑和填坑记录。

### 1、窗体透明设置

**api**：`BrowserWindow({transparent: true}`

**坑**：transparent和backgroundColor冲突，当设置这两个属性后，backgroundColor会覆盖transparent的效果，即使设置`backgroundColor: 'transparent'`也不能起作用（ps:在这里纠结了很久）

**填坑**：当需要窗体透明时，不要设置backgroundColor就可以了，当然，标签的样式里也不要设置background-color。

**拓展**：当需要半透明窗体时，设置`new BrowserWindow({transparent: true})`，然后在需要半透明的标签上设置background-color为rbga(...)格式的背景色，便可做到半透明窗体了

### 2、使用Two package.json Structure模式打包后安装，页面空白。
**介绍**：双`package.json`需要在项目根目录和webpack打包后的目录下都生成一个`package.json`文件。项目根目录配置项目开发需要的依赖和打包配置，在需要`electron-builder`打包的目录（`build.directories.app`字段的值）配置生产环境所需的依赖。这样子可以避免将不必要的依赖打包，减少安装包体积。

**坑**：在app打包目录下生成一个没有依赖的包后，进行打包。在打包的电脑，安装包解压后能正常运行。但是换了其他电脑后，打开时空白页面。

**填坑**：在其他电脑运行时，因为不存在生产环境的依赖，app在打开时已经报错，因此呈现出来的是空白界面，因此只需要在app打包目录下把相应的依赖添加进去便可。为什么在本地却可以打开呢？是因为本地项目根目录已经配置了相应的依赖，运行时app在当前目录找不到依赖，则向上查找，直到项目根目录。

### 3、升级node12后vue-electron运行报错
![报错内容](https://i-blog.csdnimg.cn/blog_migrate/d65e9960bde0983a75da8ec6fe41591e.png)
**介绍：** 当我升级node到12时，重新运行vue-electron项目时，出现了这个错误，定位到是index.ejs这个文件里的process变量不存在，代码没有动过，出现这个问题有可能是node版本的问题，在网上找到相应的解决办法，在这里记录一下

**填坑：** [解决方案](https://blog.csdn.net/Gabriel_wei/article/details/92785089)，[issue里面的答案](https://github.com/SimulatedGREG/electron-vue/issues/871#issuecomment-490370237)，[templateParameters的介绍](https://github.com/jantimon/html-webpack-plugin#options)
