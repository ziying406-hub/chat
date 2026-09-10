# OpenIM Chat 健康检查

`openim/openim-chat:v1.8.4-patch.5` 运行镜像没有 `mage`，原先的
`mage check` 因此退出 127，即使业务 API 正常也持续显示 unhealthy。

`healthcheck.sh` 使用镜像已有的 BusyBox wget，调用原生只读接口
`POST /client_config/get`，检查 HTTP 成功且响应顶层 `errCode` 为 0。
这个接口经过 Chat HTTP API、Admin RPC 和配置存储；它不是所有 Chat
RPC 功能的完整验收，也不新增假健康接口。单次请求超时 3 秒。

## 安装与验证

将 `healthcheck.sh` 放到现有 Compose 文件目录，备份原文件后，将
`compose.healthcheck.yml` 中的 volume 和 healthcheck 合入 `openim-chat`。
其余镜像、环境变量、网络及数据配置保持原样。也可将示例作为第二个
`-f` 文件加载（相对路径以第一个 Compose 文件目录为准）。

```sh
docker compose -f docker-compose-custom.yml config --quiet
docker compose -f docker-compose-custom.yml up -d --no-deps --pull never openim-chat
sh test-healthcheck.sh openim-chat
docker inspect openim-chat --format '{{json .State.Health}}'
```

测试执行真实请求，验证健康接口成功，并拒绝连接失败、HTTP 404 和
HTTP 200 内的业务错误（无凭证空请求登录，不写用户数据）。

## 生产验证（2026-09-10）

- 部署目录：`/opt/openim`；仅重建 `openim-chat`。
- 配置备份：`/opt/openim/docker-compose-custom.yml.before-chat-healthcheck-20260910T100243Z`。
- 脚本：`/opt/openim/healthcheck.sh`，只读挂载到容器。
- 原镜像 `openim/openim-chat:v1.8.4-patch.5` 保持不变；重建前容器没有业务二进制改动。
- 原检查退出 127；新检查真实接口与三个负例通过，Docker 显示 healthy。
- `openim-server` 容器 ID 与 `99chat/openim-server:permissions-7272acb` 镜像未变。
- 重建前收藏路径 `/user/favorites/list` 已返回 404；本修复不补充收藏功能。

回滚仅需恢复备份并重建 chat（无需删除数据卷）：

```sh
cp -p /opt/openim/docker-compose-custom.yml.before-chat-healthcheck-20260910T100243Z /opt/openim/docker-compose-custom.yml
docker compose -p openim -f /opt/openim/docker-compose-custom.yml up -d --no-deps --pull never openim-chat
```

回滚会恢复原先错误的 `mage check`，所以也会恢复 unhealthy 标记。
