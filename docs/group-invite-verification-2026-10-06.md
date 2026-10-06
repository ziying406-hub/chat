# 群邀请验证（2026-10-06）

原生服务端 v3.8.3-patch.15 的 `InviteUserToGroup` 支持直接邀请成员入群。群主、管理员邀请直接入群，包括 needVerification=1 的群；普通成员在 needVerification=1 时邀请会创建交给群主/管理员处理的申请。被邀请人不会收到需要自己同意的邀请申请。

线上旧页面用独立账号实测：群主邀请成功、接收方原生 SDK 已加入群。群管理重复邀请已有成员时原生接口拒绝，但页面产生未处理异常，没有用户可见错误。

修正：群管理排除已有成员；两个邀请入口提交期间禁用按钮；展示原生失败原因；成功提示区分直接入群与待群管理员审批；邀请后刷新成员列表。没有新增被邀请人审批流程。

验证：更新 group_invite_e2e.cjs，使用已有独立测试账号、新建测试群及持久成员记录，不使用用户账号。两个入口覆盖模拟服务端拒绝、真实原生重试成功、needVerification=1 群主直接邀请、对方在线群列表更新、刷新恢复、成员数为 2、已入群好友不再可邀请。普通成员审批分支本次只核对原生源码，未做三账号端到端验证。

本地生产构建 `npm run build` 通过；运行以下测试通过：

```sh
cd 99chat
E2E_BASE=http://127.0.0.1:5213 E2E_IM_API=https://999.99chat99.com/api E2E_WS=wss://999.99chat99.com/ws TEST_FIXTURES=/tmp/99chat-friend-live.json node group_invite_e2e.cjs
```

线上部署完成：功能提交 baa0ee4 已推送 origin/main，服务器拉取后仅重建 web。Nginx 配置检查通过，页面实际加载 index-BSi-MB7Q.js；原生服务保持 99chat/openim-server:history-7a38dd0 且 healthy。旧 web 镜像已保存为 chat-project-web:before-group-invite-baa0ee4。

使用 E2E_BASE=https://999.99chat99.com 对线上页面再次运行同一测试，群管理和聊天页两个入口均通过上述全部验证。此验证覆盖群主邀请，未声称覆盖普通成员审批或自定义被邀请人确认。
