# 删除好友后拒收私聊发布记录

2026-10-05 部署功能提交 `371b866` 到 `https://999.99chat99.com`。

## 原因与修复

线上 OpenIM `friendVerify` 原为 false。删除好友是原生单向关系删除，关闭好友校验时仍允许私聊。
已在 `/opt/openim/docker-compose-custom.yml` 的 `openim-server.environment` 持久设置
`IMENV_OPENIM_RPC_MSG_FRIENDVERIFY: "true"`，仅重建 `openim-server`。
镜像保持 `99chat/openim-server:web-only-multilogin`，Firebase 挂载和其他环境变量保留。
网页部署更新删除确认提示，明确私聊限制及重新添加后的恢复。

此规则检查接收方的好友列表：A 删除 B 后拒绝 B → A；不自动双向删除或拉黑。
原有聊天记录保留，群聊使用原有群权限，不因单向删除好友而屏蔽同群消息。

## 验证

用户已确认创建独立测试账号及发送持久测试消息；未使用用户账号。
线上测试先复现删除后发送仍返回 0；部署后 `friend_delete_e2e.cjs` 通过：

- 好友之间私聊能实际进入接收方历史，预热关系校验缓存。
- 使用真实网页的好友资料 → 删除好友 → 删除完成单向关系删除。
- 被删除账号的原生 SDK 私聊发送立即返回 1303。
- 对方仍保留原好友，确认未变成双向删除或隐式拉黑。
- 重新申请并接受好友后，消息重新进入接收方历史。
- 接收方退出并重新登录后，成功消息保留，被拒绝消息仍不在记录中。

本地 TypeScript / Vite 构建及线上 Docker 构建通过；Nginx 配置检查通过。
消息容器健康状态 healthy，运行环境标志为 true。
完整收发回归使用线上环境；本地旧版 OpenIM 的 SDK 连接未完成，不作为验证依据。

## 回滚

消息配置备份为 `/opt/openim/backups/compose.before-friend-verification.yml`；
恢复此配置后，仅 `docker compose -f docker-compose-custom.yml up -d --no-deps openim-server`。
这会恢复原来的允许非好友私聊行为。不要删除数据卷。
网页上一版镜像保留为 `chat-project-web:before-friend-verification`。
