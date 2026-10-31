---
title: 记一次Mac(M1)交叉编译Windows系统的过程
date: 2024-04-15 21:24:50
tags:
  - OS
categories: IT-OS
keywords: OS,Go
comments: true
toc: true
---


做了一个导出文件项目来实践学习GO的成果，开发完成后，在本地调试环境一切正常，打包到Windows测试出现了报错`Error: Binary was compiled with 'CGO_ENABLED=0', go-sqlite3 requires cgo to work. This is a stub`。后研究得知，gorm的sqlite driver依赖cgo，所以需要开启`CGO_ENABLED`来启用CGO，但因为Mac(M1)的gcc编译器默认是clang，这个是Windows不支持的，所以开启了之后依旧无法解决问题。

## 解决方案
### 不依赖CGO进行交叉编译
浏览一下gorm的sqlite库的Issues和PRs，看到有很多人也遇到了相关的问题，并提出了使用纯GO实现sqlite的方案，详情可以关注以下链接：
* [https://github.com/go-gorm/sqlite/pull/161](https://github.com/go-gorm/sqlite/pull/161)
* [https://github.com/go-gorm/sqlite/pull/93](https://github.com/go-gorm/sqlite/pull/93)
* [https://github.com/go-gorm/sqlite/issues/35](https://github.com/go-gorm/sqlite/issues/35)
* [https://github.com/go-gorm/sqlite/issues/160](https://github.com/go-gorm/sqlite/issues/160)

**但目前发布版本还没有实现。**

### 更换为windows支持的gcc编译器
经过查阅，发现可以通过替换Windows支持的gcc编译器来解决问题，而`MinGW-w64`是著名的Windows版的gcc编译器，所以只要安装然后将GO的环境变量`CC`改为对应的编译器即可。
1. 安装`MinGW-w64`，网上推荐的是通过`homebrew`安装的，但我无法搜索到。最后是通过`MacPorts`安装的，安装命令为`sudo port install mingw-w64`，[详情在此](https://ports.macports.org/port/mingw-w64/)。
2. 修改GO的环境变量`CC`。命令为`go env -w CC=x86_64-w64-mingw32-gcc`。
3. 交叉编译

详情可以参考我的[个人项目](https://github.com/shenX-2021/file-manager-export)，如果对你有帮助，劳烦给项目点点赞。

## 总结
通过网上的教程顺利解决了交叉编译的问题，但对交叉编译和gcc编译器这一块的认识还是很肤浅的，需要进一步学习。

## 参考链接
* [go gorm 中Binary was compiled with 'CGO_ENABLED=0',...的问题](https://zhuanlan.zhihu.com/p/649548287)
* [https://github.com/go-gorm/sqlite/issues](https://github.com/go-gorm/sqlite/issues)
* [golang写了个小程序用到go-sqlite3如何编译](https://segmentfault.com/q/1010000021626722)