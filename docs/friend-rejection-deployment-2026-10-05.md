# 好友申请拒绝反馈发布记录

2026-10-05 功能提交 `2d01708` 已推送 GitHub，并部署到 `https://999.99chat99.com`。

OpenIM 原生支持 `refuseFriendApplication`、`OnFriendApplicationRejected` 以及
`getFriendApplicationListAsApplicant`。当前版本服务端已有双方拒绝通知，不需要新增接口或数据库。
原页面的 × 确实调用了拒绝接口，但未监听拒绝事件，只查询收到的申请，发起方因此看不到结果。

本次修复监听原生拒绝回调，仅向申请发起方显示「对方昵称拒绝了你的好友申请」。
「新的朋友 → 我发出的」显示原生申请记录及等待、拒绝、同意状态；结果可以在刷新或离线登录后查询。
通知可关闭，退出账号时清空，申请记录以 OpenIM 为准。

## 验证

复用用户明确授权的两个独立测试账号；好友申请和处理记录会留在数据库，未使用用户账号。
原版本真实网页测试在申请方拒绝提示处超时，复现漏提示问题。
部署后 `friend_rejection_e2e.cjs` 在线上真实网页验证通过：

- 接收方点击 × 调用原生拒绝后，申请方立即出现包含对方昵称的拒绝提示。
- 我发出的列表显示「对方已拒绝」，刷新后仍可见。
- 申请方关闭浏览器上下文后，接收方拒绝；申请方重新登录仍可查询拒绝结果。
- 再次申请后同意，申请方状态更新为「对方已同意」，恢复原生好友资料中的「发消息」。

本地 TypeScript / Vite 构建、线上 Docker 构建及 Nginx 配置检查通过。
仅重建网页服务，OpenIM 镜像、好友校验配置及数据卷未改动。
网页上一版镜像为 `chat-project-web:before-friend-rejection`。

```sh
cd 99chat
E2E_BASE=https://999.99chat99.com TEST_FIXTURES=/tmp/99chat-friend-live.json node friend_rejection_e2e.cjs
```

fixture 文件由 `friend_delete_e2e.cjs` 创建，包含独立账号凭据，权限 0600，禁止提交。
该测试会重置这两个账号间的好友关系，最后验证再次申请同意；不使用其他账号。
