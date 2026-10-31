---
title: 记录微信开发的坑（Taro小程序和公众号H5）
date: 2020-07-08 11:16:09
tags:
  - Node.js
  - Taro
categories: IT-Frontend
keywords: Node.js,Taro
description: 记录微信开发的坑（Taro小程序和公众号H5）
comments: true
toc: true
---


## Taro小程序(2.x)
（注：项目用的是taro框架，没有去深究是微信的坑还是taro的坑）

###### 1、Taro.createSelectorQuery无法获取子组件的选择器。
解决方案：
```javascript
// 子组件
// 子组件获取选择器，通过父子通信的方式传递给父组件
const query = Taro.createSelectorQuery().in(this.$scope);
```

##### 2、pageScrollTo无法跳转子组件的selector，应该还是无法获取子组件的选择器	。
解决方案：通过上面1的解决方案获取子元素的选择器距离顶部的高度，然后通过scrollTop跳转


##### 3、`position：fixed`定位，底层页面依然可以滚动的问题
解决方案：在遮罩层添加`catchtouchmove="return"`属性
不足：在微信开放工具会报`Component "pages/xx/xx" does not have a method "return" to handle event "touchmove".`的警告，应该是taro没有支持这个属性，直接当做原生属性处理，不过不影响使用。

<br/>

## Taro H5（2.x）
##### 1、redux无法正常使用
描述：按照[官方文档](https://taro-docs.jd.com/taro/docs/2.x/redux)的代码，无法在H5模式下正常使用，会出现`store无法传值到props`、`Cannot read property 'dispatch' of undefined at....`等问题。
解决方案：`store`的`context`没有传到当前组件，解决代码如下：
```javascript
// ...
export default class Index extends Component {
	constructor() {
		super(...arguments);
	}

	// ...
}
```
[参考链接](https://github.com/NervJS/taro/issues/4141#issuecomment-678885902)

##### 2、非页面组件接入redux的connect装饰器后导致父组件无法通过ref操控子组件
原因分析：根据官方 [issuue](https://github.com/NervJS/taro/issues/6095) 分析，可能是`@tarojs/redux`修改子组件的实例时，并没有继承原组件的属性，原生`redux`的`connect`装饰器有四个参数，第四个参数`options`的 [forwardRef](https://react-redux.js.org/api/connect#forwardref-boolean) 字段就是控制ref引用，但`@tarojs/redux`的`connect`装饰器只支持前两个参数。

解决方案：[1、Taro的消息机制](https://docs.taro.zone/docs/2.x/apis/about/events)（管理Events比较麻烦） 2、[HOC](https://github.com/NervJS/taro/issues/8129#issuecomment-733680669) （未经测试）
3、`wrappedInstance`，实际上`connect`装饰器是对组件进行了`HOC`封装，我们可以通过`ref`拿到`Connect`组件，然后通过它的`wrappedInstance`属性拿到我们想要的组件。

##### 3、非页面组件无法触发`componentDidShow`钩子
原因分析：官方在H5没有适配非页面组件的`componentDidShow`钩子，因此只能手动触发。尝试过页面组件在`componentDidShow`时通过`ref`来触发，但在某些情况并不能触发（使用了`redux`的`connect`装饰器后）。根据多次测试发现，父子组件的钩子触发顺序为`父组件componentDidMount`、`父组件componentDidShow`、`子组件componentDidMount`、`子组件compnentDidShow`，且`子组件compnentDidShow`仅在`子组件compnentDidMount`后才能被调用（否则找不到这个实例方法），因此我们只要在`子组件compnentDidMount`之后就可以在父组件里触发`子组件compnentDidShow`钩子了。

解决方案：
```javascript
// 父组件
class Parent extends Component {
	construtor() {
		this.childRef = Taro.createRef();
	}
	componentDidShow() {
		if (this.childRef.current.getIsMount()) {
			this.childRef.current.componentDidShow();
		}
		// 如果子组件使用redux的connect装饰器，代码如下：
		if (this.childRef.current.wrappedInstance.getIsMount()) {
			this.childRef.current.wrappedInstance.componentDidShow();
		}
	}
	render () {
		return (
			<Child ref='childRef' />		
		)
	}
}


// 子组件
class Child extends Component {
	construtor() {
		this.state = {
			isMount: false
		};
	}
	componentDidMount() {
		this.setState({
			isMount: true,
		});		
		this.componentDidShow();
	}
	componentDidShow() {
		// ...
	}
	getIsMount() {
		return this.state.isMount;
	}
}
```

<br/>

## 公众号H5
##### 1、正则表达式反向捕获不支持，只能另寻方案解决。

##### 2、微信不支持pushState的特性，在某些页面调用wx.config会报`invalid signature`错误。
微信文档有说明：

> 所有需要使用JS-SDK的页面必须先注入配置信息，否则将无法调用（同一个url仅需调用一次，对于变化url的SPA的web app可在每次url变化时进行调用,目前Android微信客户端不支持pushState的H5新特性，所以使用pushState来实现web app的页面会导致签名失败，此问题会在Android6.2中修复）。

解决方案可参考：[调用微信扫一扫功能，踩坑'invalid signature](https://www.cnblogs.com/linxing/p/9580018.html)

##### 3、History.pushState()实现的SPA导致微信jssdk配置签名失败
[微信开放社区](https://developers.weixin.qq.com/community/develop/doc/50e9a7f50a93f31f99cfe0c07e7da4b4?highLine=spa%2520permission%2520denied)

###### 4、微信分享图片不显示的问题
[微信分享链接的缩略图和标题](https://blog.csdn.net/aoshilang2249/article/details/78775204)

注：微信内分享的方法一无效

<br/>

## 微信开发
1、ios使用`new Date('2020-07-09 00:00:00')`转化出错，显示`0NaN-NaN...`。
解决方案：字符串不要带有`-`符号

## 参考链接
[微信jssdk文档](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#%E6%AD%A5%E9%AA%A4%E4%B8%89%EF%BC%9A%E9%80%9A%E8%BF%87config%E6%8E%A5%E5%8F%A3%E6%B3%A8%E5%85%A5%E6%9D%83%E9%99%90%E9%AA%8C%E8%AF%81%E9%85%8D%E7%BD%AE)
[ios new Date的坑](https://www.cnblogs.com/ikoala-zsd/p/10077611.html)
[小程序显示弹窗时禁止下层的内容滚动](https://blog.csdn.net/Sophia0326/article/details/81779696)