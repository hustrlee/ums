

# OpenLDAP 入门



## 概述

***目录（Directory）***是专为搜索和浏览进行优化的数据库，它特别适用于存储不需要经常***“修改”（Update）***，但需要经常***“搜索和访问（Query）***的，具有***层次结构（树形结构）***的数据。

***LDAP（Light Directory Access Protocol，轻量级目录访问协议）***则是***目录服务（Direcotry Service）***访问协议。它基于 ***X.500*** 通信标准，可以工作在任何面向连接的数据链路协议上，例如：***TCP 协议***。

LDAP 被广泛应用于***“分布式用户管理系统”、“分布式资源管理系统”***，提供用户的统一登录、资源的统一管理等功能。Linux 集成了 LDAP 服务，Windows 则基于 LDAP 发展出了兼容的 ***AD（Active Directory）服务***。

***[OpenLDAP](https://www.openldap.org/)*** 是 LDAP 的一个开源实现。***[Osixia](https://github.com/osixia/docker-openldap)*** 为 OpenLDAP 制作了 Docker 镜像。



## 技术栈

- [OpenLDAP](https://www.openldap.org)
- [osixia/openldap](https://github.com/osixia/docker-openldap)
- [osixia/phpLDAPadmin](https://github.com/osixia/docker-phpLDAPadmin) —— 基于 Web 的 LDAP Client
- [ldapjs](http://ldapjs.org/) —— LDAP 的 Nodejs Client
- [ldapjs-promise](https://www.npmjs.com/package/ldapjs-promise) —— ldapjs 的 promise 封装



## 安装

采用 Docker 部署 OpenLDAP 和 phpLDAPadmin。

```yaml
version: "3.8"

services:
  openldap:
    image: osixia/openldap:latest
    container_name: openldap
    volumes:
      - ./data/slapd/database:/var/lib/ldap
      - ./data/slapd/config:/etc/ldap/slapd.d

  phpldapadmin:
    image: osixia/phpldapadmin:latest
    container_name: phpldapadmin
    environment:
      - PHPLDAPADMIN_HTTPS=false # 关闭HTTPS，开启HTTP。（HTTPS和HTTP只能开启一个）
      - PHPLDAPADMIN_LDAP_HOSTS=openldap # 连接的OpenLDAP服务器
    volumes:
      - phpldapadmin-root:/var/www/phpldapadmin
    ports:
      - 9002:80

volumes:
  phpldapadmin-root:
    name: ums-phpldapadmin-root
```

> - phpLDAPadmin 地址：http://localhost:9002
> - 默认的登录用户名/密码：`cn=admin,dc=ums` / `admin`
> - phpLDAPadmin 在添加数据时，界面刷新有 bug。LDAP Web Client 也可以采用 [LDAP Account Manager](https://www.ldap-account-manager.org/lamcms/)。
> - `./data` 目录下是 OpenLDAP 的数据库文件和配置文件。默认的 `osixia/openldap` 需手动开启 `memberOf` 及 `refint` 模块，因此直接使用已经配置好的配置文件，从而跳过手动配置步骤。
