---
title: 【kafka】docker容器bitnami/kafka使用SASL鉴权（无TLS）
date: 2024-05-01 13:34:08
tags:
  - OS
categories: IT-OS
keywords: OS,kafka
description: 记录在docker容器bitnami/kafka环境下使用SASL的过程
comments: true
toc: true
---

## 背景
最近在学习kafka消息队列，了解到kafka是通过SASL来进行用户认证的。起初，因为`btinami/kafka`官方的一段内容让我以为SASL和TLS是绑定使用的，导致心思花在解决TLS配置上去，官方原文如下：
>You must also use your own certificates for SSL. You can drop your Java Key Stores or PEM files into `/opt/bitnami/kafka/config/certs`. If the JKS or PEM certs are password protected (recommended), you will need to provide it to get access to the keystores:

后来发现其实是可以单独使用SASL，而且官方文档没有完整的配置资料，最后在Issue上找到解决方案。

## 过程
### 1.编写一个包含SASL配置的docker-compose.yml文件
```yml
version: "2"
services:
  kafka:
    image: 'bitnami/kafka:latest'
    hostname: localhost
    ports:
      - '9092:9092'
    environment:
      - ALLOW_PLAINTEXT_LISTENER=yes
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CLIENT_LISTENER_NAME=CLIENT
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_LISTENERS=CLIENT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,CLIENT:SASL_PLAINTEXT
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093
      - KAFKA_CFG_SASL_ENABLED_MECHANISMS=SCRAM-SHA-512
      - KAFKA_CLIENT_USERS=test
      - KAFKA_CLIENT_PASSWORDS=123456
```

将容器跑起来看日志，发现报错:
```
Exception in thread "main" java.lang.IllegalArgumentException: requirement failed: inter.broker.listener.name must be a listener name defined in advertised.listeners. The valid options based on currently configured listeners are CLIENT
```
需要配置`inter.broker.listener.name `参数，去官网看一下介绍。
以下是`inter.broker.listener.name `参数的官方描述：
> Name of listener used for communication between brokers. If this is unset, the listener name is defined by security.inter.broker.protocol. It is an error to set this and `security.inter.broker.protocol` properties at the same time.

以下是`security.inter.broker.protocol`参数的官方描述：
> Security protocol used to communicate between brokers. Valid values are: `PLAINTEXT`, `SSL`, `SASL_PLAINTEXT`, `SASL_SSL`. It is an error to set this and `inter.broker.listener.name` properties at the same time.

以下是对两个参数关系的一些官方描述：
> Inter-broker listener must be configured using the static broker configuration `inter.broker.listener.name` or `security.inter.broker.protocol`.

> Among the listeners in this list, it is possible to declare the listener to be used for inter-broker communication by setting the `inter.broker.listener.name` configuration to the name of the listener. The primary purpose of the inter-broker listener is partition replication. If not defined, then the inter-broker listener is determined by the security protocol defined by `security.inter.broker.protocol`, which defaults to `PLAINTEXT`.

由上述可知，`inter.broker.listener.name` 和 `security.inter.broker.protocol` 参数的作用是一致的，都是为了设置broker之间通信的配置，由于`security.inter.broker.protocol`设置之后依然存在问题，本文暂不讨论，后续就以`inter.broker.listener.name` 参数进行处理。

### 2.设置`inter.broker.listener.name` 
`inter.broker.listener.name` 可以设置为一个新的listener，也可以设置为现有的listener（controller除外），本文就以设置现有的listener为例，将改值设置为`CLIENT`:
```yml
version: "2"
services:
  kafka:
    image: 'bitnami/kafka:latest'
    hostname: localhost
    ports:
      - '9092:9092'
    environment:
      - KAFKA_CFG_INTER_BROKER_LISTENER_NAME=CLIENT
      # ... 和上面的配置一样
```
此时把容器跑起来，会得到以下错误：
```
ERROR ==> When using SASL for inter broker comunication the mechanism should be provided using KAFKA_CFG_SASL_MECHANISM_INTER_BROKER_PROTOCOL
```
只需要设置`KAFKA_CFG_SASL_MECHANISM_INTER_BROKER_PROTOCOL`，可选值为`PLAIN`, `SCRAM-SHA-256`, `SCRAM-SHA-512` 。在官网介绍中，其实应该还有`GSSAPI`默认值的，但是这个值在容器使用中会出现错误，而且在`bitnami/kafka`文档中也没有写支持改值，因此不作讨论。

### 3.设置`KAFKA_CFG_SASL_MECHANISM_INTER_BROKER_PROTOCOL`
将`KAFKA_CFG_SASL_MECHANISM_INTER_BROKER_PROTOCOL`设置为`PLAIN` 、`SCRAM-SHA-256` 或 `SCRAM-SHA-512` 
```yml
version: "2"
services:
  kafka:
    image: 'bitnami/kafka:latest'
    hostname: localhost
    ports:
      - '9092:9092'
    environment:
      - KAFKA_CFG_SASL_MECHANISM_INTER_BROKER_PROTOCOL=SCRAM-SHA-512
      # ... 和上面的配置一样
```
这里需要注意是，`KAFKA_CFG_SASL_MECHANISM_INTER_BROKER_PROTOCOL` 的值需要在`KAFKA_CFG_SASL_ENABLED_MECHANISMS` 范围内，否则你将看到以下错误：

```
Exception in thread "main" java.lang.IllegalArgumentException: requirement failed: sasl.mechanism.inter.broker.protocol must be included in sasl.enabled.mechanisms when SASL is used for inter-broker communication
```
`KAFKA_CFG_SASL_ENABLED_MECHANISMS` 支持多个值，以 `,` 隔开即可，如：
`KAFKA_CFG_SASL_ENABLED_MECHANISMS=PLAIN,SCRAM-SHA-512`

至此，一个简单的SASL的docker-compose.yml配置就完成了

## 完整配置文件
```yml
version: "2"
services:
  kafka:
    image: 'bitnami/kafka:latest'
    hostname: localhost
    ports:
      - '9092:9092'
    environment:
      - ALLOW_PLAINTEXT_LISTENER=yes
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CLIENT_LISTENER_NAME=CLIENT
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_INTER_BROKER_LISTENER_NAME=CLIENT
      - KAFKA_CFG_LISTENERS=CLIENT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,CLIENT:SASL_PLAINTEXT
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093
      - KAFKA_CFG_SASL_MECHANISM_INTER_BROKER_PROTOCOL=SCRAM-SHA-512
      - KAFKA_CFG_SASL_ENABLED_MECHANISMS=SCRAM-SHA-512
      - KAFKA_CLIENT_USERS=test
      - KAFKA_CLIENT_PASSWORDS=123456
```


## 参考文章
* [Apache Kafka - security_sasl_config](https://kafka.apache.org/documentation/#security_sasl_config)
* [Docker hub - bitnami/kafka](https://hub.docker.com/r/bitnami/kafka)
* [Github Issue - [bitnami/kafka] Kraft crashing when setting up secure connection PEM #26067
](https://github.com/bitnami/containers/issues/26067)