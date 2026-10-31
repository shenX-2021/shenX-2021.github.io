---
title: vue，mint-ui解决loadmore组件滑动卡顿的问题
date: 2019-06-05 10:58:05
tags:
  - Node.js
  - Vue
categories: IT-Frontend
keywords: Node.js,mint-ui,Vue
description: 记录解决mint-ui中loadmore组件滑动卡顿的问题。
comments: true
toc: true
---

### 1、问题描述
mint-ui是应用在移动端上的一个vue的ui库，loadmore组件可以进行上拉刷新和下滑刷新的操作，但在使用过程中发现该组件滑动出现卡顿现象，并且常常无法定位到当前滚动位置（即出现回滚）。

### 2、解决方案
为组件添加父元素标签，设置css属性
```css
{
  overflow-x: auto;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch; // 解决ios滑动不流畅的问题
}
```

同时loadmore组件不要设置固定高度