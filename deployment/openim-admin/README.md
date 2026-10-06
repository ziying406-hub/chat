# 99chat OpenIM 管理后台

入口：https://admin.99chat99.com/login

使用官方 `openim/openim-admin-front:release-v1.8.4-patch.2`，与生产 OpenIM Chat v1.8.4-patch.5 配套。部署文件位于服务器 `/opt/openim/admin`。新增管理网页容器，复用外部网络 `99chat_default` 和现有 Chat/IM API，不重建现有服务或数据卷。

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

数据监控需要额外部署和接入 Grafana/Prometheus；本次没有部署监控服务。所有按钮的写操作未逐项验收，用户与群组数据读取和登录已验证。

## 停止管理网页

```sh
cd /opt/openim/admin
docker compose -f compose.yml down
```

只移除管理网页；保留现有服务、数据和管理员凭据。凭据轮换与网页生命周期独立，不恢复默认密码。
