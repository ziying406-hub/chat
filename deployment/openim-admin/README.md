# 99chat OpenIM 管理后台

入口：https://admin.99chat99.com/login

使用基于官方 `openim/openim-admin-front:release-v1.8.4-patch.2` 构建的 `99chat/openim-admin-front:email`，与生产 OpenIM Chat v1.8.4-patch.5 配套。部署文件位于服务器 `/opt/openim/admin`。新增管理网页及监控容器，复用外部网络 `99chat_default` 和现有 Chat/IM API，不重建现有服务或数据卷。

前端在 HTTPS 下使用当前域名的 `/complete_admin`、`/chat`、`/api`，由 Nginx 分别代理到现有管理 API、Chat API、OpenIM API。管理网页业务路由也使用 `/chat`；因此该前缀的 GET 请求返回 SPA，POST 请求代理到 Chat API，以保证用户列表直接访问及刷新正常。Traefik 使用独立 Host 规则和现有 letsencrypt resolver 提供 HTTPS。

## 部署

```sh
cd /opt/openim/admin
docker compose -f compose.yml config --quiet
docker compose -f compose.yml build admin
docker compose -f compose.yml up -d
docker exec openim-admin-front nginx -t
```

上线前检查默认管理员凭据，使用原生 `/account/change_password` 替换默认密码，或通过原生 `/account/add_admin` 创建独立管理员；凭据仅保存于服务器 `/opt/openim/secrets/admin-access.json`（0600）和用户本地私有文件，不提交 Git。

## 只读验证

```sh
ADMIN_ACCESS_FILE=<私有登录凭据JSON> node deployment/openim-admin/test.mjs
```

JSON 包含 url、account、password。测试验证 HTTPS 页面、未登录访问拒绝、原生管理员登录与资料读取，以及现有用户和群组列表。不会发送消息、修改用户或群组。

## 创建用户邮箱

创建新用户弹窗新增选填邮箱，保留原有手机号必填规则。原生 `/complete_admin/user/import/json` 将 `RegisterUserInfo.email` 交给与个人注册共用的 RegisterUser RPC，存入 `openim_v3.attribute.email` 和 `openim_v3.credential` 的邮箱登录凭据（type=2）。后台填写的邮箱可用于 99chat 邮箱密码登录；管理员创建账号不代表已完成用户收件验证。重复邮箱由原生 RPC 拒绝（20014），界面显示中文提示。

后台密码采用官方 MD5 协议，99chat 页面提交原密码，两者的登录兼容修复位于 `server-patches/chat/password-login.patch`，需部署相应 Chat 镜像。2026-10-08 已用后台单个创建及批量创建的独立账号，在真实 99chat 表单输入原密码并进入聊天页；旧测试仅验证预先 MD5 的接口登录，已改为原密码测试，并补充 `browser-login-e2e.mjs` 覆盖 SDK 和页面。

`add-email.py` 对固定版本官方镜像的现有 Ant Design 表单、提交字段和重复邮箱提示作定点修改；不引入另一套页面或注册后端。修改后的入口及用户列表脚本使用新文件名，以避开 CDN 旧脚本缓存。升级官方版本时需重新核对 patch 位置。

构建前可从原版镜像提取用户列表脚本，运行 `python3 test-email-patch.py <原版用户列表脚本路径>`。`email-create-e2e.mjs` 通过 ego-browser 执行，前置配置 `globalThis.adminEmailTest={spaceId,fixture,adminAccess}`；fixture 为私有 JSON，含 nickname、唯一 phoneNumber、唯一 email、password，adminAccess 为私有管理员登录文件。每次创建测试须使用新账号资料，测试会持久化一个独立用户，不发送邮件或聊天消息。

2026-10-08 线上验证：真实后台表单创建独立用户成功，原生邮箱密码登录成功；换不同手机号仍不能重复邮箱创建。Mongo 中同一 userID 的邮箱资料及 type=2 登录凭据各一份，被拒绝的重复用户未产生。回滚：使用 `compose.yml.before-email-20261008` 恢复原版管理网页配置并仅重建 admin 容器；监控与 IM/Chat 服务无需变更。

## 批量创建用户

位置：业务系统 → 用户管理 → 用户列表 → 批量创建用户。每行四列：昵称、邮箱、手机号、密码，使用 Tab 或英文逗号分隔；可从表格复制四列粘贴。每批最多 50 条，邮箱必填、手机号选填（区号 +86）。点击“检查账号”后预览，确认内容再点击“开始创建”。结果显示每个账号的状态及成功用户 ID，不显示密码。输入和密码仅保存在当前页面内存，提交后清除输入，完成后清除密码。

为返回准确的逐条结果，批量按钮逐条调用原生 `/chat/account/register`，沿用管理员 token、共享 RegisterUser RPC 和已有手机号唯一预留约束。使用原始 `/user/import/json` 一次提交整个数组，会在第一条错误时停止且无法返回每条账号的结果。本实现无需后端新增接口。重复邮箱/手机号显示失败并继续下一条；网络或其他无法确认的服务异常停止队列，提示查询用户列表，未发送的行显示“待创建”。提交的批次锁定，不提供自动重试。只通过“新建批次”输入新的账号资料。

测试：`node deployment/openim-admin/test-batch.mjs` 验证解析、批内重复、逐条结果、密码清理和不确定结果停止。`batch-create-e2e.mjs` 使用 ego-browser，前置 `globalThis.adminBatchTest={spaceId,fixture}`；fixture 是四条私有独立测试资料（两条新账号、一条已有邮箱、一条已有手机号），包含 nickname/email/phoneNumber/password。2026-10-08 线上真实表单验证：成功2条、失败2条，新账号均可邮箱密码登录（含无手机号账号）；数据库邮箱资料和凭据均与相同用户 ID 关联，重复项未生成用户，填写手机号的账号保存在唯一联系人资料中。网络及未知服务异常停止通过单元测试验证。

回滚到本次改动前：将 admin 的 image 设为服务器保留的 `99chat/openim-admin-front:before-batch-20261008`，执行 `docker compose -f compose.yml up -d --no-deps --no-build admin`。仅影响管理网页，保留已创建账号。

2026-10-06 线上验证：Nginx 检查通过，HTTPS 200；测试读取 10 个用户及 10 个群组，所有断言通过。浏览器真实表单登录后显示业务用户列表和群组列表（含已有正式数据及独立测试数据）；直接访问并刷新业务用户列表后仍返回真实用户行。管理账号 chatAdmin 的默认密码已通过原生 API 改为随机密码。

数据监控已接入 Grafana 13.2.3 与 Prometheus 3.15.0。原生 `/prometheus_discovery` 自动发现采集地址，不固定动态监听端口。监控服务仅连接内部 Docker 网络，网页通过 `/grafana/` HTTPS 代理，禁止匿名访问和注册。监控首次登录使用后台登录资料中的账号密码；两者是独立会话，密码后续修改也需分别管理。原生监控重定向入口由 Nginx 改为同源相对地址，避免 HTTP 重定向被 HTTPS 页面拦截。

提供同版本 OpenIMServer 的官方 Demo 仪表盘，仅替换数据源 UID、标题和仪表盘 UID；来源为 openimsdk/open-im-server v3.8.3-patch.15 config/grafana-template/Demo.json。Prometheus 保留 15 天数据；Grafana 配置与数据保存于独立持久卷。2026-10-06 验证仪表盘及数据源 API 正常，25 个 OpenIM 采集目标全部 up=1。浏览器从后台“数据监控”进入内嵌 Grafana，登录后 UP 图表显示来自实际服务的实时序列。所有按钮的写操作未逐项验收，用户与群组数据读取和登录已验证。

## 停止管理网页

```sh
cd /opt/openim/admin
docker compose -f compose.yml down
```

停止管理网页和监控容器；保留现有 IM/Chat 服务、数据、监控数据卷和管理员凭据。凭据轮换与网页生命周期独立，不恢复默认密码。
