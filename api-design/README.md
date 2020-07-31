# Server 构建指南

## 构建之前

- 构建采用了 Docker 部署的 `opentools-generator`，需正确安装了 Docker。
- 格式化采用了 `prettier`，需正确安装了 Prettier。

```bash
$ npm install prettier -g
```

## 首次构建

运行 `./codegen` 将构建 Server Framework。生成的代码存储在 `../server` 目录下。

## 功能实现

- 修改 `server/service` 的相关 module，来实现 REST API 的功能。
- 功能实现完毕后，需将该模块加入到 `server/.openapi-generator-ignore`，以避免该模块被再次生成的代码覆盖。

```
package.json
services/UserService.js
```

- 需将 `server/package.json` 加入到 `server/.openapi-generator-ignore`，以避免手动添加的三方模块丢失。

## 再次构建

- 修改设计文件 `openapi.yaml` 后，运行 `./codegen` 再次生成 Server 代码。
- 再次生成代码是，不会覆盖 `server/.openapi-generator-ignore` 中指定的文件，以避免覆盖已经实现好的 API。
- 但同时导致新增的 API 定义可能需要手动添加到相关的 service module。
