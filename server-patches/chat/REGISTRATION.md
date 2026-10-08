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

## 选填手机号唯一性

用户确认：换邮箱注册时，也不能填写相同手机号。
contact-unique.patch 在 99chat_contact_profiles 上增加区号和手机号的
部分唯一索引（排除空号码）。原资料保留，补充 userID 查询字段；
GetContact / SaveContact 使用该字段查询。

注册 API 增加 contact 字段。填写手机号时先原子占用号码，RPC 注册
成功后绑定实际 userID；注册失败释放占用。15 分钟 TTL 只清理进程
异常退出时留下的未完成占用，已完成记录不设过期时间。
原生手机号账号通过 CheckUserExist 同样排除占用。
个人资料保存也执行唯一约束，且普通 /user/update 不再允许绕过该路径
修改手机号。空手机号仍可不填；原账号重复保存自己的号码允许。

前端将选填手机号随注册一起提交，取消注册成功后另存手机号的步骤。
相同号码按区号区分，区号会去掉多余前导零（+086 与 +86 相同）。

独立生产测试（会创建一个测试账号并发送一封验证码）：

```sh
TEST_FIXTURES=/path/to/private-accounts.json \
PHONE_TEST_FIXTURE=/path/to/private-phone-account.json \
TEST_CODE_READER=/path/to/private-test-code-reader \
node server-patches/chat/contact-unique-api-test.mjs
```
