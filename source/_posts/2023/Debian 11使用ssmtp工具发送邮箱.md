---
title: Debian 11使用ssmtp工具发送邮箱
date: 2023-03-08 16:08:10
tags:
  - OS
categories: IT-OS
keywords: OS,SMTP
description: 记录在Debian 11系统中，使用ssmtp工具实现连接163 STMP服务，发送邮件
comments: true
toc: true
---

## 背景
新建了一个家庭服务器，想要通过163的smtp服务器来做一些通知的工作。但不知道是没配置好的问题，还是Debian 11的问题，尝试了sendmail、postfix、mailx等工具都无法实现。最后通过ssmtp实现了。这里做一下记录。

## 步骤
### 1.安装ssmtp
```bash
sudo apt-get install ssmtp
```

### 2.填写配置文件`/etc/ssmtp/ssmtp.conf`:
```bash
# root is the person who gets all mail for userids < 1000
root=your@email.com

# Here is the gmail configuration (or change it to your private smtp server)
# 发件邮箱服务器的smtp服务域名及端口，163邮箱的为 smtp.163.com:25
mailhub=smtp.email.com:25
# 填写发件邮箱服务器的账号邮箱
AuthUser=your@email.com
# 这里填发件邮箱服务器的授权码
AuthPass=yourEmailPass
UseTLS=YES
UseSTARTTLS=NO
FromLineOverride=YES
```

### 3.测试邮件发送
```bash
echo '邮件内容' | sudo mail -s '邮件标题' xxx@xx.com
```


## 参考链接
* [Can I set up system mail to use an external SMTP server?](https://unix.stackexchange.com/questions/36982/can-i-set-up-system-mail-to-use-an-external-smtp-server#answers-header)