# OpenIM Chat 健康检查

## 后台创建账号的密码登录

`password-login.patch` 修复现有两种密码协议不一致：官方管理前端单个/批量创建用户提交 MD5 字符串，而 99chat 注册、登录、重置密码提交原始字符串。原生 RPC 原来只直接比较，导致后台账号在网页输入原密码时得到 PasswordError。

校验保留原生直接比较，并允许原始输入的 MD5 与已保存的管理员账号密码匹配，不修改现有账号或密码。已有个人注册账号及官方 MD5 客户端继续使用原协议。补丁只修改登录密码校验。

镜像构建包含独立 Go 测试，覆盖个人注册原始密码、管理员 MD5 密码、官方哈希输入及错误密码。`password-login-api-test.mjs` 读取私有 `ADMIN_USER_FIXTURE`、`BATCH_USER_FIXTURE`、`SIGNUP_USER_FIXTURE` JSON，验证真实原始密码登录，不再用预先 MD5 的密码替代网页操作。`deployment/openim-admin/browser-login-e2e.mjs` 通过 ego-browser，前置 `globalThis.adminBrowserLogin={spaceId,fixture,index?}`，在已退出登录的真实网页表单输入原密码，验证进入消息页、SDK 会话 userID 和通讯录导航。测试不发送聊天消息。

2026-10-08 修复镜像 `99chat/openim-chat:password-login-20261008`，配置备份 `/opt/openim/docker-compose-custom.yml.before-password-login-20261008`。恢复备份后仅重建 openim-chat 可回滚，所有数据保持原样。

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
