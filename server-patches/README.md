# OpenIM 群权限补丁

基于 `openim/openim-server:v3.8.3-patch.15`，仅替换 `openim-rpc-group`，沿用原镜像启动方式、配置和其他服务。
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
