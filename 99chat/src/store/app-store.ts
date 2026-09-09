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
import { GroupMemberFilter, GroupStatus, SessionType, MessageType } from "@openim/wasm-client-sdk";
import { getUserStorageKey } from "../utils/storage";

let sdkListenersBound = false;

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

const SESSION_STORAGE_KEY = "99chat_session";

function saveSession(authData: AuthData) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authData));
}

function loadSession(): AuthData | null {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
    return session?.userID && session?.imToken && session?.chatToken ? session : null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
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
  isSessionRestoring: boolean;
  isInitialSyncing: boolean;
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
  drafts: Record<string, string>;

  // Auth
  sendCode: (phone: string, areaCode?: string) => Promise<void>;
  register: (params: { phoneNumber: string; verifyCode: string; nickname: string; password: string; areaCode?: string }) => Promise<void>;
  login: (params: { phoneNumber: string; password: string; areaCode?: string }) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthError: (err: string | null) => void;
  setInitialSyncing: (isSyncing: boolean) => void;

  // Data
  loadAllData: () => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  loadMessages: (conversationID: string) => Promise<void>;
  sendTextMessage: (conversationID: string, text: string) => Promise<void>;
  sendImageMessage: (conversationID: string, file: File) => Promise<void>;
  sendSoundMessage: (conversationID: string, file: File, duration: number) => Promise<void>;
  sendFileMessage: (conversationID: string, file: File) => Promise<void>;
  sendVideoMessage: (conversationID: string, file: File, duration: number) => Promise<void>;
  sendLocationMessage: (conversationID: string, latitude: number, longitude: number, description: string) => Promise<void>;
  forwardMessage: (conversationID: string, message: any) => Promise<void>;
  forwardMergedMessages: (conversationID: string, messageList: MessageItem[]) => Promise<void>;
  markRead: (conversationID: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  pinConversation: (conversationID: string, isPinned: boolean) => Promise<void>;
  muteConversation: (conversationID: string, opt: number) => Promise<void>;
  deleteConversation: (conversationID: string) => Promise<void>;
  deleteMessagesFromLocalStorage: (conversationID: string, clientMsgIDs: string[]) => Promise<void>;
  hideConversation: (conversationID: string) => Promise<void>;
  revokeMessage: (conversationID: string, clientMsgID: string) => Promise<void>;
  sendQuoteMessage: (conversationID: string, text: string, quoteMessage: string) => Promise<void>;
  sendAtMessage: (conversationID: string, text: string, atUserIDList: string[]) => Promise<void>;
  sendEmoticonMessage: (conversationID: string, emoji: string) => Promise<void>;
  searchLocalMessages: (conversationID: string, keywordList: string[]) => Promise<any[]>;
  sendContactCard: (conversationID: string, userID: string, nickname: string, faceURL: string) => Promise<void>;
  setDraft: (conversationID: string, text: string) => void;
  clearDraft: (conversationID: string) => void;
  markConversationUnread: (conversationID: string) => void;

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
  refreshGroups: () => Promise<void>;
  loadGroupMembers: (groupID: string) => Promise<void>;
  setGroupInfo: (groupID: string, info: Partial<GroupItem>) => Promise<void>;
  inviteToGroup: (groupID: string, userIDs: string[], reason: string) => Promise<void>;
  kickFromGroup: (groupID: string, userIDs: string[], reason: string) => Promise<void>;
  muteGroupMember: (groupID: string, userID: string, seconds: number) => Promise<void>;
  muteGroup: (groupID: string, isMute: boolean) => Promise<void>;
  dismissGroup: (groupID: string) => Promise<void>;
  transferGroupOwner: (groupID: string, newOwnerUserID: string) => Promise<void>;
  loadGroupApplications: () => Promise<void>;
  acceptGroupApplication: (groupID: string, fromUserID: string) => Promise<void>;
  refuseGroupApplication: (groupID: string, fromUserID: string) => Promise<void>;
  setGroupMemberNickname: (groupID: string, userID: string, nickname: string) => Promise<void>;
  setGroupMemberRole: (groupID: string, userID: string, roleLevel: number) => Promise<void>;

  // Profile
  updateSelfInfo: (info: { nickname?: string; faceURL?: string; ex?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;
}

export const useAppStore = create<AppState>()(
  immer((set, get) => {
    const bindSDKListeners = (im: ReturnType<typeof getIMSDK>) => {
      if (sdkListenersBound) return;
      sdkListenersBound = true;
      on(CbEvents.OnConversationChanged, (convs: ConversationItem[]) => {
        if (!convs || !Array.isArray(convs)) return;
        set((s) => {
          for (const conv of convs) {
            const idx = s.conversations.findIndex((c) => c.conversationID === conv.conversationID);
            if (idx >= 0) s.conversations[idx] = conv;
            else s.conversations.push(conv);
          }
        });
      });
      on(CbEvents.OnNewConversation, (convs: ConversationItem[]) => {
        if (!convs || !Array.isArray(convs)) return;
        set((s) => {
          for (const conv of convs) {
            if (!s.conversations.find((c) => c.conversationID === conv.conversationID)) {
              s.conversations.push(conv);
            }
          }
        });
      });
      const receiveMessages = (incoming: MessageItem | MessageItem[]) => {
        const messages = Array.isArray(incoming) ? incoming : [incoming];
        set((s) => {
          for (const msg of messages) {
            const peerUserID = msg.sendID === s.currentUser?.userID ? msg.recvID : msg.sendID;
            const cid = (msg as any).conversationID
              || s.conversations.find((conversation) => conversation.groupID === msg.groupID || conversation.userID === peerUserID)?.conversationID
              || (msg.groupID ? `sg_${msg.groupID}` : s.currentUser?.userID && peerUserID ? `si_${[s.currentUser.userID, peerUserID].sort().join("_")}` : "");
            if (!cid) continue;
            if (!s.messagesMap[cid]) s.messagesMap[cid] = [];
            if (s.messagesMap[cid].find((m) => m.clientMsgID === msg.clientMsgID)) continue;
            s.messagesMap[cid].push(msg);
            const conv = s.conversations.find((c) => c.conversationID === cid);
            if (conv && cid !== s.activeConversationID) conv.unreadCount++;
          }
        });
      };
      on(CbEvents.OnRecvNewMessage, receiveMessages);
      on(CbEvents.OnRecvNewMessages, receiveMessages);
      on(CbEvents.OnTotalUnreadMessageCountChanged, (data: any) => {
        set((s) => { s.totalUnread = data?.totalUnreadCount ?? 0; });
      });
      on(CbEvents.OnFriendAdded, (friend: FriendUserItem) => {
        set((s) => { if (!s.friends.find((f) => f.userID === friend.userID)) s.friends.push(friend); });
      });
      on(CbEvents.OnFriendInfoChanged, (friend: FriendUserItem) => {
        set((s) => {
          const index = s.friends.findIndex((item) => item.userID === friend.userID);
          if (index >= 0) s.friends[index] = { ...s.friends[index], ...friend };
        });
      });
      on(CbEvents.OnFriendDeleted, (friend: FriendUserItem) => {
        set((s) => { s.friends = s.friends.filter((item) => item.userID !== friend.userID); });
      });
      const refreshFriendApplications = () => {
        im.getFriendApplicationListAsRecipient({ handleResults: [], offset: 0, count: 100 }).then((res) => { set((s) => { s.friendRequests = res.data || []; }); });
      };
      on(CbEvents.OnFriendApplicationAdded, refreshFriendApplications);
      on(CbEvents.OnFriendApplicationAccepted, () => {
        refreshFriendApplications();
        im.getFriendList().then((res) => { set((s) => { s.friends = res.data || []; }); });
      });
      const refreshGroupApplications = () => {
        im.getGroupApplicationListAsRecipient({ groupIDs: [], handleResults: [0], offset: 0, count: 100 }).then((res) => { set((s) => { s.groupRequests = res.data || []; }); });
      };
      const refreshJoinedGroups = () => {
        im.getJoinedGroupList().then((res) => { set((s) => { s.groups = res.data || []; }); });
      };
      on(CbEvents.OnGroupApplicationAdded, refreshGroupApplications);
      on(CbEvents.OnGroupApplicationAccepted, () => {
        refreshJoinedGroups();
        refreshGroupApplications();
      });
      on(CbEvents.OnJoinedGroupAdded, refreshJoinedGroups);
      on(CbEvents.OnJoinedGroupDeleted, refreshJoinedGroups);
      on(CbEvents.OnGroupDismissed, refreshJoinedGroups);
      const refreshGroupMembers = (member: GroupMemberItem) => {
        if (!member?.groupID) return;
        im.getGroupMemberList({ groupID: member.groupID, filter: GroupMemberFilter.All, offset: 0, count: 1000 }).then((res) => {
          set((state) => { state.groupMembersMap[member.groupID] = res.data || []; });
        });
      };
      on(CbEvents.OnGroupMemberAdded, refreshGroupMembers);
      on(CbEvents.OnGroupMemberDeleted, refreshGroupMembers);
      on(CbEvents.OnGroupMemberInfoChanged, refreshGroupMembers);
      on(CbEvents.OnSyncServerFinish, () => {
        get().loadAllData().finally(() => set((state) => { state.isInitialSyncing = false; }));
      });
      on(CbEvents.OnSyncServerFailed, () => set((state) => { state.isInitialSyncing = false; }));
      on(CbEvents.OnUserStatusChanged, (data: any) => {
        const arr = Array.isArray(data) ? data : [data];
        set((s) => {
          for (const item of arr) {
            if (item?.userID) s.onlineStatus[item.userID] = item.status === 1;
          }
        });
      });
    };

    return {
    isAuthed: false,
    isLoggingIn: false,
    isSessionRestoring: true,
    isInitialSyncing: false,
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
    drafts: {},

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
        saveSession(data);
        bindSDKListeners(getIMSDK());
        set((s) => { s.authData = data; s.isInitialSyncing = true; });
        await sdkLogin(data.userID, data.imToken);
        await get().loadAllData();
        set((s) => { s.isAuthed = true; s.isLoggingIn = false; });
        const cu = get().currentUser;
        if (cu) saveAccountToLocal(data, cu.nickname || "", cu.faceURL || "", params.phoneNumber);
      } catch (e: any) {
        clearSession();
        set((s) => { s.authError = e.message; s.isLoggingIn = false; });
        throw e;
      }
    },

    login: async (params) => {
      try {
        set((s) => { s.isLoggingIn = true; s.authError = null; });
        const data = await loginUser(params);
        saveSession(data);
        bindSDKListeners(getIMSDK());
        set((s) => { s.authData = data; s.isInitialSyncing = true; });
        await sdkLogin(data.userID, data.imToken);
        await get().loadAllData();
        set((s) => { s.isAuthed = true; s.isLoggingIn = false; });
        const cu = get().currentUser;
        if (cu) saveAccountToLocal(data, cu.nickname || "", cu.faceURL || "", params.phoneNumber);
      } catch (e: any) {
        clearSession();
        set((s) => { s.authError = e.message; s.isLoggingIn = false; });
        throw e;
      }
    },

    logout: async () => {
      try { await sdkLogout(); } catch {}
      clearSession();
      set((s) => {
        s.isAuthed = false;
        s.isInitialSyncing = false;
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

    restoreSession: async () => {
      const data = loadSession();
      if (!data) {
        set((s) => { s.isSessionRestoring = false; });
        return;
      }
      try {
        bindSDKListeners(getIMSDK());
        set((s) => { s.authData = data; s.isInitialSyncing = true; });
        await sdkLogin(data.userID, data.imToken);
        await get().loadAllData();
        set((s) => { s.isAuthed = true; });
      } catch {
        clearSession();
        set((s) => { s.authData = null; s.currentUser = null; });
      } finally {
        set((s) => { s.isInitialSyncing = false; s.isSessionRestoring = false; });
      }
    },

    setAuthError: (err) => set((s) => { s.authError = err; }),
    setInitialSyncing: (isSyncing) => set((s) => { s.isInitialSyncing = isSyncing; }),

    loadAllData: async () => {
      const im = getIMSDK();
      bindSDKListeners(im);
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
        const reqRes = await im.getFriendApplicationListAsRecipient({ handleResults: [], offset: 0, count: 100 });
        set((s) => { s.friendRequests = reqRes.data || []; });
      } catch {}

      try {
        const groupReqRes = await im.getGroupApplicationListAsRecipient({ groupIDs: [], handleResults: [0], offset: 0, count: 100 });
        set((s) => { s.groupRequests = groupReqRes.data || []; });
      } catch {}

      try {
        const blackRes = await im.getBlackList();
        set((s) => { s.blackList = blackRes.data || []; });
      } catch {}

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
        const res = await im.getAdvancedHistoryMessageList({ conversationID, startClientMsgID: "", count: 50, viewType: 0 } as any);
        const history = (res.data?.messageList || []).reverse();
        set((s) => {
          const messages = new Map<string, MessageItem>();
          for (const message of history) messages.set(message.clientMsgID, message);
          for (const message of s.messagesMap[conversationID] || []) messages.set(message.clientMsgID, message);
          s.messagesMap[conversationID] = [...messages.values()].sort((a, b) => a.sendTime - b.sendTime);
        });
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
        if (sendRes.errCode !== 0 || !sendRes.data) throw new Error(sendRes.errMsg || "发送消息失败");
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
      if (!conv) throw new Error("会话不存在");
      const msgRes = await im.createFileMessageByFile({
        filePath: URL.createObjectURL(file),
        fileName: file.name,
        uuid: "",
        sourceUrl: "",
        fileSize: file.size,
        fileType: file.type,
        file,
      });
      if (msgRes.errCode !== 0 || !msgRes.data) throw new Error(msgRes.errMsg || "创建文件消息失败");
      const message = msgRes.data;
      set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
      try {
        const sendRes = await im.sendMessage({ recvID: conv.conversationType === SessionType.Single ? conv.userID : "", groupID: conv.conversationType === SessionType.Group ? conv.groupID : "", message });
        if (sendRes.errCode !== 0 || !sendRes.data) throw new Error(sendRes.errMsg || "发送文件失败");
        set((s) => {
          const messages = s.messagesMap[conversationID];
          const index = messages?.findIndex((item) => item.clientMsgID === message.clientMsgID) ?? -1;
          if (messages && index >= 0) messages[index] = sendRes.data!;
        });
      } catch (cause) {
        set((s) => {
          const messages = s.messagesMap[conversationID];
          const index = messages?.findIndex((item) => item.clientMsgID === message.clientMsgID) ?? -1;
          if (messages && index >= 0) (messages[index] as any).status = 3;
        });
        throw cause;
      }
    },

    sendVideoMessage: async (conversationID, file, duration) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) return;
      try {
        const snapshot = new File([
          Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL3VQAAAABJRU5ErkJggg=="), (char) => char.charCodeAt(0)),
        ], "video-snapshot.png", { type: "image/png" });
        const msgRes = await im.createVideoMessageByFile({
          videoPath: URL.createObjectURL(file),
          duration,
          videoType: file.type || "video/webm",
          snapshotPath: URL.createObjectURL(snapshot),
          videoUUID: "",
          videoUrl: "",
          videoSize: file.size,
          snapshotUUID: "",
          snapshotSize: snapshot.size,
          snapshotUrl: "",
          snapshotWidth: 1,
          snapshotHeight: 1,
          videoFile: file,
          snapshotFile: snapshot,
        });
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

    sendLocationMessage: async (conversationID, latitude, longitude, description) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) throw new Error("会话不存在");

      const created = await im.createLocationMessage({ latitude, longitude, description });
      if (!created.data) throw new Error("创建位置消息失败");

      set((s) => {
        if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = [];
        s.messagesMap[conversationID].push(created.data!);
      });

      try {
        const sent = await im.sendMessage({
          recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
          groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
          message: created.data,
        });
        if (sent.data) {
          set((s) => {
            const messages = s.messagesMap[conversationID];
            const index = messages?.findIndex((message) => message.clientMsgID === created.data!.clientMsgID) ?? -1;
            if (messages && index >= 0) messages[index] = sent.data!;
          });
        }
      } catch (cause) {
        set((s) => {
          const messages = s.messagesMap[conversationID];
          const index = messages?.findIndex((message) => message.clientMsgID === created.data!.clientMsgID) ?? -1;
          if (messages && index >= 0) (messages[index] as any).status = 3;
        });
        throw cause;
      }
    },

    forwardMessage: async (conversationID, message) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) throw new Error("会话不存在");
      const params: any = { recvID: conv.conversationType === SessionType.Single ? conv.userID : "", groupID: conv.conversationType === SessionType.Group ? conv.groupID : "", message };
      const sendRes = await im.sendMessage(params);
      if (sendRes.errCode !== 0 || !sendRes.data) throw new Error(sendRes.errMsg || "转发失败");
      set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(sendRes.data!); });
    },

    forwardMergedMessages: async (conversationID, messageList) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) throw new Error("会话不存在");
      if (messageList.length < 2) throw new Error("至少选择两条消息");

      const summaryList = messageList.slice(0, 4).map((message: any) => {
        if (message.textElem?.content) return message.textElem.content;
        if (message.pictureElem) return "[图片]";
        if (message.videoElem) return "[视频]";
        if (message.fileElem) return "[文件]";
        if (message.locationElem) return "[位置]";
        return "[消息]";
      });
      const title = `${state.currentUser?.nickname || "我"}的聊天记录`;
      const created = await im.createMergerMessage({ messageList, title, summaryList });
      if (!created.data) throw new Error("创建合并消息失败");

      const sent = await im.sendMessage({
        recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
        groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
        message: created.data,
      });
      if (!sent.data) throw new Error("合并转发失败");
      set((s) => {
        if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = [];
        s.messagesMap[conversationID].push(sent.data!);
      });
    },

    markRead: async (conversationID) => {
      const im = getIMSDK();
      try {
        await im.markConversationMessageAsRead(conversationID);
        set((s) => { const conv = s.conversations.find((c) => c.conversationID === conversationID); if (conv) conv.unreadCount = 0; });
      } catch (e) { console.error("markRead:", e); }
    },

    markAllRead: async () => {
      const im = getIMSDK();
      try {
        await im.markAllConversationMessageAsRead();
        set((s) => {
          s.conversations.forEach((c) => { c.unreadCount = 0; });
          s.totalUnread = 0;
        });
      } catch (e) { console.error("markAllRead:", e); }
    },

    refreshConversations: async () => {
      const im = getIMSDK();
      try {
        const res = await im.getAllConversationList();
        set((s) => { s.conversations = res.data || []; });
      } catch (e) { console.error("refreshConv:", e); }
    },

    pinConversation: async (conversationID, isPinned) => {
      const im = getIMSDK();
      try {
        await im.setConversation({ conversationID, isPinned });
        set((s) => {
          const conversation = s.conversations.find((item) => item.conversationID === conversationID);
          if (conversation) (conversation as any).isPinned = isPinned;
        });
      } catch (e) {
        console.error("pin:", e);
        throw e;
      }
    },

    muteConversation: async (conversationID, opt) => {
      const im = getIMSDK();
      try {
        let targetConversationID = conversationID;
        if (!get().conversations.some((item) => item.conversationID === conversationID) && conversationID.startsWith("sg_")) {
          const groupConversation = await im.getOneConversation({ sourceID: conversationID.slice(3), sessionType: SessionType.Group });
          targetConversationID = groupConversation.data?.conversationID || conversationID;
        }
        await im.setConversation({ conversationID: targetConversationID, recvMsgOpt: opt });
        const result = await im.getAllConversationList();
        set((s) => { s.conversations = result.data || []; });
      } catch (e) {
        console.error("mute:", e);
        throw e;
      }
    },

    deleteConversation: async (conversationID) => {
      const im = getIMSDK();
      try {
        const result = await im.deleteConversationAndDeleteAllMsg(conversationID);
        if (result.errCode !== 0) throw new Error(result.errMsg || "清除聊天记录失败");
        set((s) => {
          s.conversations = s.conversations.filter((c) => c.conversationID !== conversationID);
          delete s.messagesMap[conversationID];
          if (s.activeConversationID === conversationID) s.activeConversationID = null;
        });
      } catch (e) {
        console.error("deleteConv:", e);
        throw e;
      }
    },

    deleteMessagesFromLocalStorage: async (conversationID, clientMsgIDs) => {
      if (clientMsgIDs.length === 0) return;
      const im = getIMSDK();
      for (const clientMsgID of clientMsgIDs) {
        const result = await im.deleteMessageFromLocalStorage({ conversationID, clientMsgID });
        if (result.errCode !== 0) throw new Error(result.errMsg || "删除消息失败");
      }
      set((s) => {
        const removed = new Set(clientMsgIDs);
        s.messagesMap[conversationID] = (s.messagesMap[conversationID] || []).filter((message) => !removed.has(message.clientMsgID));
      });
    },

    hideConversation: async (conversationID) => {
      const im = getIMSDK();
      await im.hideConversation(conversationID);
      set((s) => {
        s.conversations = s.conversations.filter((conversation) => conversation.conversationID !== conversationID);
        delete s.messagesMap[conversationID];
        if (s.activeConversationID === conversationID) s.activeConversationID = null;
      });
    },

    revokeMessage: async (conversationID, clientMsgID) => {
      const im = getIMSDK();
      try {
        const result = await im.revokeMessage({ conversationID, clientMsgID });
        if (result.errCode !== 0) throw new Error(result.errMsg || "撤回消息失败");
        set((s) => {
          const msgs = s.messagesMap[conversationID];
          if (msgs) {
            const idx = msgs.findIndex((m) => m.clientMsgID === clientMsgID);
            if (idx >= 0) (msgs[idx] as any).contentType = MessageType.RevokeMessage;
          }
        });
      } catch (e) {
        console.error("revoke:", e);
        throw e;
      }
    },

    sendQuoteMessage: async (conversationID, text, quoteMessage) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) throw new Error("会话不存在");
      const msgRes = await im.createQuoteMessage({ text, message: quoteMessage });
      if (msgRes.errCode !== 0 || !msgRes.data) throw new Error(msgRes.errMsg || "创建引用消息失败");
      const message = msgRes.data;
      const params: any = {
        recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
        groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
        message,
      };
      set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
      try {
        const sendRes = await im.sendMessage(params);
        if (sendRes.errCode !== 0 || !sendRes.data) throw new Error(sendRes.errMsg || "发送引用消息失败");
        set((s) => {
          const msgs = s.messagesMap[conversationID];
          if (msgs) {
            const idx = msgs.findIndex((m) => m.clientMsgID === message.clientMsgID);
            if (idx >= 0) msgs[idx] = sendRes.data!;
          }
        });
      } catch (e) {
        set((s) => {
          const msgs = s.messagesMap[conversationID];
          if (msgs) {
            const idx = msgs.findIndex((m) => m.clientMsgID === message.clientMsgID);
            if (idx >= 0) (msgs[idx] as any).status = 3;
          }
        });
        throw e;
      }
    },

    sendAtMessage: async (conversationID, text, atUserIDList) => {
      const im = getIMSDK();
      const state = get();
      const conv = state.conversations.find((c) => c.conversationID === conversationID);
      if (!conv) throw new Error("会话不存在");
      const atUsersInfo = atUserIDList
        .filter((userID) => userID !== "__atAll__")
        .map((userID) => ({
          atUserID: userID,
          groupNickname: state.groupMembersMap[conv.groupID]?.find((member) => member.userID === userID)?.nickname || userID,
        }));
      const msgRes = await im.createTextAtMessage({
        text,
        atUserIDList: atUserIDList.map((userID) => userID === "__atAll__" ? "" : userID),
        atUsersInfo,
        message: undefined,
      });
      if (msgRes.errCode !== 0 || !msgRes.data) throw new Error(msgRes.errMsg || "创建提及消息失败");
      const message = msgRes.data;
      const params: any = {
        recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
        groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
        message,
      };
      set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
      try {
        const sendRes = await im.sendMessage(params);
        if (sendRes.errCode !== 0 || !sendRes.data) throw new Error(sendRes.errMsg || "发送提及消息失败");
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
        const msgRes = await im.createFaceMessage({
          index: 0,
          data: emoji,
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
        const res = await im.searchLocalMessages({ conversationID, keywordList, pageIndex: 1, count: 20 });
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
      if (!conv) throw new Error("会话不存在");
      const msgRes = await im.createCustomMessage({
        data: JSON.stringify({ userID, nickname, faceURL }),
        extension: "contactCard",
        description: "名片",
      });
      if (msgRes.errCode !== 0 || !msgRes.data) throw new Error(msgRes.errMsg || "创建名片消息失败");
      const message = msgRes.data;
      const params: any = {
        recvID: conv.conversationType === SessionType.Single ? conv.userID : "",
        groupID: conv.conversationType === SessionType.Group ? conv.groupID : "",
        message,
      };
      set((s) => { if (!s.messagesMap[conversationID]) s.messagesMap[conversationID] = []; s.messagesMap[conversationID].push(message); });
      try {
        const sendRes = await im.sendMessage(params);
        if (sendRes.errCode !== 0 || !sendRes.data) throw new Error(sendRes.errMsg || "发送名片失败");
        set((s) => {
          const msgs = s.messagesMap[conversationID];
          if (msgs) {
            const idx = msgs.findIndex((m) => m.clientMsgID === message.clientMsgID);
            if (idx >= 0) msgs[idx] = sendRes.data!;
          }
        });
      } catch (e) {
        set((s) => {
          const msgs = s.messagesMap[conversationID];
          if (msgs) {
            const idx = msgs.findIndex((m) => m.clientMsgID === message.clientMsgID);
            if (idx >= 0) (msgs[idx] as any).status = 3;
          }
        });
        throw e;
      }
    },

    addFriend: async (userID, reqMsg) => {
      const result = await getIMSDK().addFriend({ toUserID: userID, reqMsg });
      if (result.errCode !== 0) throw new Error(result.errMsg || "发送好友申请失败");
    },
    acceptFriendRequest: async (userID) => {
      const im = getIMSDK();
      const result = await im.acceptFriendApplication({ toUserID: userID, handleMsg: "同意" });
      if (result.errCode !== 0) throw new Error(result.errMsg || "处理好友申请失败");
      const res = await im.getFriendApplicationListAsRecipient({ handleResults: [], offset: 0, count: 100 });
      set((s) => { s.friendRequests = res.data || []; });
      const frRes = await im.getFriendList();
      set((s) => { s.friends = frRes.data || []; });
    },
    rejectFriendRequest: async (userID) => {
      const im = getIMSDK();
      const result = await im.refuseFriendApplication({ toUserID: userID, handleMsg: "拒绝" });
      if (result.errCode !== 0) throw new Error(result.errMsg || "处理好友申请失败");
      const res = await im.getFriendApplicationListAsRecipient({ handleResults: [], offset: 0, count: 100 });
      set((s) => { s.friendRequests = res.data || []; });
    },
    deleteFriend: async (userID) => {
      const result = await getIMSDK().deleteFriend(userID);
      if (result.errCode !== 0) throw new Error(result.errMsg || "删除好友失败");
      set((s) => { s.friends = s.friends.filter((f) => f.userID !== userID); });
    },
    setFriendRemark: async (userID, remark) => {
      const im = getIMSDK();
      const result = await im.updateFriends({ friendUserIDs: [userID], remark });
      if (result.errCode !== 0) throw new Error(result.errMsg || "设置备注失败");
      set((s) => {
        const friend = s.friends.find((item) => item.userID === userID);
        if (friend) friend.remark = remark;
      });
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
      const result = await im.addBlack({ toUserID: userID });
      if (result.errCode !== 0) throw new Error(result.errMsg || "加入黑名单失败");
      const res = await im.getBlackList();
      if (res.errCode !== 0) throw new Error(res.errMsg || "刷新黑名单失败");
      set((s) => { s.blackList = res.data || []; });
    },
    removeBlack: async (userID) => {
      const im = getIMSDK();
      const result = await im.removeBlack(userID);
      if (result.errCode !== 0) throw new Error(result.errMsg || "移出黑名单失败");
      const res = await im.getBlackList();
      if (res.errCode !== 0) throw new Error(res.errMsg || "刷新黑名单失败");
      set((s) => { s.blackList = res.data || []; });
    },

    createGroup: async (name, memberUserIDs) => {
      const im = getIMSDK();
      const res = await im.createGroup({ memberUserIDs, groupInfo: { groupName: name, groupType: 2 } } as any);
      if (res.data) {
        const groupRes = await im.getJoinedGroupList();
        set((s) => { s.groups = groupRes.data || []; });
      } else {
        throw new Error("创建群组失败");
      }
    },

    refreshGroups: async () => {
      const im = getIMSDK();
      const result = await im.getJoinedGroupList();
      set((s) => { s.groups = result.data || []; });
    },

    loadGroupMembers: async (groupID) => {
      const im = getIMSDK();
      try {
        const res = await im.getGroupMemberList({ groupID, filter: GroupMemberFilter.All, offset: 0, count: 1000 });
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
      const result = await getIMSDK().inviteUserToGroup({ groupID, userIDList: userIDs, reason } as any);
      if (result.errCode !== 0) throw new Error(result.errMsg || "邀请失败");
    },

    kickFromGroup: async (groupID, userIDs, reason) => {
      const result = await getIMSDK().kickGroupMember({ groupID, userIDList: userIDs, reason } as any);
      if (result.errCode !== 0) throw new Error(result.errMsg || "移除成员失败");
    },

    muteGroupMember: async (groupID, userID, seconds) => {
      const im = getIMSDK();
      try {
        await im.changeGroupMemberMute({ groupID, userID, mutedSeconds: seconds });
        set((s) => {
          const member = s.groupMembersMap[groupID]?.find((item) => item.userID === userID);
          if (member) member.muteEndTime = seconds > 0 ? Math.floor(Date.now() / 1000) + seconds : 0;
        });
      } catch (e) {
        console.error("muteGroupMember:", e);
        throw e;
      }
    },

    muteGroup: async (groupID, isMute) => {
      const im = getIMSDK();
      try {
        await im.changeGroupMute({ groupID, isMute });
        set((s) => {
          const group = s.groups.find((item) => item.groupID === groupID);
          if (group) group.status = isMute ? GroupStatus.Muted : GroupStatus.Normal;
        });
      } catch (e) {
        console.error("muteGroup:", e);
        throw e;
      }
    },

    dismissGroup: async (groupID) => {
      const result = await getIMSDK().dismissGroup(groupID);
      if (result.errCode !== 0) throw new Error(result.errMsg || "解散群组失败");
      set((s) => { s.groups = s.groups.filter((g) => g.groupID !== groupID); });
    },

    transferGroupOwner: async (groupID, newOwnerUserID) => {
      const im = getIMSDK();
      try {
        await im.transferGroupOwner({ groupID, newOwnerUserID });
        const result = await im.getJoinedGroupList();
        set((s) => { s.groups = result.data || []; });
      } catch (e) {
        console.error("transferGroup:", e);
        throw e;
      }
    },

    loadGroupApplications: async () => {
      const im = getIMSDK();
      try {
        const res = await im.getGroupApplicationListAsRecipient({ groupIDs: [], handleResults: [0], offset: 0, count: 100 });
        set((s) => { s.groupRequests = res.data || []; });
      } catch (e) { console.error("loadGroupApps:", e); }
    },

    acceptGroupApplication: async (groupID, fromUserID) => {
      const im = getIMSDK();
      try {
        const result = await im.acceptGroupApplication({ groupID, fromUserID, handleMsg: "同意" } as any);
        if (result.errCode !== 0) throw new Error(result.errMsg || "处理申请失败");
        await get().loadGroupApplications();
      } catch (e) { console.error("acceptGroupApp:", e); throw e; }
    },

    refuseGroupApplication: async (groupID, fromUserID) => {
      const im = getIMSDK();
      try {
        const result = await im.refuseGroupApplication({ groupID, fromUserID, handleMsg: "拒绝" } as any);
        if (result.errCode !== 0) throw new Error(result.errMsg || "处理申请失败");
        await get().loadGroupApplications();
      } catch (e) { console.error("refuseGroupApp:", e); throw e; }
    },

    setGroupMemberNickname: async (groupID, userID, nickname) => {
      const im = getIMSDK();
      try {
        await im.setGroupMemberInfo({ groupID, userID, nickname } as any);
        await get().loadGroupMembers(groupID);
      } catch (e) { console.error("setGroupMemberNickname:", e); }
    },

    setGroupMemberRole: async (groupID, userID, roleLevel) => {
      const im = getIMSDK();
      try {
        await im.setGroupMemberInfo({ groupID, userID, roleLevel } as any);
        await get().loadGroupMembers(groupID);
      } catch (e) {
        console.error("setGroupMemberRole:", e);
        throw e;
      }
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
      const userID = get().currentUser?.userID;
      if (!userID) {
        set((s) => { s.tags = []; });
        return;
      }
      try {
        const raw = localStorage.getItem(getUserStorageKey("99chat_tags", userID));
        const tags = raw ? JSON.parse(raw) : [];
        set((s) => { s.tags = tags; });
      } catch { set((s) => { s.tags = []; }); }
    },

    createTag: (name, memberIDs) => {
      const tag: TagItem = { tagID: `tag_${Date.now()}`, name, memberIDs };
      set((s) => {
        s.tags.push(tag);
        if (s.currentUser) localStorage.setItem(getUserStorageKey("99chat_tags", s.currentUser.userID), JSON.stringify(s.tags));
      });
    },

    updateTag: (tagID, name, memberIDs) => {
      set((s) => {
        const tag = s.tags.find((t) => t.tagID === tagID);
        if (tag) {
          tag.name = name;
          tag.memberIDs = memberIDs;
          if (s.currentUser) localStorage.setItem(getUserStorageKey("99chat_tags", s.currentUser.userID), JSON.stringify(s.tags));
        }
      });
    },

    deleteTag: (tagID) => {
      set((s) => {
        s.tags = s.tags.filter((t) => t.tagID !== tagID);
        if (s.currentUser) localStorage.setItem(getUserStorageKey("99chat_tags", s.currentUser.userID), JSON.stringify(s.tags));
      });
    },

    setDraft: (conversationID, text) => {
      set((s) => { s.drafts[conversationID] = text; });
    },

    clearDraft: (conversationID) => {
      set((s) => { delete s.drafts[conversationID]; });
    },

    markConversationUnread: (conversationID) => {
      set((s) => {
        const conv = s.conversations.find((c) => c.conversationID === conversationID);
        if (conv && conv.unreadCount === 0) conv.unreadCount = 1;
      });
    },

    updateSelfInfo: async (info) => {
      const im = getIMSDK();
      const result = await im.setSelfInfo(info);
      if (result.errCode !== 0) throw new Error(result.errMsg || "保存资料失败");
      const res = await im.getSelfUserInfo();
      if (res.errCode !== 0) throw new Error(res.errMsg || "刷新资料失败");
      set((s) => { s.currentUser = res.data; });
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
    };
  })
);
