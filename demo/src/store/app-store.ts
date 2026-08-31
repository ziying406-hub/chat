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
import { SessionType, MessageType } from "@openim/wasm-client-sdk";

interface TagItem {
  tagID: string;
  name: string;
  memberIDs: string[];
}

interface AuthData {
  imToken: string;
  chatToken: string;
  userID: string;
}


function saveAccountToLocal(authData: AuthData, nickname: string, faceURL: string, phoneNumber: string) {
  try {
    const raw = localStorage.getItem("99chat_accounts");
    const accounts = raw ? JSON.parse(raw) : [];
    const filtered = accounts.filter((a: any) => a.userID !== authData.userID);
    filtered.unshift({ userID: authData.userID, imToken: authData.imToken, nickname, faceURL, phoneNumber });
    localStorage.setItem("99chat_accounts", JSON.stringify(filtered));
  } catch {}
}

interface AppState {
  isAuthed: boolean;
  isLoggingIn: boolean;
  authError: string | null;
  currentUser: SelfUserInfo | null;
  authData: AuthData | null;

  conversations: ConversationItem[];
  activeConversationID: string | null;
  activeConversationType: SessionType | null;
  messagesMap: Record<string, MessageItem[]>;
  friends: FriendUserItem[];
  groups: GroupItem[];
  groupMembersMap: Record<string, GroupMemberItem[]>;
  friendRequests: FriendApplicationItem[];
  groupRequests: any[];
  blackList: any[];
  totalUnread: number;
  darkMode: boolean;
  onlineStatus: Record<string, boolean>;
  tags: TagItem[];

  // Auth
  sendCode: (phone: string, areaCode?: string) => Promise<void>;
  register: (params: { phoneNumber: string; verifyCode: string; nickname: string; password: string; areaCode?: string }) => Promise<void>;
  login: (params: { phoneNumber: string; password: string; areaCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setAuthError: (err: string | null) => void;

  // Data
  loadAllData: () => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  loadMessages: (conversationID: string) => Promise<void>;
  sendTextMessage: (conversationID: string, text: string) => Promise<void>;
  sendImageMessage: (conversationID: string, file: File) => Promise<void>;
  sendSoundMessage: (conversationID: string, file: File, duration: number) => Promise<void>;
  sendFileMessage: (conversationID: string, file: File) => Promise<void>;
  sendVideoMessage: (conversationID: string, file: File, duration: number) => Promise<void>;
  forwardMessage: (conversationID: string, message: any) => Promise<void>;
  markRead: (conversationID: string) => Promise<void>;
  pinConversation: (conversationID: string, isPinned: boolean) => Promise<void>;
  muteConversation: (conversationID: string, opt: number) => Promise<void>;
  deleteConversation: (conversationID: string) => Promise<void>;
  revokeMessage: (conversationID: string, clientMsgID: string) => Promise<void>;
  sendQuoteMessage: (conversationID: string, text: string, quoteMessage: string) => Promise<void>;
  sendAtMessage: (conversationID: string, text: string, atUserIDList: string[]) => Promise<void>;
  sendEmoticonMessage: (conversationID: string, emoji: string) => Promise<void>;
  searchLocalMessages: (conversationID: string, keywordList: string[]) => Promise<any[]>;
  sendContactCard: (conversationID: string, userID: string, nickname: string, faceURL: string) => Promise<void>;

  // Friends
  addFriend: (userID: string, reqMsg: string) => Promise<void>;
  acceptFriendRequest: (userID: string) => Promise<void>;
  rejectFriendRequest: (userID: string) => Promise<void>;
  deleteFriend: (userID: string) => Promise<void>;
  setFriendRemark: (userID: string, remark: string) => Promise<void>;
  loadBlackList: () => Promise<void>;
  addBlack: (userID: string) => Promise<void>;
  removeBlack: (userID: string) => Promise<void>;

  // Online Status
  loadOnlineStatus: (userIDs: string[]) => Promise<void>;

  // Tags
  loadTags: () => void;
  createTag: (name: string, memberIDs: string[]) => void;
  updateTag: (tagID: string, name: string, memberIDs: string[]) => void;
  deleteTag: (tagID: string) => void;

  // Groups
  createGroup: (name: string, memberUserIDs: string[]) => Promise<void>;
  loadGroupMembers: (groupID: string) => Promise<void>;
  setGroupInfo: (groupID: string, info: Partial<GroupItem>) => Promise<void>;
  inviteToGroup: (groupID: string, userIDs: string[], reason: string) => Promise<void>;
  kickFromGroup: (groupID: string, userIDs: string[], reason: string) => Promise<void>;
  muteGroupMember: (groupID: string, userID: string, seconds: number) => Promise<void>;
  dismissGroup: (groupID: string) => Promise<void>;
  transferGroupOwner: (groupID: string, newOwnerUserID: string) => Promise<void>;
  loadGroupApplications: () => Promise<void>;
  acceptGroupApplication: (groupID: string, fromUserID: string) => Promise<void>;
  refuseGroupApplication: (groupID: string, fromUserID: string) => Promise<void>;

  // Profile
  updateSelfInfo: (info: { nickname?: string; faceURL?: string; ex?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;
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
    activeConversationType: null,
    messagesMap: {},
    friends: [],
    groups: [],
    groupMembersMap: {},
    friendRequests: [],
    groupRequests: [],
    totalUnread: 0,
    blackList: [],
    darkMode: false,
    onlineStatus: {},
    tags: [],

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
        const cu = get().currentUser;
        if (cu) saveAccountToLocal(data, cu.nickname || "", cu.faceURL || "", params.phoneNumber);
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
        const cu = get().currentUser;
        if (cu) saveAccountToLocal(data, cu.nickname || "", cu.faceURL || "", params.phoneNumber);
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
        s.groupRequests = [];
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

      try {
        const groupReqRes = await im.getGroupApplicationListAsRecipient();
        set((s) => { s.groupRequests = groupReqRes.data || []; });
      } catch {}

      try {
        const blackRes = await im.getBlackList();
        set((s) => { s.blackList = blackRes.data || []; });
      } catch {}

      on(CbEvents.OnConversationChanged, (convs: ConversationItem[]) => {
        set((s) => {
          for (const conv of convs) {
            const idx = s.conversations.findIndex((c) => c.conversationID === conv.conversationID);
            if (idx >= 0) s.conversations[idx] = conv;
            else s.conversations.push(conv);
          }
        });
      });
      on(CbEvents.OnNewConversation, (convs: ConversationItem[]) => {
        set((s) => {
          for (const conv of convs) {
            if (!s.conversations.find((c) => c.conversationID === conv.conversationID)) {
              s.conversations.push(conv);
            }
          }
        });
      });
      on(CbEvents.OnRecvNewMessage, (msg: MessageItem) => {
        set((s) => {
          const cid = (msg as any).conversationID;
          if (!s.messagesMap[cid]) s.messagesMap[cid] = [];
          if (!s.messagesMap[cid].find((m) => m.clientMsgID === msg.clientMsgID)) {
            s.messagesMap[cid].push(msg);
          }
          const conv = s.conversations.find((c) => c.conversationID === cid);
          if (conv && cid !== s.activeConversationID) conv.unreadCount++;
        });
      });
      on(CbEvents.OnTotalUnreadMessageCountChanged, (data: any) => {
        set((s) => { s.totalUnread = data?.totalUnreadCount ?? 0; });
      });
      on(CbEvents.OnFriendAdded, (friend: FriendUserItem) => {
        set((s) => { if (!s.friends.find((f) => f.userID === friend.userID)) s.friends.push(friend); });
      });
      on(CbEvents.OnFriendApplicationAccepted, () => {
        im.getFriendApplicationListAsRecipient().then((res) => { set((s) => { s.friendRequests = res.data || []; }); });
        im.getFriendList().then((res) => { set((s) => { s.friends = res.data || []; }); });
      });
      on(CbEvents.OnSyncServerFinish, () => { get().loadAllData(); });
      on(CbEvents.OnUserStatusChanged, (data: any) => {
        const arr = Array.isArray(data) ? data : [data];
        set((s) => {
          for (const item of arr) {
            if (item?.userID) s.onlineStatus[item.userID] = item.status === 1;
          }
        });
      });
    },

    setActiveConversation: (id) => set((s) => {
      s.activeConversationID = id;
      if (id) {
        const conv = s.conversations.find((c) => c.conversationID === id);
        if (conv) {
          conv.unreadCount = 0;
          s.activeConversationType = conv.conversationType;
        }
      }
    }),

    loadMessages: async (conversationID) => {
      const im = getIMSDK();
      try {
        const res = await im.getAdvancedHistoryMessageList({ conversationID, startClientMsgID: "", count: 50, lastMinSeq: 0 });
        set((s) => { s.messagesMap[conversationID] = (res.data?.messageList || []).reverse(); });
      } catch (e) { console.error("loadMessages:", e); }
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
      set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
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
            if (idx >= 0) (msgs[idx] as any).status = 3;
          }
        });
      }
    },

    sendImageMessage: async (conversationID, file) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) return;
      try {
        const msgRes = await im.createImageMessageByFile({
          sourcePath: URL.createObjectURL(file),
          sourcePicture: { uuid: "", type: file.type, size: file.size, width: 0, height: 0, url: "" },
          bigPicture: { uuid: "", type: file.type, size: file.size, width: 0, height: 0, url: "" },
          snapshotPicture: { uuid: "", type: file.type, size: file.size, width: 0, height: 0, url: "" },
          file,
        } as any);
        const message = msgRes.data;
        if (!message) return;
        set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
        const params: any = {
          recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
          groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
          message,
        };
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
      } catch (e) { console.error("sendImage:", e); }
    },

    sendSoundMessage: async (conversationID, file, duration) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) return;
      try {
        const msgRes = await im.createSoundMessageByFile({
          uuid: "",
          soundPath: URL.createObjectURL(file),
          sourceUrl: "",
          dataSize: file.size,
          duration,
          file,
        } as any);
        const message = msgRes.data;
        if (!message) return;
        set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
        const params: any = {
          recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
          groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
          message,
        };
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
      } catch (e) { console.error("sendSound:", e); }
    },


    sendFileMessage: async (conversationID, file) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) return;
      try {
        const msgRes = await im.createFileMessage(file.name, file.name);
        const message = msgRes.data;
        if (!message) return;
        set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
        const params: any = { recvID: conv.conversationType === SessionType.Single ? conv.userID : "", groupID: conv.conversationType === SessionType.Group ? conv.groupID : "", message };
        const sendRes = await im.sendMessage(params);
        if (sendRes.data) {
          set((s) => { const msgs = s.messagesMap[conversationID]; if (msgs) { const idx = msgs.findIndex((m) => m.clientMsgID === message.clientMsgID); if (idx >= 0) msgs[idx] = sendRes.data!; } });
        }
      } catch (e) { console.error("sendFile:", e); }
    },

    sendVideoMessage: async (conversationID, file, duration) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) return;
      try {
        const msgRes = await im.createVideoMessage(URL.createObjectURL(file), file.type, duration, "");
        const message = msgRes.data;
        if (!message) return;
        set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
        const params: any = { recvID: conv.conversationType === SessionType.Single ? conv.userID : "", groupID: conv.conversationType === SessionType.Group ? conv.groupID : "", message };
        const sendRes = await im.sendMessage(params);
        if (sendRes.data) {
          set((s) => { const msgs = s.messagesMap[conversationID]; if (msgs) { const idx = msgs.findIndex((m) => m.clientMsgID === message.clientMsgID); if (idx >= 0) msgs[idx] = sendRes.data!; } });
        }
      } catch (e) { console.error("sendVideo:", e); }
    },

    forwardMessage: async (conversationID, message) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) return;
      try {
        const params: any = { recvID: conv.conversationType === SessionType.Single ? conv.userID : "", groupID: conv.conversationType === SessionType.Group ? conv.groupID : "", message };
        const sendRes = await im.sendMessage(params);
        if (sendRes.data) {
          set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(sendRes.data!); });
        }
      } catch (e) { console.error("forward:", e); }
    },

    markRead: async (conversationID) => {
      const im = getIMSDK();
      try {
        await im.markConversationMessageAsRead(conversationID);
        set((s) => { const conv = s.conversations.find((c) => c.conversationID === conversationID); if (conv) conv.unreadCount = 0; });
      } catch (e) { console.error("markRead:", e); }
    },

    pinConversation: async (conversationID, isPinned) => {
      const im = getIMSDK();
      try { await im.setConversation({ conversationID, isPinned }); } catch (e) { console.error("pin:", e); }
    },

    muteConversation: async (conversationID, opt) => {
      const im = getIMSDK();
      try { await im.setConversation({ conversationID, recvMsgOpt: opt }); } catch (e) { console.error("mute:", e); }
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
      } catch (e) { console.error("deleteConv:", e); }
    },

    revokeMessage: async (conversationID, clientMsgID) => {
      const im = getIMSDK();
      try {
        await im.revokeMessage({ conversationID, clientMsgID });
        set((s) => {
          const msgs = s.messagesMap[conversationID];
          if (msgs) {
            const idx = msgs.findIndex((m) => m.clientMsgID === clientMsgID);
            if (idx >= 0) (msgs[idx] as any).contentType = MessageType.NotificationMessage;
          }
        });
      } catch (e) { console.error("revoke:", e); }
    },

    sendQuoteMessage: async (conversationID, text, quoteMessage) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) return;
      const msgRes = await im.createQuoteMessage({ text, message: quoteMessage });
      const message = msgRes.data;
      if (!message) return;
      const params: any = {
        recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
        groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
        message,
      };
      set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
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
            if (idx >= 0) (msgs[idx] as any).status = 3;
          }
        });
      }
    },

    sendAtMessage: async (conversationID, text, atUserIDList) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) return;
      const msgRes = await im.createTextAtMessage({ text, atUserIDList, message: undefined } as any);
      const message = msgRes.data;
      if (!message) return;
      const params: any = {
        recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
        groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
        message,
      };
      set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
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
            if (idx >= 0) (msgs[idx] as any).status = 3;
          }
        });
      }
    },

    sendEmoticonMessage: async (conversationID, emoji) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) return;
      try {
        const msgRes = await im.createCustomMessage({
          data: JSON.stringify({ emoji }),
          extension: "emoticon",
          description: "表情",
        });
        const message = msgRes.data;
        if (!message) return;
        const params: any = {
          recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
          groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
          message,
        };
        set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
        await im.sendMessage(params);
      } catch (e) { console.error("sendEmoticon:", e); }
    },

    searchLocalMessages: async (conversationID, keywordList) => {
      const im = getIMSDK();
      try {
        const res = await im.searchLocalMessages({ conversationID, keywordList, count: 20 } as any);
        const items = res.data?.searchResultItems || [];
        return items.flatMap((item: any) => item.messageList || []);
      } catch (e) {
        console.error("searchLocalMessages:", e);
        return [];
      }
    },

    sendContactCard: async (conversationID, userID, nickname, faceURL) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) return;
      const msgRes = await im.createCustomMessage({
        data: JSON.stringify({ userID, nickname, faceURL }),
        extension: "contactCard",
        description: "名片",
      });
      const message = msgRes.data;
      if (!message) return;
      const params: any = {
        recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
        groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
        message,
      };
      set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
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
            if (idx >= 0) (msgs[idx] as any).status = 3;
          }
        });
      }
    },

    addFriend: async (userID, reqMsg) => { const im = getIMSDK(); await im.addFriend({ toUserID: userID, reqMsg }); },
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
    setFriendRemark: async (userID, remark) => {
      const im = getIMSDK();
      await im.updateFriends({ friendUserIDs: [userID], remark });
      const frRes = await im.getFriendList();
      set((s) => { s.friends = frRes.data || []; });
    },
    loadBlackList: async () => {
      const im = getIMSDK();
      try {
        const res = await im.getBlackList();
        set((s) => { s.blackList = res.data || []; });
      } catch (e) { console.error("loadBlackList:", e); }
    },
    addBlack: async (userID) => {
      const im = getIMSDK();
      try {
        await im.addBlack({ toUserID: userID });
        const res = await im.getBlackList();
        set((s) => { s.blackList = res.data || []; });
      } catch (e) { console.error("addBlack:", e); }
    },
    removeBlack: async (userID) => {
      const im = getIMSDK();
      try {
        await im.removeBlack(userID);
        const res = await im.getBlackList();
        set((s) => { s.blackList = res.data || []; });
      } catch (e) { console.error("removeBlack:", e); }
    },

    createGroup: async (name, memberUserIDs) => {
      const im = getIMSDK();
      const res = await im.createGroup({ memberUserIDs, groupInfo: { groupName: name } });
      if (res.data) {
        const groupRes = await im.getJoinedGroupList();
        set((s) => { s.groups = groupRes.data || []; });
      }
    },

    loadGroupMembers: async (groupID) => {
      const im = getIMSDK();
      try {
        const res = await im.getGroupMemberList({ groupID, offset: 0, count: 1000 } as any);
        set((s) => { s.groupMembersMap[groupID] = res.data || []; });
      } catch (e) { console.error("loadGroupMembers:", e); }
    },

    setGroupInfo: async (groupID, info) => {
      const im = getIMSDK();
      try {
        await im.setGroupInfo({ groupID, ...info } as any);
        const groupRes = await im.getJoinedGroupList();
        set((s) => { s.groups = groupRes.data || []; });
      } catch (e) { console.error("setGroupInfo:", e); }
    },

    inviteToGroup: async (groupID, userIDs, reason) => {
      const im = getIMSDK();
      try { await im.inviteUserToGroup({ groupID, userIDList: userIDs, reason } as any); } catch (e) { console.error("inviteToGroup:", e); }
    },

    kickFromGroup: async (groupID, userIDs, reason) => {
      const im = getIMSDK();
      try { await im.kickGroupMember({ groupID, userIDList: userIDs, reason } as any); } catch (e) { console.error("kickFromGroup:", e); }
    },

    muteGroupMember: async (groupID, userID, seconds) => {
      const im = getIMSDK();
      try { await im.changeGroupMemberMute({ groupID, userID, mutedSeconds: seconds }); } catch (e) { console.error("muteGroupMember:", e); }
    },

    dismissGroup: async (groupID) => {
      const im = getIMSDK();
      try {
        await im.dismissGroup(groupID);
        set((s) => { s.groups = s.groups.filter((g) => g.groupID !== groupID); });
      } catch (e) { console.error("dismissGroup:", e); }
    },

    transferGroupOwner: async (groupID, newOwnerUserID) => {
      const im = getIMSDK();
      try { await im.transferGroupOwner({ groupID, newOwnerUserID } as any); } catch (e) { console.error("transferGroup:", e); }
    },

    loadGroupApplications: async () => {
      const im = getIMSDK();
      try {
        const res = await im.getGroupApplicationListAsRecipient();
        set((s) => { s.groupRequests = res.data || []; });
      } catch (e) { console.error("loadGroupApps:", e); }
    },

    acceptGroupApplication: async (groupID, fromUserID) => {
      const im = getIMSDK();
      try {
        await im.acceptGroupApplication({ groupID, fromUserID, handleMsg: "同意" } as any);
        await get().loadGroupApplications();
      } catch (e) { console.error("acceptGroupApp:", e); }
    },

    refuseGroupApplication: async (groupID, fromUserID) => {
      const im = getIMSDK();
      try {
        await im.refuseGroupApplication({ groupID, fromUserID, handleMsg: "拒绝" } as any);
        await get().loadGroupApplications();
      } catch (e) { console.error("refuseGroupApp:", e); }
    },

    loadOnlineStatus: async (userIDs) => {
      const im = getIMSDK();
      if (userIDs.length === 0) return;
      try {
        await im.subscribeUsersStatus(userIDs);
        const res = await im.getSubscribeUsersStatus();
        const list = res.data || [];
        set((s) => {
          for (const item of list) {
            if (item.userID) s.onlineStatus[item.userID] = item.status === 1;
          }
        });
      } catch (e) { console.error("loadOnlineStatus:", e); }
    },

    loadTags: () => {
      try {
        const raw = localStorage.getItem("99chat_tags");
        const tags = raw ? JSON.parse(raw) : [];
        set((s) => { s.tags = tags; });
      } catch { set((s) => { s.tags = []; }); }
    },

    createTag: (name, memberIDs) => {
      const tag: TagItem = { tagID: `tag_${Date.now()}`, name, memberIDs };
      set((s) => {
        s.tags.push(tag);
        localStorage.setItem("99chat_tags", JSON.stringify(s.tags));
      });
    },

    updateTag: (tagID, name, memberIDs) => {
      set((s) => {
        const tag = s.tags.find((t) => t.tagID === tagID);
        if (tag) {
          tag.name = name;
          tag.memberIDs = memberIDs;
          localStorage.setItem("99chat_tags", JSON.stringify(s.tags));
        }
      });
    },

    deleteTag: (tagID) => {
      set((s) => {
        s.tags = s.tags.filter((t) => t.tagID !== tagID);
        localStorage.setItem("99chat_tags", JSON.stringify(s.tags));
      });
    },

    updateSelfInfo: async (info) => {
      const im = getIMSDK();
      try {
        await im.setSelfInfo(info);
        const res = await im.getSelfUserInfo();
        set((s) => { s.currentUser = res.data; });
      } catch (e) { console.error("updateSelfInfo:", e); }
    },

    uploadAvatar: async (file) => {
      const im = getIMSDK();
      try {
        const uuid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const res = await im.uploadFile({ name: file.name, contentType: file.type, uuid, file } as any);
        return res.data?.url || null;
      } catch (e) {
        console.error("uploadAvatar:", e);
        return null;
      }
    },
    toggleDarkMode: () => set((s) => { s.darkMode = !s.darkMode; }),
    setDarkMode: (val) => set((s) => { s.darkMode = val; }),
  }))
);
