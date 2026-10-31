---
title: Mariadb数据库frm文件异常，如何恢复数据
date: 2026-10-31 23:01:15
tags:
  - Linux
  - Mariadb
categories: IT-Database
keywords: Mariadb,Linux
description: 数据库因未开启performance_schema重启失败，导致InnoDB表frm文件异常，引发“表不存在”错误。经排查，数据文件（.ibd）完好，通过删除损坏frm、重建表结构并导入原.ibd文件成功恢复。
comments: true
toc: true
---


## 事故始末
在查询数据库性能问题时，发现performance_schema配置没有开启，立马更新配置，重启数据库。没想到数据库重启失败。修改force_recovery后数据库启动了，但所有业务数据表都无法查询了，抛出了`Table 'db_xx.tb_xx' doesn't exist in engine`的异常。

## 排查原因
`Table 'db_xx.tb_xx' doesn't exist in engine`的问题是由于frm^1^文件异常，数据库无法正常加载。这个问题可能和数据库重启失败有关。
数据库为何重启失败，直接原因是数据库重启时无法正常加载和InnoDB engine，确实后续发现无法正常查询的表都是使用InnoDB engine的，包括Mariadb的三个系统表（mysql.innodb_table_stats^2^, mysql.innodb_index_stats^3^, mysql.gtid_slave_pos^4^）。但我无法确定重启失败的根本原因，猜测有以下两种可能：

* 重启数据库时还有很多服务正在访问数据库，突然的重启导致Mariadb无法正确地处理请求，进而使数据库崩溃。
* performance_schema的配置导致Mariadb在重启时发生了异常。

我没有深究真正的诱因，但我猜测第一个的可能更大。

## 解决方案
### 如何恢复数据表
经过排查，只是frm（表结构）文件异常，而ibd^5^（数据文件）文件正常。因此，通过以下步骤恢复数据。
1. 请关闭访问数据库的相关服务，以免在恢复期遇上无法预料的问题。
2. 删除损坏的表结构文件：进入对应数据库目录，删除报错表相关的 .frm / .ibd 文件（**请先做好完整备份！**）。
3. 重新创建表结构：在 phpMyAdmin 或客户端中，用原本的 CREATE TABLE 语句重新创建该表（去掉外键约束等可能干扰的条件）。
4. 丢弃新表的表空间：`ALTER TABLE xxx.xxx DISCARD TABLESPACE;`
5. 将原有的 .ibd 文件拷回该数据库目录，并赋予正确的用户权限（如 mysql:mysql）。
6. 导入表空间： `ALTER TABLE xxx.xxx IMPORT TABLESPACE;`

### 批量恢复
由于数据表数量过大，手动执行效率过低且容易出错，因此，将手动执行的流程转换成相应的脚本。相关代码请参考[Github](https://github.com/shenX-2021/shenX-2021.github.io/tree/source/example/20261031-mariadb)。


## 环境
* OS: CentOS Linux 7 (Core)
* Mariadb: 10.2.10-MariaDB

## 复盘
事故发生的很突然，虽然最终顺利解决，但还是要从中吸取教训：
1. 不要贸然重启数据库，重启前一定要做好**备份**。
2. 当发生事故时，先不要做修复，还是先要做好**备份**，以便重试。
3. 如果你不是专业的DBA或公司没有DBA，尽量避免使用外键约束（Foreign Key Constraint）、存储过程（Stored Procedure）、触发器（Trigger）和视图（View）等数据库特性，即把能用代码实现的不要放在数据库。这些都有可能为成为修复数据库上的绊脚石。

## 注释
1. FoRM​ 的缩写，是 MySQL / MariaDB 中存储表结构定义的文件。
2. InnoDB 的持久化表级统计信息表，用来给查询优化器判断执行计划的。
3. InnoDB 的持久化索引级别的统计信息，同样只给查询优化器用。
4. MariaDB 的 GTID 复制位点表，专门给从库（replica）记“我复制到哪了”。
5. InnoDB Datafile，是 InnoDB 存储引擎的表数据文件，存放表的实际数据 + 索引。