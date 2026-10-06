# 新浏览器群历史恢复

2026-10-06 修复提交 `7a38dd0`。

## 根因和修复

1. `restoreSession` 在登录请求返回时提前清除 `isInitialSyncing`。页面在原生消息同步完成前读取空历史，之后原生同步结束不再触发标记变化，页面未重新读取。现在正常登录只结束登录恢复标记，由 `OnSyncServerFinish` 完成消息同步状态切换；失败分支仍结束同步状态。
2. OpenIM v3.8.3-patch.15 原生 MongoDB `GetLastMessage` 只过滤全局已删状态，未过滤调用用户的 `del_list`。SDK 新安装同步仅拉取会话最新消息；如果本人删除了最新消息，服务端仍返回该条已删消息，SDK 无有效消息初始化会话。现在按用户过滤文档和消息，选择本人最新可见消息，包括最新文档全部被本人删除时查找更早文档。其他成员仍保留其原来的最新消息。

沿用原生协议、删除标记和 SDK 历史查询；没有自定义历史缓存或补造记录，没有数据库迁移。

## 验证

- 旧版本真实群会话复现：SDK 同步完成后能返回 9 条记录，页面仍显示暂无消息。
- MongoDB 7.0.28 独立临时容器集成测试通过：跨文档连续删除后取得更早可见消息，其他用户取得最新消息，全部删除后无结果。测试容器已清理。
- 本地 TypeScript / Vite 生产构建通过；原生 `openim-rpc-msg` 编译通过。
- 线上 `group_history_e2e.cjs` 通过：接收账号 8 条、本账号 5 条可见文字在新浏览器及刷新后全部恢复；仅本人删除的 3 条文字未重新出现，另一账号仍保留。
- 原生新镜像健康检查通过，好友验证仍为 `true`；网页 Nginx 配置检查通过。
- 浏览器回归使用已经授权的两份独立账号 fixture 和测试群，复用已有消息，不新增账号或群消息。分别对新浏览器和刷新后的实际消息内容进行断言，并核对服务端本人删除后的记录不重新出现。
- 线上 `message_read_e2e.cjs` 回归通过：打开聊天更新已读回执，持续阅读、发送方刷新保留已读，离开聊天保持未读，重新打开后变为已读。该测试在独立账号中保留三条新测试消息。
- 开发模式 StrictMode 存在重复初始化干扰，本次浏览器验证使用实际生产构建。
- 测试通过本地同一份公开 WASM 文件加快启动，其余网页请求、SDK 登录、群消息和服务端历史均是真实线上服务。

## 发布与回滚

网页保留镜像 `chat-project-web:before-group-history`。
OpenIM 候选镜像为 `99chat/openim-server:history-7a38dd0`，沿用群权限和 Web 多实例登录补丁，仅增加消息服务替换。
原 Compose 备份 `/opt/openim/backups/compose.before-group-history-7a38dd0.yml`，旧镜像 `99chat/openim-server:before-group-history`。
部署只修改原 Compose 中服务镜像字段，保留好友验证环境变量、Firebase 挂载和其余配置，不删除数据卷。

```sh
cd 99chat
E2E_BASE=https://999.99chat99.com TEST_FIXTURES=/tmp/99chat-friend-live.json TEST_GROUP_FIXTURE=/tmp/99chat-group-delete.json node group_history_e2e.cjs
```

以上 fixture 为本机私有文件，不提交账号凭据。
