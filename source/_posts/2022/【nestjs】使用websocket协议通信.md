---
title: 【NestJS】使用websocket协议通信
date: 2022-07-08 18:31:04
tags:
  - Node.js
  - NestJS
categories: IT-Backend
keywords: Node.js,NestJS
description: 在NestJS环境中，需要自己实现websocket的适配器，才能完美地使用websocket的特性
comments: true
toc: true
---

### 前言
nestjs特别青睐`socket.io`，文档中关于网关的描述都是以`socket.io`为例，并且不管是`@nestjs/platform-socket.io`还是`@nestjs/platform-ws`的适配器实现都是参考`socket.io`的，以至于想完整地使用websocket协议进行通信变得难以实现。

### WsAdapter遇到的坑
想要使用`ws`库，需要使用`@nestjs/platform-ws`的`WsAdapter`，使用方法如下：
```typescript
// main.ts
// 必须在app.listen方法之前调用
 app.useWebSocketAdapter(new WsAdapter(app));
 await app.listen(3000);
```
然后开始踩坑。
##### @SubscribeMessage订阅事件装饰器
在websocket协议里，是没有订阅事件的概念的，这是`socket.io`里的概念。这里我的解决办法是写死事件名，例如`@SubscribeMessage('message')`。
##### 客户端调用send的方法，服务器无法收到
排除客户端出现问题的可能，测试了一些特定格式的JSON数据是可以的，例如：
```JSON
{
	"event": "message",
	"data": {
		"test": 123
	}
}
```
翻了源码，发现是需要按照上述格式的JSON的数据解析的。
```typescript
// ws-adapter.ts
 const message = JSON.parse(buffer.data);
 const messageHandler = handlers.find(
   handler => handler.message === message.event,
 );
 const { callback } = messageHandler;
 return transform(callback(message.data));
```
### 解决方案
`@nestjs/platform-ws`适配器对传输数据进行了封装，因此我们只要自己写一个适配器就可以解决这个问题。
源码如下：
```typescript
// src/adapters/ws.adapter.ts
import { WsAdapter as OriginWsAdapter } from '@nestjs/platform-ws';
import { MessageMappingProperties } from '@nestjs/websockets';
import {
  EMPTY,
  filter,
  first,
  fromEvent,
  mergeMap,
  Observable,
  share,
  takeUntil,
} from 'rxjs';
import { CLOSE_EVENT } from '@nestjs/websockets/constants';

enum READY_STATE {
  CONNECTING_STATE = 0,
  OPEN_STATE = 1,
  CLOSING_STATE = 2,
  CLOSED_STATE = 3,
}

export class WsAdapter extends OriginWsAdapter {
  public bindMessageHandlers(
    client: any,
    handlers: MessageMappingProperties[],
    transform: (data: any) => Observable<any>,
  ) {
    const close$ = fromEvent(client, CLOSE_EVENT).pipe(share(), first());
    const source$ = fromEvent(client, 'message').pipe(
      mergeMap((data: any) =>
        this.bindMessageHandler(data.data, handlers, transform).pipe(
          filter((result: any) => result),
        ),
      ),
      takeUntil(close$),
    );
    const onMessage = (response: any) => {
      if (client.readyState !== READY_STATE.OPEN_STATE) {
        return;
      }
      client.send(response);
    };
    source$.subscribe(onMessage);
  }

  bindMessageHandler(
    buffer: string | number | Buffer,
    handlers: MessageMappingProperties[],
    transform: (data: any) => Observable<any>,
  ) {
    try {
      const messageHandler = handlers.find(
      	// 这里的'message'值对应@SubscribeMessage传的值
        (handler) => handler.message === 'message',
      );
      const { callback } = messageHandler;
      return transform(callback(buffer));
    } catch {
      return EMPTY;
    }
  }
}
```

### 版本信息
>node: 16.13.0
	nestjs: 8.4.7