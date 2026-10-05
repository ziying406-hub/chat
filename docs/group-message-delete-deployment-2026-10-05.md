# 群聊消息删除检查与修复

2026-10-05 功能提交 `232d8a3` 已推送 GitHub 并部署网页服务。

## 原因与实现

单条消息菜单只有撤回入口；页面超过两分钟禁止撤回，多选删除则调用仅清理本机的 `deleteMessageFromLocalStorage`。
现在单条菜单增加独立的「删除」，与多选统一调用原生 `deleteMessage`，删除当前账号的本地及服务端记录，不改变群内其他成员的记录。撤回规则不变。

核对 OpenIM SDK core v3.8.3-patch.15 的 `delete.go` / `server_api.go` 和服务端同版本 `internal/rpc/msg/delete.go`：SDK 使用登录用户 ID 调用 DeleteMsgs，未指定同步其他成员选项；服务端删除用户自己的消息记录。无需新增自定义后端。

参考：[OpenIM deleteMessage](https://docs.openim.io/sdks/api/message/deleteMessage)。

## 验证范围

- 旧版线上真实群聊复现：双方显示文字消息，旧消息菜单找不到单条删除。
- 本地 TypeScript / Vite 构建、线上 Docker 构建、Nginx 配置检查通过。
- 使用用户已经授权的独立测试账号和测试群，测试消息会留在数据库，不使用用户账号。
- 线上 `group_message_delete_e2e.cjs` 回归通过：旧消息单条删除、未选中消息保留、多选删除、本人刷新不再显示已删消息、另一成员消息不受影响。
- 回归按服务端消息 sendTime 实际等待超过两分钟，检查撤回入口已受限后点击删除。
- 通过「更多聊天操作 → 多选 → 删除」检查同一原生删除接口；其他成员仍保留消息。
- 两个账号各自的原生 `pull_msg_by_seq` 记录用于验证删除仅影响本人，并保留未选中的对照消息。

检查期间发现：新的浏览器会话能加载测试群会话和最新消息预览，但 SDK 群历史读取为空；该情况在本次修改前已出现。因此本次持久性证据以两个账号各自的服务端记录为准，未宣称通过新浏览器恢复完整群历史。该历史加载异常未在本次修复中处理。

仅重建 `web`，原生 OpenIM 服务及配置保留。回滚镜像 `chat-project-web:before-message-deletion`。

```sh
cd 99chat
E2E_BASE=https://999.99chat99.com TEST_FIXTURES=/tmp/99chat-friend-live.json TEST_GROUP_FIXTURE=/tmp/99chat-group-delete.json node group_message_delete_e2e.cjs
```

两份 fixture 只保存在本机，不提交账号凭据。
