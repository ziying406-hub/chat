# 部署已有服务端收藏

生产此前使用原版 `openim/openim-chat:v1.8.4-patch.5`，收藏三接口返回
404，MongoDB 中也没有 `99chat_favorites` 集合。本地现有实现位于独立
仓库 `99chat-chat-api` 的 `920b1e508a7595567338876d957173502d178f2e`。

`favorites.patch` 保存该提交的三个 Go 文件改动。Dockerfile 从其上游
基线 `22dc25e296aef327fb6779079c2a8b5b8fce83db` 构建 `chat-api`，仅将
这个二进制加入原生产镜像，其余 RPC、Admin API、配置及启动方式沿用原镜像。
不使用本地项目中会重新构建全部服务的根 Dockerfile。

```sh
docker build --progress=plain -t 99chat/openim-chat:favorites-920b1e5 server-patches/chat
```

部署前备份 Compose，将 `openim-chat.image` 改为以上镜像，保留原有
MongoDB 环境变量与健康脚本挂载，然后仅重建该服务：

```sh
docker compose -p openim -f /opt/openim/docker-compose-custom.yml config --quiet
docker compose -p openim -f /opt/openim/docker-compose-custom.yml up -d --no-deps --pull never openim-chat
```

首次启动会在配置中的 MongoDB 数据库创建 `99chat_favorites` 集合及
`userID + clientMsgID` 唯一索引。若已有收藏数据，部署前应检查重复键，
否则创建索引失败会阻止 Chat API 启动。生产部署前已确认该集合不存在。

验证脚本需要 Node.js 22，`CHAT_URL` 指向选定 Chat API，
`TEST_VERIFY_CODE` 从该环境现有配置安全注入，不写入仓库。
`FAVORITES_TEST_STATE` 指定仓库外的临时文件绝对路径，脚本以 0600 创建，
用于两个独立进程间保存测试账号 token，验证清理后自动删除。

```sh
node server-patches/chat/favorites-api-test.mjs prepare
# 仅重启 openim-chat，等 Docker healthy 后：
node server-patches/chat/favorites-api-test.mjs verify
```

脚本创建两个独立测试账号，检查无 token/无效 token、跨账号读取与删除、
伪造 userID、相同消息 ID 隔离及幂等更新。prepare 后重启 chat，healthy 后
单独执行 verify 验证持久化，再删除本次测试收藏。测试账号保留，不修改其他用户数据。

## 生产验证（2026-09-10）

- 镜像：`99chat/openim-chat:favorites-920b1e5`，构建成功并部署。
- Compose 备份：`/opt/openim/docker-compose-custom.yml.before-favorites-920b1e5-20260910T100800Z`。
- 部署只修改 chat 镜像字段，原健康脚本、Mongo 配置和其他服务全部保留。
- 测试先在原部署复现 HTTP 404，再在新镜像验证六种无效鉴权请求，以及
  两账号的保存、读取、更新幂等、跨账号删除隔离和伪造 userID 隔离。
- 重启 chat 后，两账号均通过 API 读回各自内容；删除后的列表检查通过。
- Mongo 唯一索引已创建；最终临时收藏记录为 0，测试凭据文件已删除。
- 首轮交互测试因 SSH 断线未完成回车确认，两条记录在重启后仍存在；
  已精确清理该轮记录，改用 prepare/verify 后完整重跑通过。
- Docker healthy；健康探针正例和三种负例均通过。
- `openim-server` 容器和 `99chat/openim-server:permissions-7272acb` 镜像未变。

回滚仅恢复先前 Compose，并重建 chat。Mongo 收藏数据留存，恢复此镜像时
可继续读取；不删除集合或数据卷。

```sh
cp -p /opt/openim/docker-compose-custom.yml.before-favorites-920b1e5-20260910T100800Z /opt/openim/docker-compose-custom.yml
docker compose -p openim -f /opt/openim/docker-compose-custom.yml up -d --no-deps --pull never openim-chat
```

回滚至原版会再次让收藏接口返回 404，但保留已修复的健康检查。
