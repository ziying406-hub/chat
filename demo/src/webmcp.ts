import { useAppStore } from "./store/app-store";
import { getIMSDK } from "./services/openim";

/**
 * Register WebMCP tools so AI agents (like the ChatGPT browser extension)
 * can directly call 99chat functions without UI clicking.
 *
 * Usage: call registerWebMCP() once after the app has loaded and the user is logged in.
 */
export async function registerWebMCP() {
  const mc = (navigator as any).modelContext || (navigator as any).modelContextTesting;
  if (!mc) {
    console.warn("[WebMCP] navigator.modelContext not available. Enable chrome://flags/#enable-webmcp-testing and restart Chrome.");
    return;
  }
  if (!mc) {
    console.warn("[WebMCP] navigator.modelContext not available. Enable chrome://flags/#enable-webmcp-testing and restart Chrome.");
    return;
  }

  // 1. Get conversation list
  await mc.registerTool({
    name: "get_conversations",
    description: "获取当前用户的会话列表，包括单聊和群聊。返回会话ID、名称、最后消息、未读数等信息。",
    inputSchema: { type: "object", properties: {}, required: [] },
    execute: async () => {
      const convs = useAppStore.getState().conversations;
      const result = convs.map((c: any) => ({
        conversationID: c.conversationID,
        name: c.showName,
        type: c.conversationType === 1 ? "single" : "group",
        userID: c.userID || "",
        groupID: c.groupID || "",
        unreadCount: c.unreadCount || 0,
        lastMsg: c.latestMsg?.slice(0, 100) || "",
      }));
      return JSON.stringify(result);
    },
  });

  // 2. Send text message
  await mc.registerTool({
    name: "send_message",
    description: "向指定会话发送文本消息。需要提供会话ID (conversationID) 和消息内容 (text)。",
    inputSchema: {
      type: "object",
      properties: {
        conversationID: { type: "string", description: "会话ID，可从 get_conversations 获取" },
        text: { type: "string", description: "要发送的文本内容" },
      },
      required: ["conversationID", "text"],
    },
    execute: async ({ conversationID, text }: { conversationID: string; text: string }) => {
      await useAppStore.getState().sendTextMessage(conversationID, text);
      return `消息已发送: "${text}"`;
    },
  });

  // 3. Get conversation messages
  await mc.registerTool({
    name: "get_messages",
    description: "获取指定会话的消息历史记录。返回消息列表，包括发送者、内容、类型和时间。",
    inputSchema: {
      type: "object",
      properties: {
        conversationID: { type: "string", description: "会话ID" },
      },
      required: ["conversationID"],
    },
    execute: async ({ conversationID }: { conversationID: string }) => {
      const store = useAppStore.getState();
      await store.loadMessages(conversationID);
      const msgs = store.messagesMap[conversationID] || [];
      const result = msgs.map((m: any) => ({
        msgID: m.clientMsgID,
        sendID: m.sendID,
        content: m.textElem?.content || (m.contentType === 102 ? "[图片]" : m.contentType === 103 ? "[语音]" : ""),
        type: m.contentType,
        time: new Date(m.sendTime || m.createTime || 0).toLocaleString(),
        isSelf: m.sendID === store.currentUser?.userID,
      }));
      return JSON.stringify(result);
    },
  });

  // 4. Get current user info
  await mc.registerTool({
    name: "get_user_info",
    description: "获取当前登录用户的个人信息，包括昵称、用户ID、头像等。",
    inputSchema: { type: "object", properties: {}, required: [] },
    execute: async () => {
      const user = useAppStore.getState().currentUser;
      if (!user) return "用户未登录";
      return JSON.stringify({ userID: user.userID, nickname: user.nickname, faceURL: user.faceURL });
    },
  });

  // 5. Get friend list
  await mc.registerTool({
    name: "get_friends",
    description: "获取当前用户的好友列表。",
    inputSchema: { type: "object", properties: {}, required: [] },
    execute: async () => {
      const friends = useAppStore.getState().friends;
      const result = friends.map((f: any) => ({
        userID: f.userID,
        nickname: f.nickname,
        remark: f.remark || "",
      }));
      return JSON.stringify(result);
    },
  });

  // 6. Get group list
  await mc.registerTool({
    name: "get_groups",
    description: "获取当前用户已加入的群组列表。",
    inputSchema: { type: "object", properties: {}, required: [] },
    execute: async () => {
      const groups = useAppStore.getState().groups;
      const result = groups.map((g: any) => ({
        groupID: g.groupID,
        groupName: g.groupName,
        memberCount: g.memberCount,
        announcement: g.notification || "",
      }));
      return JSON.stringify(result);
    },
  });

  // 7. Create group
  await mc.registerTool({
    name: "create_group",
    description: "创建群组。需要群名称和成员用户ID列表。",
    inputSchema: {
      type: "object",
      properties: {
        groupName: { type: "string", description: "群组名称" },
        memberUserIDs: { type: "array", items: { type: "string" }, description: "成员用户ID列表" },
      },
      required: ["groupName", "memberUserIDs"],
    },
    execute: async ({ groupName, memberUserIDs }: { groupName: string; memberUserIDs: string[] }) => {
      await useAppStore.getState().createGroup(groupName, memberUserIDs);
      return `群组 "${groupName}" 创建成功`;
    },
  });

  // 8. Add friend
  await mc.registerTool({
    name: "add_friend",
    description: "发送好友申请。需要对方用户ID和申请消息。",
    inputSchema: {
      type: "object",
      properties: {
        userID: { type: "string", description: "对方用户ID" },
        reqMsg: { type: "string", description: "好友申请消息" },
      },
      required: ["userID"],
    },
    execute: async ({ userID, reqMsg }: { userID: string; reqMsg: string }) => {
      await useAppStore.getState().addFriend(userID, reqMsg || "请求添加好友");
      return `已向用户 ${userID} 发送好友申请`;
    },
  });

  // 9. Get friend requests
  await mc.registerTool({
    name: "get_friend_requests",
    description: "获取待处理的好友申请列表。",
    inputSchema: { type: "object", properties: {}, required: [] },
    execute: async () => {
      const reqs = useAppStore.getState().friendRequests;
      const result = reqs.map((r: any) => ({
        fromUserID: r.fromUserID,
        fromNickname: r.fromNickname,
        reqMsg: r.reqMsg,
        handleStatus: r.handleStatus,
      }));
      return JSON.stringify(result);
    },
  });

  // 10. Accept friend request
  await mc.registerTool({
    name: "accept_friend_request",
    description: "接受好友申请。需要对方用户ID。",
    inputSchema: {
      type: "object",
      properties: {
        userID: { type: "string", description: "申请方的用户ID" },
      },
      required: ["userID"],
    },
    execute: async ({ userID }: { userID: string }) => {
      await useAppStore.getState().acceptFriendRequest(userID);
      return `已接受用户 ${userID} 的好友申请`;
    },
  });

  console.log("[WebMCP] 10 tools registered: get_conversations, send_message, get_messages, get_user_info, get_friends, get_groups, create_group, add_friend, get_friend_requests, accept_friend_request");
}
