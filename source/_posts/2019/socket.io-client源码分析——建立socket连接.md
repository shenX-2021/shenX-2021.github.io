---
title: socket.io-client源码分析——建立socket连接
date: 2019-12-28 23:56:36
tags:
  - Node.js
  - socket.io
categories: IT-Frontend
keywords: Node.js,socket.io
description: socket.io-client源码分析——建立socket连接
comments: true
toc: true
---

### 介绍

> socket.io是一种用于服务端和客户端的双向通信的js库，提供了长轮询和websocket这两种实现方式socket.io-client是其在客户端的实现。socket.io-client通过方法on监听来自服务器的通信，通过方法emit向服务器传递信息。

**socket.io-client**对外暴露相关api，处理与外界的交互，对外界数据通过**socket.io-parser**库解析成**socket.io-protocol**规定的格式数据源，通过底层引擎库**engine.io-client**传输至服务器。同时监听**engine.io-client**从服务器获取的返回信息。

###  架构分析
&emsp; &emsp; socket.io-client库内部分为两个类，`Manager`和`Socket`。分别连接内部引擎和外部沟通，互相之间通讯方式参照node.js中Event Emitter的方式。

&emsp; &emsp; `Manager`类负责对整个库的管理和处理，对`Socket`传来的信息编码后传递到engine.io-client，处理socket的错误和异常。当收到engine.io-client的信息时，解码后传递给`Socket`。
&emsp; &emsp; `Socket`类负责外部的api，暴露emit、on、once、disconnect等方法，对外部的信息进行处理传递到`Manager`。

### 源码分析
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/f4fa8f717d308b7e8aefc2c7bd7ab01b.png)
&emsp; &emsp; 上图是socket.io-client建立连接的流程图，可以看出来是比较简单的。初始`Manager`类和`Socket`类，在`Manager`初始化的同时，初始化引擎，引擎负责与服务器通知，`Manager`负责与引擎通信，将通信内容通过`Socket`类传递到外部。

 **接下来我们看源码:**
```javascript
function lookup (uri, opts) {
  if (typeof uri === 'object') {
    opts = uri;
    uri = undefined;
  }
  // 初始化参数，这里只保留了必要的参数
  opts = opts || {};
  let parsed = url(uri); // 将uri字符串转换为包含host、port、query等字段的对象
  let source = parsed.source; // 请求的原地址，即uri
  let newConnection = true;

  // 初始化Manager类，目前只做了新连接的初始化
  let io;
  if (newConnection === true) {
    io = Manager(source, opts);
  } else {
    // 这里对Manage实例进行缓存，这里不做介绍
  }

  if (parsed.query && !opts.query) {
    opts.query = parsed.query;
  }
  // 初始化Socket类
  return io.socket(parsed.path, opts);
}
```
&emsp; &emsp; 上面是**socket.io-client**的入口函数，只做了三件事，初始化参数、初始化`Manager`类实例、初始化`Socket`类实例，然后向外暴露`Socket`实例。
&emsp; &emsp; 我们按顺序逐步分析，调用`io = Manager(source, opts);`后发生了：

```javascript
// Manager类的构造函数
function Manager (uri, opts) {
  if (!(this instanceof Manager)) return new Manager(uri, opts);
  if (typeof uri === 'object') {
    opts = uri;
    uri = undefined;
  }
  opts = opts || {};

  opts.path  = opts.path || '/socket.io'; // 这里是真实的请求路径，uri上的请求路径实际上是socket的命名空间，这里需要加以区分
  this.nsps = {}; // 不同命名空间的socket的缓存
  this.subs = []; // 事件或定时器销毁的缓存列表
  this.opts = opts; // 参数
  this.reconnection(opts.reconnection !== false); // 是否自动重连
  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity); // 重连次数
  this.reconnectionDelay(opts.reconnectionDelay || 1000); // 重连间隔时间
  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000); // 重连间隔时间上限，即最长的重连间隔时间
  this.randomizationFactor(opts.randomizationFactor || 0.5); // 随机数因子，作为间隔时间随机增长的参数之一
  // backoff实例，用户记录和刷新间隔时间和重连次数
  this.backoff = new Backoff({
    min: this.reconnectionDelay(),
    max: this.reconnectionDelayMax(),
    jitter: this.randomizationFactor()
  });

  this.timeout(null == opts.timeout ? 20000 : opts.timeout); // 连接超时时长
  this.readyState = 'closed'; // 连接状态，默认为closed
  this.uri = uri; // 链接地址
  this.connecting = []; // 当前处于连接状态的socket列表
  this.lastPing = null; // 最近一次心跳检测的时间
  this.encoding = false; // 当前是否正在编码
  this.packetBuffer = []; // 数据包缓冲区
  var _parser = opts.parser || parser; // 编解码工具，默认使用基于socket.io-protocol的socket.io-parser库
  this.encoder = new _parser.Encoder(); // 编码器
  this.decoder = new _parser.Decoder(); // 解码器
  this.autoConnect = opts.autoConnect !== false; // 是否自动连接，默认是
  if (this.autoConnect) this.open(); // 如果自动连接，则开始连接
}
```
&emsp; &emsp; 上面是`Manager`类的构造函数，调用后会返回一个`Manager`实例，函数内主要是对一些重要的属性进行初始化，以及进行自动连接服务器（默认情况下）。
```javascript
Manager.prototype.open =
Manager.prototype.connect = function (fn, opts) {
  // 如果当前状态为open(已连接)或opening(连接中)，则不需要重复连接
  if (~this.readyState.indexOf('open') return this;
  
  this.engine = eio(this.uri, this.opts); // 初始化engine.io-client的实例
  var socket = this.engine;
  var self = this;
  this.readyState = 'opening'; // 连接状态改为opening(正在连接)
  this.skipReconnect = false; // 是否跳过重连

  // 监听engine的open实践，出发此事件表明连接已建立
  var openSub = on(socket, 'open', function () {
    self.onopen(); // 这里就是连接成功的后续处理。后面再展开来讲
    fn && fn(); // 有回调则触发回调
  });

  // 监听engine的error事件，连接失败时出发此事件
  var errorSub = on(socket, 'error', function (data) {
    self.cleanup(); // 清除缓存
    self.readyState = 'closed'; // 连接状态为closed
    self.emitAll('connect_error', data); // 广播所有socket连接触发connect_error事件
    if (fn) { // 如果有回调函数则调用回调函数
      var err = new Error('Connection error');
      err.data = data;
      fn(err);
    } else { // 没有则判断是否需要重连，这里只在第一次自动连接时发生
      // Only do this if there is no fn to handle the error
      self.maybeReconnectOnOpen();
    }
  });

  // 如果没有取消超时设置，则默认有个连接超时处理
  if (false !== this._timeout) {
    var timeout = this._timeout;

    // 设置定时器，超过预定时间则触发超时
    var timer = setTimeout(function () {
      openSub.destroy(); // 销毁open事件的监听回调
      socket.close(); // 关闭socket
      socket.emit('error', 'timeout'); // 触发error事件
      self.emitAll('connect_timeout', timeout); // 广播connect_error事件
    }, timeout);

	// 将定时任务的销毁推入订阅缓存
    this.subs.push({
      destroy: function () {
        clearTimeout(timer);
      }
    });
  }

  this.subs.push(openSub); // 将open事件的销毁推入订阅缓存
  this.subs.push(errorSub); // 将error事件的销毁推入订阅缓存

  return this;
}
```
&emsp; &emsp; 在这里，做了以下五个步骤：1、初始化引擎；2、修改状态为opening；3、监听引擎的`open`和`error`事件；4、默认进行超时处理；5、将监听事件和定时器的销毁方法存入缓存。
&emsp; &emsp; `eio`是`socket.io-client`的引擎(即`engine.io-client`)的部分，负责核心的连接控制、请求发送与相应、心跳检测，使`socket.io-client` 能更多地关注与外部的沟通。`engine.io-client`的原理也将会在后续文章进行探讨。
&emsp; &emsp; `open`函数执行完后，`Manager`实例便生成了，接下来就是`Socket`类的初始化实例过程。
```javascript
// Manager类的实例方法socket，向外暴露新建或缓存中的socket实例
Manager.prototype.socket = function (nsp, opts) {
  // 获取socket缓存
  var socket = this.nsps[nsp];
  if (!socket) { // 不存在，则生成新的Socket实例
    socket = new Socket(this, nsp, opts); // 生成Socket实例
    this.nsps[nsp] = socket; // 缓存Socket实例
    var self = this;
    socket.on('connecting', onConnecting); // 监听connecting事件
    socket.on('connect', function () { // 监听connect事件
      socket.id = self.generateId(nsp); // 连接成功后生成一个唯一标识，服务器通过此标识可以区分不同的socket连接
    });
    // 如果是自动连接的话，socket将不会收到connecting监听的回调，因为在监听之前，已经触发了connecting事件了
    if (this.autoConnect) {
      onConnecting();
    }
  }
  // connecting的回调处理函数
  function onConnecting () {
  	// 如果socket不在缓存列表内，则将其添加到connecting缓存
    if (!~indexOf(self.connecting, socket)) {
      self.connecting.push(socket);
    }
  }

  return socket;
};

// Socket类的构造函数
function Socket (io, nsp, opts) {
  this.io = io; // Manager类实例
  this.nsp = nsp; // 命名空间
  this.ids = 0; // ack编号，用于识别ack应答的回调函数
  this.acks = {}; // 存储ack回调函数
  this.receiveBuffer = []; // 在连接建立前，将服务器传来的数据包传入此缓存列表，连接成功后，传递到外部。
  this.sendBuffer = []; // 在连接建立之前，将外部需要传递到服务器的数据包添加到此缓存，连接成功后，传递到服务器
  this.connected = false; // 是否已连接
  this.disconnected = true; // 是否已断开连接
  this.flags = {}; // 对数据包编码标志，用于解析数据包采用何种编接码形式的判断
  if (opts && opts.query) {
    this.query = opts.query; // 参数
  }
  if (this.io.autoConnect) this.open(); // 自动连接
}
```
&emsp; &emsp; `Manager`类的`socket`方法用于获取新的或缓存中的`Socket`实例，向外暴露指定命名空间的实例。`Socket`类实例化过程，也是初始化了指定的属性，以及在可自动连接的情况下进行连接。值得注意的一点是`receiveBuffer`和`sendBuffer`这两个属性，为什么需要两个属性呢？因为http请求是异步的，数据的接收指令和发送指令可能先于请求的响应，在响应到达前，这些指令是不允许执行的，因此需要有个缓存，在请求响应后，一次性将指令进行对应的处理。
&emsp; &emsp;接着看`Socket`类实例方法`open`：
```javascript
Socket.prototype.open =
Socket.prototype.connect = function () {
  if (this.connected) return this; // 如果已连接，则返回

  this.subEvents(); // 订阅Manager类的open、packet、close事件
  this.io.open(); // 这里是为了确保调用了Manager的open方法，如果已连接，此方法不做任何处理，详情看上方open方法的源码
  // 如果状态是open，并且命名空间不为/，则发送一个连接包到服务器，服务器鉴权
  if ('open' === this.io.readyState) this.onopen();
  this.emit('connecting'); // 通知外部连接中...
  return this;
};
```
&emsp; &emsp;上面是`open`和`connect`方法的源码。可以看出，`open`和`connect`是完全一样的方法，当我们不进行自动连接时，可以通过`connect()`或者`open()`来进行手动连接。
&emsp; &emsp;这里可能会有个疑问，**连接不上已经建立了吗？为什么还需要发送连接包到服务器呢？**这里就需要理解初始化引擎时发生了什么，引擎向发送了一条GET的http请求，请求格式是有规定的，例如`http://localhost:2000/socket.io/?param1=123&EIO=3&transport=polling&t=MywSF5v.0&b64=1`，服务器地址、端口、路径、以及相关参数，其中路径必须为`/socket.io`，EIO为3，transport默认为polling，后续引擎通过判断当前环境是否允许升级为websocket，来过渡到websocket。如果相关参数以及网络没有问题，会收到一条响应信息`96:0{"sid":"iqJ7v1aSsJTAwA1aAAAB","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":5000}2:40`。经过`engine.io-parser`解码后生成两个JSON包，为`{type:  "open", data: {sid: "iqJ7v1aSsJTAwA1aAAAB", upgrades: ["websocket"], "pingInterval":25000, "pingTimeout":5000}}`、`{type:"message", data: 0}`。
&emsp; &emsp;首先我们看第一个JSON包`{type:  "open", data: {sid: "iqJ7v1aSsJTAwA1aAAAB", upgrades: ["websocket"], "pingInterval":25000, "pingTimeout":5000}}`，’`open`类型的包使引擎状态改为已连接，并做相关处理，触发`Manager`监听的事件`open`，`Manager`监听的`open`事件的回调如下：
```javascript
Socket.prototype.onopen = function () {
  debug('transport is open - connecting');

  // 如果命名空间不为/的话，则需要发送一个connect包到服务器判断是否存在該命名空间的连接。
  if ('/' !== this.nsp) {
    if (this.query) {
      // 带有参数的包
      var query = typeof this.query === 'object' ? parseqs.encode(this.query) : this.query;
      debug('sending connect packet with query %s', query);
      this.packet({type: parser.CONNECT, query: query});
    } else {
      // 不带参数的包
      this.packet({type: parser.CONNECT});
    }
  }
};
```
&emsp; &emsp;为什么需要发送这个包呢？在`socket.io`的机制里，引擎第一个请求是获取一些必要的参数和连接包(即第二个包)，如`sid`(此次连接的唯一标识)、`upgrades`(可升级的协议列表)、`pingInterval`(心跳检测的间隔时间)、`pingTimeout`(心跳检测的超时时间)，只要请求是满足`socket.io`协议规定的格式，就能收到对应的响应信息，但这次请求并没有包括对命名空间的检测，因此，**需要客户端需要对非默认命名空间的连接额外做一次连接鉴权请求(发送`connect`包)**。
&emsp; &emsp;接下来看第二个JSON包`{type:"message", data: 0}`。`engine.io-client`通过触发事件`data`将`message`类型的包中的`data`(也就是`0`)传递到`socket.io-client`的`Manager`实例中，`Manager`实例触发回调后会进行解码，代码如下：
```javascript
Manager.prototype.ondata = function (data) {
  this.decoder.add(data); // 利用socket.io-parser的解码器解码来自engine.io-client的数据
};
```
&emsp; &emsp;解码过程这里不做展开，解码后数据以JSON形式呈现，这里的数据`0`将被解码为`{type: 0, nsp: "/"}`，`type: 0`指的是数据包类型为`connect`，`nsp: "/"`指的是命名空间为`/`，解码器解码后的数据会经过以下处理：
```javascript
// 解码器解码后触发的回调
Manager.prototype.ondecoded = function (packet) {
  this.emit('packet', packet); // 触发事件packet
};

// 事件packet的回调
Socket.prototype.onpacket = function (packet) {
  var sameNamespace = packet.nsp === this.nsp; // 数据包的命名空间是否与本地的命名空间一样
  var rootNamespaceError = packet.type === parser.ERROR && packet.nsp === '/'; // 当数据包的命名空间是/，并且包类型为error

  // 当命名空间不一致，且数据包不为error时，将抛弃这个数据包，例如{type: 0, nsp: "/"}，本地nsp不为/
  if (!sameNamespace && !rootNamespaceError) return;

  // 根据数据包类型不一样，进行不同处理
  switch (packet.type) {
    case parser.CONNECT: // 0
      this.onconnect();
      break;

    case parser.EVENT: // 2
      this.onevent(packet);
      break;

    case parser.BINARY_EVENT: // 5
      this.onevent(packet);
      break;

    case parser.ACK: // 3
      this.onack(packet);
      break;

    case parser.BINARY_ACK: // 6
      this.onack(packet);
      break;

    case parser.DISCONNECT: // 1
      this.ondisconnect();
      break;

    case parser.ERROR: // 4
      this.emit('error', packet.data);
      break;
  }
};
// 收到连接包后，建立连接的处理
Socket.prototype.onconnect = function () {
  this.connected = true; // 是否已连接
  this.disconnected = false; // 是否断开连接
  this.emit('connect', 'small connect');  // 通知外部连接已建立，触发connect事件回调
  this.emitBuffered(); // 处理缓存
};
// 缓存处理
Socket.prototype.emitBuffered = function () {
  debug('reciveBuffer: %o', this.receiveBuffer)
  var i;
  for (i = 0; i < this.receiveBuffer.length; i++) {
    emit.apply(this, this.receiveBuffer[i]); // 将接受的事件包发射到外部
  }
  this.receiveBuffer = [];

  for (i = 0; i < this.sendBuffer.length; i++) {
    this.packet(this.sendBuffer[i]); // 将外部传递的事件包发射到engine传递到服务器
  }
  this.sendBuffer = [];
};
```
&emsp; &emsp;当开始建立连接时，第一个收到的包是连接包(`{type: 0, nsp: "/"}`)，如果外部连接的命名空间不为`/`，会检测到命名空间不匹配，然后丢弃这个包，并且在连接成功前，服务器传来的数据包将缓存在`receiveBuffer`队列，外部传来的数据包将缓存在`sendBuffer `队列。直到收到相匹配的命名空间的连接包，建立连接成功后，将这些缓存逐一处理。
&emsp; &emsp;到这里，建立socket连接就算是完成了。

### 总结
&emsp; &emsp;`socket.io-client`库负责与外部通讯、将外部不同类型的数据转化为内部数据，将内部数据解析为事件或ack回调、重连机制、超时处理、异常通知。它的连接过程像是搭一座桥，将外部与内部引擎连接起来。
&emsp; &emsp;下一篇文章，将介绍外部和服务器是如何通过这座桥的。
