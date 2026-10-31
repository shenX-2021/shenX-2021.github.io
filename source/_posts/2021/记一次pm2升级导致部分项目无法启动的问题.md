---
title: 记一次pm2升级导致部分项目无法启动的问题
date: 2021-06-11 23:47:01
tags:
  - PM2
categories: IT-Backend
keywords: Node.js,PM2
description: 记录pm2升级导致部分项目无法启动的问题
comments: true
toc: true
---

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;项目上的pm2是3.2.2，近期发现官方的版本都要到5.x了，于是心念念地想升级到4.x，在测试服升级到4.5.6后观察了一个月，没有发现问题，果断在正式服升级。
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;升级的操作非常简单，[官网](https://pm2.keymetrics.io/docs/usage/update-pm2/#updating-pm2)上只用到了三个命令：
```shell
# 将项目备份
pm2 save
# 升级pm2
npm install pm2 -g
# 项目升级
pm2 update
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;升级后，`pm2 logs`一片红，完全看不过来，待冷静下来后慢慢分析，主要有两个问题。

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;一个是升级后pm2的监控功能更强大了，将以前没有监控的问题暴露了出来。这个好解决，对应着改就好了。

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;另外一个报错是
```
/usr/local/lib/node_modules/pm2/lib/ProcessContainerFork.js:30
   import(url.pathToFileURL(process.env.pm_exec_path));
   ^^^^^^
 SyntaxError: Unexpected token import
    at createScript (vm.js:80:10)
    at Object.runInThisContext (vm.js:139:10)
    at Module._compile (module.js:616:28)
    at Object.Module._extensions..js (module.js:663:10)
    at Module.load (module.js:565:32)
    at tryModuleLoad (module.js:505:12)
	at Function.Module._load (module.js:497:3)
   	at Function.Module.runMain (module.js:693:10)
    at startup (bootstrap_node.js:191:16)
    at bootstrap_node.js:612:3
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;好家伙，一看就是我处理不了的，直接去pm2的issue找答案，有人说只要升级到最新版本就好了，但我查了一下，4.5.6已经是4.x的最新版了，因此问题不在这。无奈之下，只好自己探索，使用`pm2 describe xx`可以看项目信息，发现这个项目的node版本是8.x，但服务器的node已经是14.x了，立刻就想到是node版本的问题，但我使用restart命令重启，发现node版本还是没有更新，只好将项目从pm2 list删除，然后再启动项目，问题解决。

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;后面在[相关issue](https://github.com/Unitech/pm2/issues/4877)查到4.5版本支持的最低node版本为10.22，也验证了上面的猜想。


### 总结
* 升级前确保执行了`pm2 save`备份项目信息
* 升级前查询版本支持的node最低版本
