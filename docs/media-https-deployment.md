# OpenIM 图片及头像的 HTTPS 部署

2026-09-10 线上排查：HTTPS 页面上传被 `mixed-content` 拦截；修复上传后，
图片消息已到达另一账号，但 `/object/` 下载路径落入 Nginx 静态文件规则，返回 404。
这是 OpenIM 自带对象存储功能的部署配置问题，不是新增头像或图片 API。

## 配置

OpenIM 服务的 Compose 环境变量：

```yaml
- IMENV_MINIO_INTERNALADDRESS=openim-minio:9000
- IMENV_MINIO_EXTERNALADDRESS=https://999.99chat99.com
```

在网站 Nginx `server` 内加入以下两段。`^~` 防止 `.png` 等静态资源正则抢走请求；
MinIO 转发不能去掉 bucket 路径或改写已签名的 Host。

```nginx
location ^~ /object/ {
    proxy_pass http://openim-server:10002;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-Proto https;
    add_header Cache-Control "no-store";
}

location ^~ /openim/ {
    client_max_body_size 100m;
    proxy_pass http://openim-minio:9000;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_request_buffering off;
    proxy_buffering off;
    proxy_read_timeout 300s;
}
```

Traefik 在前端终止 TLS，Nginx 内部接收 HTTP。`/api/` 转发需要增加：

```nginx
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Request-Api https://999.99chat99.com;
```

OpenIM v3.8.3-patch.15 的 `setURLPrefix` 使用 `X-Request-Api`，不读取
`X-Forwarded-Proto`；只设置后者仍会生成 HTTP 对象链接。
参见 [对应版本源码](https://github.com/openimsdk/open-im-server/blob/v3.8.3-patch.15/internal/api/third.go)。
固定 HTTPS 配置仅适用于此 HTTPS-only 站点。

网站 Compose 使用持久配置挂载，避免容器重建后丢失修改：

```yaml
volumes:
  - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

线上配置文件为 `/opt/chat-project/nginx.conf`、
`/opt/chat-project/docker-compose.yml`、`/opt/openim/docker-compose-custom.yml`。
三份原配置均备份为同目录的 `*.before-media-https-20260910`。
先校验 Compose 和 Nginx，再只重建涉及的服务，不重启数据库。
注意原子替换单文件 bind mount 后，需重建网站容器重新挂载新 inode；单纯 reload 可能仍读旧文件。
回滚时恢复对应备份并重建对应服务。不要提交包含服务端密码的完整 Compose。

## 验证

上传一张新的测试图片，用它的 HTTPS 对象地址运行（不要把临时签名参数放入日志）：

```sh
node 99chat/media_https_smoke.mjs 'https://999.99chat99.com/object/USER/IMAGE.png'
```

这只验证下载通道，不替代浏览器联调。浏览器还需检查：

- 个人头像上传、点击保存、重新登录后仍显示新头像。
- 群主修改群头像，另一成员重新打开群后显示相同头像。
- A 发送新图片，B 收到同一图片且 `naturalWidth > 0`，重新进入会话仍可加载。

修复前已失败的消息不会自动补发，需要重新发送。已缓存的旧 404 与新上传图片要区分验证。

本次浏览器实测结果：345 在内置浏览器发送，123 在 Chrome 收到新图片，
最终对象地址为 HTTPS，收件端图片解码为 343×361；个人头像点击保存后，
重新登录仍可加载 343×361 的测试头像。群 1006740628 的群主为 234，
当时两端都是普通成员，因此原群头像修改尚待群主账号实测，不能标记通过。
线上刷新仍会跳转登录页，这项已有问题未包含在本次存储配置修复中。

群管理的「设置」顶部现增加「群头像」预览与「更换头像」按钮。
群主选择图片后立即上传并保存，不需要再点下方群名称等资料的「保存」。
上传中禁用按钮，成功显示「群头像已更新」，失败显示错误；普通成员只查看。
原通讯录群资料页面的小相机入口保留。复用 OpenIM 上传及 `setGroupInfo`，不新增后端接口。
