## 介绍
该demo是用于批量恢复Mariadb数据表的脚本。代码仅用于演示，请谨慎参考。

## 使用
1. 安装依赖
```bash
npm i
```

2. 更新数据库凭证
```javascript
const mysqlConfig = {
  waitForConnections: true,
  host: 'xxxxxxx',
  user: 'xxxxxxx',
  password: 'xxxxxxx',
}
```

3. 执行命令
```bash
node index.js
```