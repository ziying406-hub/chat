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

生产发布完成：功能提交 e360268，缓存更新提交 353aa66；Chat 镜像 99chat/openim-chat:email-e360268，前端资源 index-BjoEBrjt.js / index-GySbuskm.css。服务工作线程缓存版本为 99chat-email-auth-v3，已有客户端可收到更新。Nginx 配置校验通过，Chat 与 IM Server 均 healthy。

email_auth_live_smoke.cjs 在线上用同一授权 Gmail 的独立 +99chatqa 别名通过：真实 SMTP 验证码 → 页面注册 → IM SDK 登录 → +60 选填手机号数据库保存及跨会话读取 → 拒绝资料手机号登录 → 邮箱密码与真实验证码登录 → 错误验证码拒绝重置 → 邮箱密码重置后旧密码失效、新密码登录同一用户 ID。验证码由私有测试读取器取得，既不输出也不写入代码。测试账号保留，没有修改客户账号或发送聊天消息。

配置备份目录 /opt/openim/backups/email-auth-20261005；旧镜像 99chat/openim-chat:before-email-e360268、chat-project-web:before-email-e360268。回滚时恢复该目录中的 docker-compose-custom.yml，并将旧 Web 镜像重新标记为 chat-project-web，再分别用现有 Compose 文件仅重建 openim-chat 与 web；无需删除数据库或数据卷。

SMTP 密码与邮箱验证码不进入 Git 或前端产物。
