# 99chat OpenIM 管理后台

入口：https://admin.99chat99.com/login

使用官方 `openim/openim-admin-front:release-v1.8.4-patch.2`，与生产 OpenIM Chat v1.8.4-patch.5 配套。部署文件位于服务器 `/opt/openim/admin`。新增管理网页及监控容器，复用外部网络 `99chat_default` 和现有 Chat/IM API，不重建现有服务或数据卷。

前端在 HTTPS 下使用当前域名的 `/complete_admin`、`/chat`、`/api`，由 Nginx 分别代理到现有管理 API、Chat API、OpenIM API。管理网页业务路由也使用 `/chat`；因此该前缀的 GET 请求返回 SPA，POST 请求代理到 Chat API，以保证用户列表直接访问及刷新正常。Traefik 使用独立 Host 规则和现有 letsencrypt resolver 提供 HTTPS。

## 部署

```sh
cd /opt/openim/admin
docker compose -f compose.yml config --quiet
docker compose -f compose.yml up -d
docker exec openim-admin-front nginx -t
```

上线前检查默认管理员凭据，使用原生 `/account/change_password` 替换默认密码，或通过原生 `/account/add_admin` 创建独立管理员；凭据仅保存于服务器 `/opt/openim/secrets/admin-access.json`（0600）和用户本地私有文件，不提交 Git。

## 只读验证

```sh
ADMIN_ACCESS_FILE=<私有登录凭据JSON> node deployment/openim-admin/test.mjs
```

JSON 包含 url、account、password。测试验证 HTTPS 页面、未登录访问拒绝、原生管理员登录与资料读取，以及现有用户和群组列表。不会发送消息、修改用户或群组。

2026-10-06 线上验证：Nginx 检查通过，HTTPS 200；测试读取 10 个用户及 10 个群组，所有断言通过。浏览器真实表单登录后显示业务用户列表和群组列表（含已有正式数据及独立测试数据）；直接访问并刷新业务用户列表后仍返回真实用户行。管理账号 chatAdmin 的默认密码已通过原生 API 改为随机密码。

数据监控已接入 Grafana 13.2.3 与 Prometheus 3.15.0。原生 `/prometheus_discovery` 自动发现采集地址，不固定动态监听端口。监控服务仅连接内部 Docker 网络，网页通过 `/grafana/` HTTPS 代理，禁止匿名访问和注册。监控首次登录使用后台登录资料中的账号密码；两者是独立会话，密码后续修改也需分别管理。原生监控重定向入口由 Nginx 改为同源相对地址，避免 HTTP 重定向被 HTTPS 页面拦截。

提供同版本 OpenIMServer 的官方 Demo 仪表盘，仅替换数据源 UID、标题和仪表盘 UID；来源为 openimsdk/open-im-server v3.8.3-patch.15 config/grafana-template/Demo.json。Prometheus 保留 15 天数据；Grafana 配置与数据保存于独立持久卷。2026-10-06 验证仪表盘及数据源 API 正常，25 个 OpenIM 采集目标全部 up=1。浏览器从后台“数据监控”进入内嵌 Grafana，登录后 UP 图表显示来自实际服务的实时序列。所有按钮的写操作未逐项验收，用户与群组数据读取和登录已验证。

## 停止管理网页

```sh
cd /opt/openim/admin
docker compose -f compose.yml down
```

停止管理网页和监控容器；保留现有 IM/Chat 服务、数据、监控数据卷和管理员凭据。凭据轮换与网页生命周期独立，不恢复默认密码。
