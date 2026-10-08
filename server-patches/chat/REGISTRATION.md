# 注册唯一性

OpenIM 原生 credential.account 唯一索引阻止相同登录凭证重复写入。
但 Chat RPC 的邮箱注册预检查错误地查询 attribute.account，
CheckUserExist 又错误地使用 areaCode 查邮箱凭证。
重复邮箱在写入 attribute 后才发生 E11000，线上测试留下不完整账号。
registration.patch 修正这两处查询，并将 AccountCheckSingle 的“账号存在”
结果正常返回给注册检查，最终返回 EmailAlreadyRegister (20014)。
前端将该错误显示为“该邮箱已注册，请直接登录或找回密码”。

Dockerfile 保留原有收藏、邮箱 API 补丁，并构建修正后的 chat-rpc。
固定源码的 RPC、配置和协议与 v1.8.4-patch.5 相同。

回归测试：补丁内 registration_test.go 验证邮箱预检查及已注册凭证查询。
应用补丁后执行：

```sh
go test ./internal/rpc/chat ./pkg/common/imapi -run 'TestDuplicateEmail|TestExistingEmail|TestExistingIMAccount' -count=1
TEST_FIXTURES=/path/to/private-test-accounts.json node server-patches/chat/registration-api-test.mjs
cd 99chat && npm run build
```

手机号：原生手机号账号已有重复注册检查；邮箱注册界面的可选手机号
仍为 99chat_contact_profiles 资料，没有唯一约束。这部分是否禁止不同
邮箱共用手机号，等待用户确认；本补丁不改变手机号资料规则。

本次重复注册测试的残留账号 7079307657 已按 user_id 清理 attribute、
account、register 三条记录，无 credential 或 OpenIM user，未触及正式账号。

## 线上验证（2026-10-08）

- Chat 镜像：99chat/openim-chat:registration-20261008-v2，healthy。
- 原配置备份：/opt/openim/docker-compose-custom.yml.before-registration-20261008。
- 重复邮箱返回 20014；重复原生手机号返回 20003，均早于验证码校验。
- 邮箱与手机号对应 attribute 各 1 条；duplicate-check 残留 0 条。
- Ego 浏览器真实点击注册，显示“该邮箱已注册，请直接登录或找回密码”。
- 原有独立测试账号登录、联系人资料、收藏接口均通过。
- Go 三个回归测试、前端生产构建通过；只重建 web 和 openim-chat。

回滚：恢复上述 Compose 备份并仅重建 openim-chat；前端可使用镜像
chat-project-web:before-registration-5ee10a5，不删除任何数据卷。
