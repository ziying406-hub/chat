import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  getIMSDK,
  sdkLogin,
  sdkLogout,
  sendVerifyCode,
  registerUser,
  loginUser,
  on,
  CbEvents,
  type ConversationItem,
  type MessageItem,
  type FriendUserItem,
  type GroupItem,
  type GroupMemberItem,
  type FriendApplicationItem,
  type SelfUserInfo,
} from "../services/openim";
import { SessionType, MessageType, GroupMemberRole } from "@openim/wasm-client-sdk";

interface AuthData {
  imToken: string;
  chatToken: string;
  userID: string;
}

interface AppState {
  isAuthed: boolean;
  isLoggingIn: boolean;
  authError: string | null;
  currentUser: SelfUserInfo | null;
  authData: AuthData | null;

  conversations: ConversationItem[];
  activeConversationID: string | null;
  messagesMap: Record<string, MessageItem[]>;
  friends: FriendUserItem[];
  groups: GroupItem[];
  groupMembersMap: Record<string, GroupMemberItem[]>;
  friendRequests: FriendApplicationItem[];
  totalUnread: number;

  // Auth actions
  sendCode: (phone: string, areaCode?: string) => Promise<void>;
  register: (params: { phoneNumber: string; verifyCode: string; nickname: string; password: string; areaCode?: string }) => Promise<void>;
  login: (params: { phoneNumber: string; password: string; areaCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setAuthError: (err: string | null) => void;

  // Data actions
  loadAllData: () => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  loadMessages: (conversationID: string) => Promise<void>;
  sendTextMessage: (conversationID: string, text: string) => Promise<void>;
  markRead: (conversationID: string) => Promise<void>;
  pinConversation: (conversationID: string, isPinned: boolean) => Promise<void>;
  muteConversation: (conversationID: string, opt: number) => Promise<void>;
  deleteConversation: (conversationID: string) => Promise<void>;
  revokeMessage: (conversationID: string, clientMsgID: string) => Promise<void>;

  // Friends
  addFriend: (userID: string, reqMsg: string) => Promise<void>;
  acceptFriendRequest: (userID: string) => Promise<void>;
  rejectFriendRequest: (userID: string) => Promise<void>;
  deleteFriend: (userID: string) => Promise<void>;

  // Groups
  createGroup: (name: string, memberUserIDs: string[]) => Promise<void>;
  loadGroupMembers: (groupID: string) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    isAuthed: false,
    isLoggingIn: false,
    authError: null,
    currentUser: null,
    authData: null,
    conversations: [],
    activeConversationID: null,
    messagesMap: {},
    friends: [],
    groups: [],
    groupMembersMap: {},
    friendRequests: [],
    totalUnread: 0,

    sendCode: async (phone, areaCode = "+86") => {
      try {
        set((s) => { s.authError = null; });
        await sendVerifyCode(phone, areaCode);
      } catch (e: any) {
        set((s) => { s.authError = e.message; });
        throw e;
      }
    },

    register: async (params) => {
      try {
        set((s) => { s.isLoggingIn = true; s.authError = null; });
        const data = await registerUser(params);
        await sdkLogin(data.userID, data.imToken);
        set((s) => { s.authData = data; });
        await get().loadAllData();
        set((s) => { s.isAuthed = true; s.isLoggingIn = false; });
      } catch (e: any) {
        set((s) => { s.authError = e.message; s.isLoggingIn = false; });
        throw e;
      }
    },

    login: async (params) => {
      try {
        set((s) => { s.isLoggingIn = true; s.authError = null; });
        const data = await loginUser(params);
        await sdkLogin(data.userID, data.imToken);
        set((s) => { s.authData = data; });
        await get().loadAllData();
        set((s) => { s.isAuthed = true; s.isLoggingIn = false; });
      } catch (e: any) {
        set((s) => { s.authError = e.message; s.isLoggingIn = false; });
        throw e;
      }
    },

    logout: async () => {
      try { await sdkLogout(); } catch {}
      set((s) => {
        s.isAuthed = false;
        s.authData = null;
        s.currentUser = null;
        s.conversations = [];
        s.messagesMap = {};
        s.friends = [];
        s.groups = [];
        s.groupMembersMap = {};
        s.friendRequests = [];
        s.activeConversationID = null;
      });
    },

    setAuthError: (err) => set((s) => { s.authError = err; }),

    loadAllData: async () => {
      const im = getIMSDK();
      try {
        const selfInfo = await im.getSelfUserInfo();
        set((s) => { s.currentUser = selfInfo.data; });
      } catch {}

      try {
        const convRes = await im.getAllConversationList();
        const conversations = convRes.data || [];
        set((s) => {
          s.conversations = conversations;
          s.totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        });
      } catch {}

      try {
        const friendRes = await im.getFriendList();
        set((s) => { s.friends = friendRes.data || []; });
      } catch {}

      try {
        const groupRes = await im.getJoinedGroupList();
        set((s) => { s.groups = groupRes.data || []; });
      } catch {}

      try {
        const reqRes = await im.getFriendApplicationListAsRecipient();
        set((s) => { s.friendRequests = reqRes.data || []; });
      } catch {}

      // Register event listeners
      const unsubscribers = [
        on(CbEvents.OnConversationChanged, (convs: ConversationItem[]) => {
          set((s) => {
            for (const conv of convs) {
              const idx = s.conversations.findIndex((c) => c.conversationID === conv.conversationID);
              if (idx >= 0) s.conversations[idx] = conv;
              else s.conversations.push(conv);
            }
          });
        }),
        on(CbEvents.OnNewConversation, (convs: ConversationItem[]) => {
          set((s) => {
            for (const conv of convs) {
              if (!s.conversations.find((c) => c.conversationID === conv.conversationID)) {
                s.conversations.push(conv);
              }
            }
          });
        }),
        on(CbEvents.OnRecvNewMessage, (msg: MessageItem) => {
          set((s) => {
            const cid = msg.conversationID;
            if (!s.messagesMap[cid]) s.messagesMap[cid] = [];
            if (!s.messagesMap[cid].find((m) => m.clientMsgID === msg.clientMsgID)) {
              s.messagesMap[cid].push(msg);
            }
            // Update unread
            const conv = s.conversations.find((c) => c.conversationID === cid);
            if (conv && cid !== s.activeConversationID) conv.unreadCount++;
          });
        }),
        on(CbEvents.OnTotalUnreadMessageCountChanged, (data: { totalUnreadCount: number }) => {
          set((s) => { s.totalUnread = data?.totalUnreadCount ?? 0; });
        }),
        on(CbEvents.OnFriendAdded, (friend: FriendUserItem) => {
          set((s) => { if (!s.friends.find((f) => f.userID === friend.userID)) s.friends.push(friend); });
        }),
        on(CbEvents.OnFriendApplicationAccepted, () => {
          // Reload friend requests
          im.getFriendApplicationListAsRecipient().then((res) => {
            set((s) => { s.friendRequests = res.data || []; });
          });
        }),
        on(CbEvents.OnSyncServerFinish, () => {
          get().loadAllData();
        }),
      ];
      // Store unsubscribers on window for cleanup
      (window as any).__openimUnsubscribers = unsubscribers;
    },

    setActiveConversation: (id) => set((s) => {
      s.activeConversationID = id;
      if (id) {
        const conv = s.conversations.find((c) => c.conversationID === id);
        if (conv) conv.unreadCount = 0;
      }
    }),

    loadMessages: async (conversationID) => {
      const im = getIMSDK();
      try {
        const res = await im.getAdvancedHistoryMessageList({
          conversationID,
          startClientMsgID: "",
          count: 50,
          lastMinSeq: 0,
        });
        set((s) => {
          s.messagesMap[conversationID] = (res.data?.messageList || []).reverse();
        });
      } catch (e) {
        console.error("loadMessages error:", e);
      }
    },

    sendTextMessage: async (conversationID, text) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) return;

      const msgRes = await im.createTextMessage(text);
      const message = msgRes.data;
      if (!message) return;

      const params: any = {
        recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
        groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
        message,
      };

      // Optimistic add
      set((s) => {
        if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = [];
        s.messagesMap[conversationID].push(message);
      });

      try {
        const sendRes = await im.sendMessage(params);
        if (sendRes.data) {
          set((s) => {
            const msgs = s.messagesMap[conversationID];
            if (msgs) {
              const idx = msgs.findIndex((m) => m.clientMsgID === message.clientMsgID);
              if (idx >= 0) msgs[idx] = sendRes.data!;
            }
          });
        }
      } catch (e) {
        set((s) => {
          const msgs = s.messagesMap[conversationID];
          if (msgs) {
            const idx = msgs.findIndex((m) => m.clientMsgID === message.clientMsgID);
            if (idx >= 0) (msgs[idx] as any).status = 3; // Failed
          }
        });
      }
    },

    markRead: async (conversationID) => {
      const im = getIMSDK();
      try {
        await im.markConversationMessageAsRead(conversationID);
        set((s) => {
          const conv = s.conversations.find((c) => c.conversationID === conversationID);
          if (conv) conv.unreadCount = 0;
        });
      } catch (e) {
        console.error("markRead error:", e);
      }
    },

    pinConversation: async (conversationID, isPinned) => {
      const im = getIMSDK();
      try {
        await im.setConversation({
          conversationID,
          isPinned,
        });
      } catch (e) {
        console.error("pin error:", e);
      }
    },

    muteConversation: async (conversationID, opt) => {
      const im = getIMSDK();
      try {
        await im.setConversation({
          conversationID,
          recvMsgOpt: opt,
        });
      } catch (e) {
        console.error("mute error:", e);
      }
    },

    deleteConversation: async (conversationID) => {
      const im = getIMSDK();
      try {
        await im.deleteConversationAndDeleteAllMsg(conversationID);
        set((s) => {
          s.conversations = s.conversations.filter((c) => c.conversationID !== conversationID);
          delete s.messagesMap[conversationID];
          if (s.activeConversationID === conversationID) s.activeConversationID = null;
        });
      } catch (e) {
        console.error("deleteConversation error:", e);
      }
    },

    revokeMessage: async (conversationID, clientMsgID) => {
      const im = getIMSDK();
      try {
        await im.revokeMessage({ conversationID, clientMsgID });
        set((s) => {
          const msgs = s.messagesMap[conversationID];
          if (msgs) {
            const idx = msgs.findIndex((m) => m.clientMsgID === clientMsgID);
            if (idx >= 0) {
              (msgs[idx] as any).contentType = MessageType.NotificationMessage;
            }
          }
        });
      } catch (e) {
        console.error("revoke error:", e);
      }
    },

    addFriend: async (userID, reqMsg) => {
      const im = getIMSDK();
      await im.addFriend({ toUserID: userID, reqMsg });
    },

    acceptFriendRequest: async (userID) => {
      const im = getIMSDK();
      await im.acceptFriendApplication({ toUserID: userID, handleMsg: "同意" });
      const res = await im.getFriendApplicationListAsRecipient();
      set((s) => { s.friendRequests = res.data || []; });
      const frRes = await im.getFriendList();
      set((s) => { s.friends = frRes.data || []; });
    },

    rejectFriendRequest: async (userID) => {
      const im = getIMSDK();
      await im.refuseFriendApplication({ toUserID: userID, handleMsg: "拒绝" });
      const res = await im.getFriendApplicationListAsRecipient();
      set((s) => { s.friendRequests = res.data || []; });
    },

    deleteFriend: async (userID) => {
      const im = getIMSDK();
      await im.deleteFriend(userID);
      set((s) => { s.friends = s.friends.filter((f) => f.userID !== userID); });
    },

    createGroup: async (name, memberUserIDs) => {
      const im = getIMSDK();
      const res = await im.createGroup({
        memberUserIDs,
        groupInfo: { groupName: name },
      });
      if (res.data) {
        const groupRes = await im.getJoinedGroupList();
        set((s) => { s.groups = groupRes.data || []; });
      }
      return res.data;
    },

    loadGroupMembers: async (groupID) => {
      const im = getIMSDK();
      try {
        const res = await im.getGroupMemberList({ groupID, pagination: { pageNumber: 1, showNumber: 100 } });
        set((s) => { s.groupMembersMap[groupID] = res.data || []; });
      } catch (e) {
        console.error("loadGroupMembers error:", e);
      }
    },
  }))
);
