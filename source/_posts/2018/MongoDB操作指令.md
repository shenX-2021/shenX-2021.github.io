---
title: MongoDB操作指令以及在Node.js封装MongoDB的操作方法
date: 2018-08-18 17:02:36
tags:
  - MongoDB
  - Node.js
categories: IT
keywords: MongoDB,Node.js
description: 记录MongoDB操作指令以及在Node.js封装MongoDB的操作方法
comments: true
toc: true
---


## 1、启动mongodb：

```
cd path/mongodb/bin        				// 打开命令行，切换到mongodb目录下的bin目录
mongod --dbpath path/mongodb/data/db	// 设置path/mongodb/data/db目录为数据库目录
mongo.exe 或者 mongo					  // 启动JavaScript shell，是操作数据库的命令行
```
## 2、mongodb基本命令：

```
db													// 显示当前所在数据库
show dbs											// 显示所有的数据库
use db												// 切换到db数据库，数据库不存在则创建新的数据库	
db.dropDatabase()									// 删除当前数据库
db.createCollection(name, options)					// 在当前db下创建新的集合
show tables 或 show collections	       	   			// 显示当前db下的所有集合名（collection）
db.collection.find().pretty()						// 查询当前db下的collection集合下的所有数据，pretty()让数据更直观的呈现出来
db.collection.insert(obj)							// 向当前db下的collection集合插入obj数据，若文档不存在，会创建一个新的文档	
db.collection.drop()								// 删除当前db下的collection集合
db.collection.update(condition, update, options)    // 更新一条数据数据，若options.multi===true,则更新符合条件的所有数据
db.collection.save(obj)								// 若obj._id存在，则该文档替换成obj，否则插入obj文档
db.collection.remove(condition, options)			// 删除符合condition条件的文档，options.justOne===1 || true时，只删除一条数据
```
## 3、mongo权限设置
```
// 创建指定权限的用户
use admin
db.auth(user, pwd)			  	// 登录获得管理员权限
use test						// 跳转到需要创建权限用户的数据库
db.createUser({
	"user" : "testUser",        // 账号
	"pwd" : "123456",           // 密码
	"roles" : [                 
                 {
                         "role" : "readWrite",    // 权限规则
                         "db" : "test"            // 权限所在的数据库范围
                 }
         ]
})
```
权限role的具体说明，参考[官方文档](https://docs.mongodb.com/manual/reference/built-in-roles/#built-in-roles)
## 4、node.js环境下mongodb的API封装：

```javascript
const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017'
const DB = 'test'

function _connectDB (callback) { // { useNewUrlParser: true } 是为了向前兼容
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
		callback(err, db)
	})
}

// 插入一个文档数据
module.exports.insertOne = function (collection, data, callback) {
	_connectDB(function (err, db) {
		if (err) throw err
		var database = db.db(DB)
		database.collection(collection).insertOne(data, function (err, result) {
			callback(err, result)
			db.close()
		})
	})
}
// 插入多个文档数据，传入的data必须为数组
module.exports.insert = function (collection, data, callback) {
	_connectDB(function (err, db) {
		if (err) throw err
		let database = db.db(DB)
		if (!(data instanceof Array)) {
			throw new Error('请使用数组传入多个数据，或者调用Insert添加单个数据')
		}
		if (data.length === 0) {
			throw new Error('禁止插入空数组')
		} 
		database.collection(collection).insertMany(data, function(err, result) {
			callback(err, result)
			db.close()
		})
	})
}
// 删除单个数据
module.exports.deleteOne = function (collection, condition, callback) {
	_connectDB(function (err, db) {
		if (err) throw err
		let database = db.db(DB)
		database.collection(collection).deleteOne(condition, function (err, result) {
			callback(err, result)
			db.close()
		})
	})
}
// 删除多个数据
module.exports.delete = function (collection, condition, callback) {
	_connectDB(function (err, db) {
		if (err) throw err
		let database = db.db(DB)
		database.collection(collection).deleteMany(condition, function (err, result) {
			callback(err, result)
			db.close()
		})
	})
}
// 查询数据，condition为{}时可以查询该集合下的所有文档
module.exports.find = function (collection, condition, callback) {
	_connectDB(function (err, db) {
		if (err) throw err
		let database = db.db(DB)
		database.collection(collection).find(condition).toArray(function (err, result) {
			callback(err, result)
			db.close()
		})
	})
}
```

## 5、mongo常用的命令
```javascript
// testCollection集合下的一个文档
{
	"_id": 1,
	"arr": [
		1,
		2,
		3,
		4
	]
}

// 删除数组内多个元素
db.testCollection.update({_id: 1}, {$pull: {'arr': {$in: [2, 3]}}})

// 删除后的文档数据

{
	"_id": 1,
	"arr": [
		1,
		4
	]
}
```