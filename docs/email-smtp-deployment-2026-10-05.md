# 企业邮箱 SMTP 接入验证（2026-10-05）

线上 OpenIM Chat 已启用原生邮件验证码通道：发件邮箱 `admin@99chat99.com`，SMTP 主机 `smtp.hostinger.com`，SSL 端口 465，邮件主题为“99chat 邮箱验证码”。邮箱密码仅保存在私密配置，不写入前端、Git 或验证输出。

生产服务器的 SMTP 登录已验证。邮件配置保存于 `/opt/openim/secrets/chat-rpc-chat-mail.yml`，目录权限 700、文件权限 600，通过 Docker Compose 只读挂载到 Chat 配置路径。仅重建 Chat 服务，Chat 和 IM Server 均为 healthy。

验证结果：

- 第一封 SMTP 测试邮件已由用户确认实际收到。
- `email_verify_smoke.cjs` 通过线上 `/account/code/send` 向用户授权的测试邮箱发送一次真实注册验证码，接口返回成功。
- 同一测试通过 `/account/code/verify` 确认错误验证码被拒绝。
- 用户反馈原生验证码邮件暂未收到。刷新 Hostinger 日志后，16:15:57 的原生验证码邮件显示“已交付”，详情返回 `250 2.0.0 Ok: queued`。SMTP 平台投递已确认，用户在 Gmail 中实际找到验证码邮件仍待确认。
- 生产数据库 `openim_v3.verify_code` 已生成该邮箱的真实验证码记录，错误校验次数被记录；固定测试码在该验证码过期后被返回 `20007` 拒绝。邮件配置已生效，没有走原测试码旁路。

运行测试必须明确指定收件邮箱。它会发送一封真实邮件，要求该邮箱尚未注册；不创建或修改用户账号：

```sh
E2E_CHAT_API=https://999.99chat99.com/chat TEST_EMAIL=<授权的测试邮箱> node 99chat/email_verify_smoke.cjs
```

用户随后确认已收到原生验证码。邮箱注册、登录、找回密码、选填手机号数据库保存和旧账号绑定邮箱均已完成并上线，详见 email-auth-deployment-2026-10-05.md。启用邮件通道后，原生验证码校验使用真实邮件验证码，固定测试码不再作为绕过方式；手机号短信通道仍未启用。

回滚配置备份位于 `/opt/openim/backups/mail-20261005`。将其中的 `docker-compose-custom.yml` 恢复到 `/opt/openim/docker-compose-custom.yml`，在 `/opt/openim` 执行以下命令可撤销新增邮件配置挂载：

```sh
docker compose -f docker-compose-custom.yml up -d --no-deps --no-build openim-chat
```
