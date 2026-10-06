# OpenIM 群权限补丁

基于 `openim/openim-server:v3.8.3-patch.15`，替换群权限服务及 Web 多登录涉及的 `openim-rpc-auth`、`openim-msggateway`，沿用原镜像启动方式、配置和其他服务。
补丁对应上游 tag 源码（commit `865bb89517b48493ef9b1b5d9fde87fe0cb05cc7`），不涉及数据库迁移。

## 修复范围

- 群成员角色变更仅允许群主或服务端应用管理员；普通群管理员不能提升成员身份。
- 收到的审批列表校验 `fromUserID` 必须为当前调用者（服务端应用管理员除外）。
- 自己发出的申请列表校验 `userID`，不能读取其他用户的申请历史。
- 批量申请查询要求是对应群的群主或管理员。申请者查询自己的记录仍使用自己的申请列表或单人申请查询接口。

这些是服务端鉴权，不依赖前端隐藏按钮，也不信任请求体中声称的操作者身份。

## 构建和本地验证

在仓库根目录执行：

```sh
docker build -t 99chat/openim-server:group-permissions -f server-patches/Dockerfile server-patches
cd openim-docker
OPENIM_SERVER_IMAGE=99chat/openim-server:group-permissions docker compose up -d --no-deps openim-server
cd ../99chat
TEST_VERIFY_CODE='<本地测试验证码>' node group_permissions_api_test.mjs
node group_permissions_e2e.cjs
node group_application_e2e.cjs
```

API 测试固定访问 localhost 的 10002/10008，创建四个独立账号和一个临时群，不使用服务端应用管理员 token。
每个拒绝用例检查返回值和修改前后的持久化状态；合法操作也读取服务端结果。
结束时解散本轮测试群，保留测试账号。不扫描已有用户或群，不针对生产地址执行。

生产部署需先确认现有镜像版本，保留原配置及镜像作为回滚点，再更新 Compose 的服务镜像字段
（使用变量的部署则切换 `OPENIM_SERVER_IMAGE`）。
这会重启 OpenIM 容器，客户端可能短暂重连；不是单纯刷新网页或重建前端即可生效。
回滚时恢复部署前的镜像字段或变量，再重建同一个服务；不要删除数据卷。

2026-09-10 已部署生产版本 `99chat/openim-server:permissions-7272acb`，
45 项接口权限回归通过。实际生产配置位置、备份及验证范围见
[群权限发布记录](../docs/group-permissions.md#生产发布)。

## 仅 Web 多实例登录

`web-multilogin.patch` 在 `multiLogin.policy: 1` 下只放开 `WebPlatformID=5`：

- Auth 保留已有 Web Token，仍按 `maxNumOneEnd` 限制数量（生产为 30）。其他平台登录也不会顺带清除 Web Token。
- 网关不再踢掉同账号的其他 Web 连接；非 Web 互踢分支保持原逻辑，其他 policy 不变。
- 不改数据库，不新增登录 API，不改变群权限或收藏服务。
- 多 Web 在线不等于多 Web 离线推送；原生 FCM 仍每用户/平台保存一个 Token。

镜像构建中运行 `TestWebOnlyMultiLogin`，包括 Web 共存、非 Web 登录保留 Web、Web 登录保留其他平台、30 个凭据上限。真实浏览器回归：

```sh
cd 99chat
E2E_BASE=https://<部署域名> TEST_VERIFY_CODE=<环境验证码> node web_multilogin_e2e.cjs
```

测试用独立账号验证双 Web Token、双端收发、刷新和单端退出；通过真实平台登录/API 验证 iOS、Android、Windows、Mac 仍互踢旧 Token。不代表原生客户端 UI 已实测。

生产候选镜像 `99chat/openim-server:web-only-multilogin`；Compose 仍保留 `policy: 1` 和 Firebase 挂载。回滚使用 `/opt/openim/backups/compose.before-web-multilogin.yml` 中原配置，再仅重建 `openim-server`，不要删除数据卷。

## 删除好友后拒收私聊

OpenIM 原生删除好友是单向删除。开启 `openim-rpc-msg.yml` 的 `friendVerify` 后，
服务端发送私聊时检查接收方是否仍将发送方列为好友，否则返回 `1303 NotPeersFriend`。
删除好友会清除双方关系缓存，重新添加好友后即可恢复；历史记录保留，群消息仍按群权限判断。

`friend-verification.compose.yml` 使用原生环境变量覆盖该配置，无需修改服务端镜像。
部署时也可以将 `IMENV_OPENIM_RPC_MSG_FRIENDVERIFY: "true"` 写入已有 Compose 的
`openim-server.environment`，保留其他环境变量、挂载和镜像，然后仅重建该服务。

```sh
docker compose -f <现有compose文件> -f <本仓库>/server-patches/friend-verification.compose.yml up -d --no-deps openim-server
```

经用户确认后运行独立双账号回归；它会创建账号和保留测试消息，不使用已有用户。
`TEST_FIXTURES` 指向权限 0600 的临时凭据文件，复用时应保密且不要提交。
本地验证码仅适用于关闭真实邮件验证的开发环境；线上通过私有 `TEST_CODE_READER` 获取验证码，禁止使用开发万能码。

```sh
cd 99chat
TEST_FIXTURES=/tmp/99chat-friend-local.json node friend_delete_e2e.cjs
# 线上显式设置 E2E_BASE、E2E_CHAT_API、E2E_IM_API、E2E_WS、TEST_CODE_READER 和 TEST_FIXTURES。
```

测试先成功发送以预热校验缓存，再删除好友，断言原生 SDK 发送返回 1303；
重新添加后确认成功送达，并重新登录接收账号检查被拒绝消息没有进入历史记录。

## 新浏览器恢复本人群历史

`message-history.patch` 修复原生 GetLastMessage：按调用用户的 `del_list` 过滤消息，
从最新含有本人可见消息的文档中选择最大 seq。本人删除最近消息后，SDK 首次同步
能取得更早的有效消息初始化会话；其他成员仍取得自己的最新消息，不会恢复本人已删记录。
沿用 v3.8.3-patch.15、原生删除标记和协议，仅增加替换 `openim-rpc-msg`，无数据库迁移。

MongoDB 集成测试覆盖跨文档连续删除、其他用户保持最新消息、全部删除后无结果。
将 `message_history_mongo_test.go` 复制到同版本源码的 `pkg/common/storage/database/mgo/`，
应用补丁后，用独立测试 MongoDB 执行（不要指向生产数据库）：

```sh
OPENIM_TEST_MONGO_URI=mongodb://127.0.0.1:<测试端口> go test ./pkg/common/storage/database/mgo -run '^TestLatestVisibleMessage$' -count=1 -v
```

网页同时将同步结束标记交给原生 `OnSyncServerFinish`，不会在登录返回时提前加载空历史。
浏览器回归复用已经授权的独立账号和群：

```sh
cd 99chat
E2E_BASE=https://<部署域名> TEST_FIXTURES=<私有账号文件> TEST_GROUP_FIXTURE=<私有测试群文件> node group_history_e2e.cjs
```
