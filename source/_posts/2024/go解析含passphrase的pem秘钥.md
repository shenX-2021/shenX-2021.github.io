---
title: go解析含passphrase的pem秘钥
date: 2024-05-04 14:49:23
tags:
  - Go
categories: IT-Backend
keywords: Go
description: 记录在Go中如何解析含passphrase的pem秘钥
comments: true
toc: true
---


## 背景
在编写TLS配置时需要用到需要用到一串包含passphrase的RSA秘钥，本想通过官方库的方式解析使用，但由于安全因素，官方已经禁用了`DecryptPEMBlock`、`EncryptPEMBlock`、`IsEncryptedPEMBlock`等函数，导致无法通过官方库去实现这个需求。

## 解决方案
最终通过[pkcs8](https://pkg.go.dev/github.com/youmark/pkcs8@v0.0.0-20240424034433-3c2c7870ae76)库来完成需求，代码如下：
```go
package main

import (
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"

	"github.com/youmark/pkcs8"
)

func main() {
	pem, err := getTlsConfig()
	if err != nil {
		panic(err)
	}
	fmt.Println("无加密的pem:", string(pem))
}

func getTlsConfig() ([]byte, error) {
	passphrase := "test123"
	keyFilePaaht := "./key"

	keyPEMByte, err := os.ReadFile(keyFilePaaht)
	if err != nil {
		err = fmt.Errorf("read %s failed! err: %s", keyFilePaaht, err)
		return nil, err
	}

	keyPEMBlock, rest := pem.Decode(keyPEMByte)
	if len(rest) > 0 {
		err := fmt.Errorf("decode key failed! rest: %s", rest)
		return nil, err
	}

	// 解析pem
	key, err := pkcs8.ParsePKCS8PrivateKey(keyPEMBlock.Bytes, []byte(passphrase))
	if err != nil {
		err = fmt.Errorf("parse PKCS8 private key err: %s", err)
		return nil, err
	}

	// 解析出其中的RSA 私钥
	keyBytes, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		err = fmt.Errorf("MarshalPKCS8PrivateKey failed! %s", err)
		return nil, err
	}
	// 编码成新的PEM 结构
	newKey := pem.EncodeToMemory(
		&pem.Block{
			Type:  "PRIVATE KEY",
			Bytes: keyBytes,
		},
	)

	return newKey, nil
}
```

## 为什么GO不支持pem的加密？
GO团队的[Commit Message](https://go-review.googlesource.com/c/go/+/264159)：
> crypto/x509: deprecate legacy PEM encryption
> It's unfortunate that we don't implement PKCS#8 encryption (#8860)
so we can't recommend an alternative but PEM encryption is so broken
that it's worth deprecating outright.

[官方库x509](https://pkg.go.dev/crypto/x509#DecryptPEMBlock)：
>Deprecated: Legacy PEM encryption as specified in RFC 1423 is insecure by design. Since it does not authenticate the ciphertext, it is vulnerable to padding oracle attacks that can let an attacker recover the plaintext.

GO团队认为PEM encryption的实现是不好的，不够安全的，因此官方移除了实现，并且也不推荐相关的外部实现的库。

从这个[Issue](https://github.com/golang/go/issues/8860)的讨论可以看出社区对这个需求的渴望已经很久，但官方并没有太多关注。



## 参考链接
* [Github Issue - crypto/x509: "certificate is not standards compliant" on MacOS](https://github.com/golang/go/issues/51991)
* [Github Issue - Encrypted private key in PKCS#8 format not supported #17
](https://github.com/youmark/pkcs8/issues/17)
* [x509-decryptpemblock-is-deprecated-what-is-alternative](https://stackoverflow.com/questions/67787233/x509-decryptpemblock-is-deprecated-what-is-alternative)
