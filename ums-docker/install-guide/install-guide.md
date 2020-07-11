# `osixia/openldap` 安装指南

## 概述

[osixia](http://www.osixia.net/) 为 [openldap](https://www.openldap.org/) 制作了 Docker 镜像，提供了很多配置选项来初始化 OpenLDAP 服务。但是：

- osixia 提供的 [OpenLDAP 文档](https://github.com/osixia/docker-openldap)并没有完整的示例来指导如何使用这些选项。
- 有些功能仍然需要到 OpenLDAP 中手动开启，例如：memberOf overlay。

因此，我们仅使用 `osixia/openldap` 默认设置进行启动，然后使用 LDAP CLI 来调整配置。



## 原理

OpenLDAP 服务器有两套配置方法：

- 传统配置方案是：通过 `slapd.conf` 配置文件进行配置
- 新的配置方案是：所有的配置会被写入到一个特殊的 LDAP Directory（数据库），其结构如下：

![LDAP Config DIT](/Users/rlee/ums/ums-docker/install-guide/config_dit.png)

所有的配置项开始于根节点 `cn=config`，加载的模块

## 默认配置启动



## 相关脚本



