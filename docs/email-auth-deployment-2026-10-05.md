# 邮箱认证与可选手机号（2026-10-05）

已按用户确认的方案接入：邮箱验证码注册、邮箱密码/验证码登录、邮箱找回密码；旧手机号账号保留密码登录，可在设置 → 安全中验证并绑定邮箱。用户已确认收到原生 OpenIM 发往 ziying406@gmail.com 的验证码。

邮箱身份沿用 OpenIM 原生 account/register、account/login、account/code/send 和 account/password/reset。验证码用途分别为注册 1、找回密码 2、登录 3。验证码登录不会重新发送验证码或调用注册接口。安全页修改密码使用原生 account/password/change，并携带 Chat token。

OpenIM 原生手机号属于登录凭据。选填手机号不传入原生邮箱注册的 user.phoneNumber，而通过带 Chat token 的 user/contact/save 保存到 MongoDB 的 99chat_contact_profiles，以当前 token 用户 ID 为 _id，同时保存用户选择的 areaCode。user/contact/get 返回当前用户邮箱与资料电话；无自定义资料的旧账号读取原生电话。用户可在编辑资料中修改或清空选填电话。保存失败会明确提示账号已创建，登录后可重试资料保存。

user/email/bind 先验证邮箱验证码，再为 token 对应的当前用户绑定邮箱；普通 user/update 拒绝直接修改邮箱，避免绕过验证。补丁仅重编译 Chat API，保持生产 RPC 和其数据库格式。server-patches/chat/email-auth.patch 在固定上游 22dc25e 加 favorites.patch 后应用。

本地验证：

- npm run build 通过。
- go test ./internal/api/chat 编译通过；本地容器加载重新编译的 Chat API，RPC 保持现有版本。
- TEST_VERIFY_CODE=666666 node email_auth_e2e.cjs 通过真实 API/SDK：邮箱注册、选填 +60 电话数据库保存及跨会话读取、拒绝资料电话登录、拒绝无 token 写资料、密码及验证码登录、错误验证码拒绝重置、重置后旧密码失效且用户 ID 不变、旧手机号登录与页面绑定邮箱、拒绝未验证邮箱更新、认证修改密码。
- 本地测试验证码仅用于关闭真实发信的独立测试环境，生产仍使用真实邮箱验证码。

生产发布记录在部署及线上验证完成后补充。SMTP 密码与邮箱验证码不进入 Git 或前端产物。
