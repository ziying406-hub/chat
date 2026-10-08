# 注册唯一性

OpenIM 原生 credential.account 唯一索引阻止相同登录凭证重复写入。
但 Chat RPC 的邮箱注册预检查错误地查询 attribute.account，
CheckUserExist 又错误地使用 areaCode 查邮箱凭证。
重复邮箱在写入 attribute 后才发生 E11000，线上测试留下不完整账号。
registration.patch 修正这两处查询，先返回 EmailAlreadyRegister (20014)。
前端将该错误显示为“该邮箱已注册，请直接登录或找回密码”。

Dockerfile 保留原有收藏、邮箱 API 补丁，并构建修正后的 chat-rpc。
固定源码的 RPC、配置和协议与 v1.8.4-patch.5 相同。

回归测试：补丁内 registration_test.go 验证邮箱预检查及已注册凭证查询。
应用补丁后执行：

```sh
go test ./internal/rpc/chat -run 'TestDuplicateEmail|TestExistingEmail' -count=1
TEST_FIXTURES=/path/to/private-test-accounts.json node server-patches/chat/registration-api-test.mjs
cd 99chat && npm run build
```

手机号：原生手机号账号已有重复注册检查；邮箱注册界面的可选手机号
仍为 99chat_contact_profiles 资料，没有唯一约束。这部分是否禁止不同
邮箱共用手机号，等待用户确认；本补丁不改变手机号资料规则。

本次重复注册测试的残留账号 7079307657 已按 user_id 清理 attribute、
account、register 三条记录，无 credential 或 OpenIM user，未触及正式账号。
