# OpenIM 原生 FCM Web 推送

使用现有 OpenIM `push` 服务和 SDK `updateFcmToken`，没有新增自建推送 API。

## 配置

1. Firebase 项目启用 Cloud Messaging API V1，创建 Web 应用并生成 Web Push 公钥（VAPID）。
2. 将公开 Web 配置及 VAPID 公钥填入 `99chat/public/firebase-config.js`。这些不是 Admin SDK 私钥。
3. 从 Firebase「项目设置 → 服务账号」生成 JSON 私钥，保存在服务器仓库之外，例如 `/opt/openim/fcm/service-account.json`；目录权限 700、文件权限 600。禁止提交 Git 或放入前端 public 目录。
4. 从正在使用的 OpenIM 镜像复制完整 `config/openim-push.yml`，保留其他配置，只修改顶层 `enable: fcm` 和 `fcm.filePath: fcm-service-account.json`。
5. 在现有服务端 Compose 的 `openim-server` 服务合并以下挂载，保留原镜像、健康检查、登录策略及其他配置：

```yaml
volumes:
  - /opt/openim/fcm/openim-push.yml:/openim-server/config/openim-push.yml:ro
  - /opt/openim/fcm/service-account.json:/openim-server/config/fcm-service-account.json:ro
```

备份原配置后，先执行 `docker compose -f <实际配置文件> config --quiet`，再只重建 `openim-server` 容器；不要替换现有权限补丁镜像。前端按现有部署流程重新构建。

前端 Nginx 需合并本目录 `nginx-cache.conf`，放在通用静态文件正则之前。Worker 与配置脚本使用 `no-store`，不能设置 30 天 immutable；已有 CDN 缓存需清除。本次推送 Worker 注册 URL 使用 `?v=2` 避开先前已缓存的错误版本。

## 客户端行为与边界

- 用户在「通知设置 → 新消息通知」主动开启并授予浏览器权限；取得真实 Token 且 OpenIM 绑定成功后才显示启用成功。
- 使用独立 `/firebase-cloud-messaging-push-scope` 的 Service Worker，不覆盖 PWA 缓存 Worker。
- 关闭通知、开启免打扰和主动退出账号时撤销该浏览器的 Firebase Token；偏好按账号隔离。
- 已开启的账号重新登录会重新绑定 Token。通知点击打开同源消息页。
- 需要 HTTPS（开发 localhost 除外）、浏览器推送支持及 Google 推送服务可达。关闭网页不等于完全退出浏览器；系统权限、节电和浏览器后台设置仍会影响通知。
- 当前 OpenIM 每用户/平台保存一个 Token，不能据此声称同账号多个 Web 都能收到离线通知；本次不修改多端登录策略。
- Firebase npm 与 Worker compat 使用 12.18.0。`predev` / `prebuild` 从 npm 包生成同源 `public/firebase-sdk/` 脚本（生成目录不入库），避免跨域 CDN 脚本被拦截。提交锁文件并用 `npm ci`，避免重复 `@firebase/app` 导致 `Service messaging is not available`。

## 真实回归

```sh
cd 99chat
E2E_BASE=https://<部署域名> TEST_VERIFY_CODE=<环境验证码> TEST_OFFLINE_PUSH=1 node fcm_registration_e2e.cjs
```

脚本注册独立测试账号、真实绑定订阅、建立好友关系、关闭接收端应用页面后发消息、读取浏览器原生通知并撤销订阅。测试不模拟 FCM 或通知对象；测试账号与消息保留，不改业务群。以实际退出码与断言结果为准，不以构建通过代替送达验证。
