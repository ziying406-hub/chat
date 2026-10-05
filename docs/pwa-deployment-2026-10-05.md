# 99chat 手机 PWA

手机方案沿用现有 React/OpenIM 客户端和手机布局。补齐安装图标、180px Apple Touch 图标、稳定 ID /、名称 99chat、standalone 显示和 /#/messages 启动路径；未登录由现有路由跳转邮箱登录。删除不存在的 iOS 启动画面引用。

支持原生 Chromium 安装提示，iPhone 显示 Safari 分享→添加到主屏幕的引导；已在独立模式运行时不再提示安装。首次 worker 接管页面不提示“新版本”，更新接管才提示刷新。

Service Worker 使用 99chat-pwa-v1 缓存：导航、安装清单和公开推送配置在线优先，断网回退；构建 JS/CSS、图标和 WASM 使用静态缓存。安装阶段同时缓存页面引用的构建资产与启动配置，避免首次打开后立即断网时缺少依赖。POST、API 和外域请求不进入该缓存。保留现有独立 FCM 推送 worker。

验证：npm run build 和 node pwa_e2e.cjs 通过。测试涵盖 PNG 尺寸与内容、Chromium 安装条件无错误、Apple 图标、首次安装状态、旧缓存被在线新页面替换、初次安装已有公开启动配置缓存、离线配置请求与页面刷新、iPhone UA 安装提示/稍后持久化、独立模式不提示、390px 页面无横向溢出。线上以 E2E_BASE=https://999.99chat99.com 运行同一测试，最终版本全部通过。

浏览器与模拟模式验证不能代替真实手机系统安装；实际添加到主屏幕由用户在手机上完成。本次不宣称验证 iPhone/Android 后台消息推送或离线发送消息。聊天、登录和消息同步需要网络。

代码主提交 756b332；启动配置补齐提交 5144d6e。只更新 Web，保持 OpenIM 服务与邮箱配置。回滚镜像为 chat-project-web:before-pwa-756b332，在 /opt/chat-project 重新标记为 chat-project-web 后执行 docker compose up -d --no-deps --no-build web 即可，不需要更改数据库。

安装参考：[MDN 安装条件](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)、[Apple 添加到主屏幕](https://support.apple.com/en-au/guide/iphone/iph42ab2f3a7/ios)。
