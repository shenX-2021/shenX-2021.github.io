---
title: Linux的man命令
date: 2018-10-15 20:16:00
tags:
  - Linux
  - OS
categories: IT
keywords: Linux,OS
description: 记录Linux的man命令
comments: true
toc: true
---


linux的bash shell下可以使用man命令查看命令的详细介绍和使用说明，具体如下：

`man date`

`man date`命令第一行会显示
DATE(1)
括号里的1代表这个命令的意义


## 代号及意义：

| 代号 |意义  | 
|--|--|
| 1 | ***使用者在 shell 环境中可以操作的指令或可可执行文件*** |
| 2 | 系统核心可调用的函数与工具等 |
| 3 | 一些常用的函数（ function ）与函数库（ library ），大部分为 C 的函数库（ libc ） |
| 4 | 设备文件的说明，通常在 /dev 下的文件 |
| 5 | ***配置文件或者是某些文件的格式*** |
| 6 | 游戏（ games ） |
| 7 | 惯例与协定等，例如 Linux 文件系统、网络协定、 ASCII code 等等的说明 |
| 8 | ***系统管理员可用的管理指令*** |
| 9 | 跟 kernel 有关的文件 |


如果想要查看man命令的介绍，可以使用`man man `命令

## 通过man查看命令的介绍，通常分为以下几个部分：

| 标题 | 说明 |
|--|--|
| NAME | 简短的指令、数据名称说明 |
| SYNOPSIS| 简短的指令下达语法（ syntax ）简介 |
| DESCRIPTION| 较为完整的说明，这部分最好仔细看看！ |
| OPTIONS| 针对 SYNOPSIS 部分中，有列举的所有可用的选项说明 |
| COMMANDS| 当这个程序（软件）在执行的时候，可以在此程序（软件）中下达的指令 |
| FILES| 这个程序或数据所使用或参考或链接到的某些文件 |
| SEE ALSO| 可以参考的，跟这个指令或数据有相关的其他说明！ |
| EXAMPLE| 一些可以参考的范例 |
