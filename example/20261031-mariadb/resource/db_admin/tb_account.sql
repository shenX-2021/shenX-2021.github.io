CREATE TABLE `tb_account` (
  `id` int(20) NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `password` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码',
  `salt` char(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '密码加盐',
  `mobile` varchar(256) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '手机号码',
  `email` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '邮箱',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '状态,0表示禁止,1表示正常',
  `platform` tinyint(4) NOT NULL DEFAULT 0 COMMENT '平台:0表示普通用户(没权限),1表示为运营管理,2表示入住商家',
  `is_super` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否为超级管理员1表示是,0表示不是',
  `is_deleted` int(11) NOT NULL DEFAULT 0 COMMENT '用于软删除的复合唯一索引处理，未删除为0；',
  `gmt_delete` timestamp(3) NULL DEFAULT NULL COMMENT '软删除时间',
  `gmt_create` timestamp(3) NOT NULL DEFAULT current_timestamp(3) COMMENT '创建时间',
  `gmt_modified` timestamp(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_deleted` (`email`,`is_deleted`),
  KEY `IDX_41dfcb70af895ddf9a53094515` (`username`),
  KEY `IDX_55754048b4958e867f033621ae` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账号记录表';