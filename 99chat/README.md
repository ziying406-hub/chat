# 99chat

99chat 是基于 React、Vite 和 OpenIM 构建的即时通讯客户端。前端位于本目录，OpenIM Docker 服务位于 `../openim-docker`。

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址为 `http://localhost:5199`。启动前请确保 OpenIM 服务可用：

```bash
cd ../openim-docker
docker compose up -d
```

生产构建：

```bash
npm run build
```

## 离线消息通知

前端使用 Firebase Web SDK，后端使用 OpenIM 原生 FCM 提供者。用户在「通知设置 → 新消息通知」授权并完成 Token 绑定后启用，关闭通知或主动退出时撤销浏览器订阅。Chrome 无痕模式不支持 Web Push；普通浏览器也需允许系统通知并可访问 Google 推送服务。

Firebase 公开 Web 配置位于 `public/firebase-config.js`。Admin SDK 私钥只能保存在服务器仓库外，不能放进此目录或 Git。部署和真实送达测试见 [FCM 配置说明](../server-patches/push/README.md)。

## 服务端收藏

“我的收藏”由 99chat 增加了服务端持久化能力，不是 OpenIM 可通过配置开启的内置功能。收藏记录按当前登录用户隔离，保存到 MongoDB 的 `99chat_favorites` 集合；因此同一账号在不同浏览器或设备上登录后可以读取相同收藏。

收藏 API 由自定义 `openim-chat` 镜像提供，并且必须携带当前登录得到的 `chatToken`：

| 接口 | 用途 |
| --- | --- |
| `POST /user/favorites/list` | 读取当前用户的收藏，按收藏时间倒序返回 |
| `POST /user/favorites/save` | 新建或更新一条收藏；`clientMsgID` 是同一用户内的唯一键 |
| `POST /user/favorites/delete` | 删除当前用户的一条收藏 |

服务端从令牌获取用户身份，不接受前端指定的用户 ID。前端在服务临时不可用时会保留本机回退数据；服务恢复后新收藏会同步写入服务端。

当前本地部署使用镜像：

```text
99chat/openim-chat:favorites
```

该镜像的源码在 `../99chat-chat-api`。重新构建和部署后，可通过下列命令查看服务状态：

```bash
cd ../openim-docker
docker compose up -d --no-deps --force-recreate openim-chat
docker inspect openim-chat --format '{{.State.Health.Status}}'
```
