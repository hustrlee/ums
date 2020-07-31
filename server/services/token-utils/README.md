# Token Utilities

## 数据架构

- 按照 `token - username` 存储 Token 和 Username 的对应关系。

  - 每次登录均会产生一个 Token，而老 Token 并不会消除，因此 `token - username` 是“多对一”的数据结构。
  - 这种设计允许多终端多次登录。
  - 为了安全和数据回收，每个 `token - username` 数据在创建时设定有效期为 1 天（86400 秒）。

- 建立 `username - token - hash` 存储 Username 和 Token 的对应关系。
  - `username - token` 是“一对一”的数据结构。
  - 只保存最后一次成功登录时分配的 Token。
  - 校验这个数据，可以实现只允许单次登录。

## API

- `setToken`：设置一个新的 Token，一般发生在 `login` 时。
- `getUsername`：根据 Token 获取 username。
- `delToken`：删除 Token，一般发生在 `logout` 时。
