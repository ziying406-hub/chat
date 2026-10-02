# 找回密码发布验证（2026-10-02）

已将 `c57fbea`（原生密码重置流程）和 `ff453c8`（生产接口地址配置）推送到 `origin/main`：`https://github.com/ziying406-hub/chat`。

服务器 `/opt/chat-project` 从 `6fc6324` 快进至 `ff453c8`，保留未纳入 Git 的 Docker、Nginx 和 SDK 构建补丁。构建通过并只更新 `web`，前端启动时间为 `2026-10-02T10:11:05Z`（马来西亚时间 18:11）。发布资源为 `index-Cs_80Gk_.js` 和 `index-hxPY5xIo.css`，Nginx 配置检查通过。OpenIM Server 和 Chat 容器的 ID、启动时间未变，均为 healthy。

发布前，线上回归在“找回密码页面应可进入”的断言失败。发布后 `password_reset_e2e.cjs` 使用独立新建的线上测试账号完整通过：

- 找回密码公开路由可从登录页进入并直接刷新，390px 宽度无横向溢出。
- 对已注册账号发送验证码使用 `usedFor: 2`；60 秒后允许重发。
- 短密码及两次密码不一致在页面阻止提交。
- 错误验证码被真实 API 拒绝，原密码仍能登录。
- 成功重置调用 `/account/password/reset`，不重发验证码、不调用注册接口。
- 重置后原密码登录失败，新密码登录成功，用户 ID 与重置前一致。
- 成功提示及返回登录可用。

测试验证码通过环境变量传入，不写入代码、Git 或发布记录。线上测试账号保留；没有改动客户账号。验证覆盖原生验证码接口和密码持久化，不代表真实短信已送达。构建保留原有大包提示；`npm ci` 审计报告 4 条高危依赖告警，本次没有更改依赖。

## 回滚

服务器源码及部署配置备份：`/opt/chat-project/backups/password-reset-c57fbea-20261002/source.tgz`。旧前端镜像：`chat-project-web:before-password-reset-c57fbea-20261002`。

在 `/opt/chat-project` 执行以下命令只回退前端：

```sh
docker image tag chat-project-web:before-password-reset-c57fbea-20261002 chat-project-web
docker compose up -d --no-deps --no-build web
```
