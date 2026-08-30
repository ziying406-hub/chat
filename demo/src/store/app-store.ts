import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  currentUser as _currentUser,
  initialConversations,
  initialMessages,
  friends as _friends,
  groups as _groups,
  groupMembers as _groupMembers,
  friendRequests as _friendRequests,
  users as _users,
  type Conversation,
  type Message,
  type Friend,
  type Group,
  type GroupMember,
  type FriendRequest,
  type User,
} from "../mock/data";

interface AppState {
  isAuthed: boolean;
  currentUser: User;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  friends: Friend[];
  groups: Group[];
  groupMembers: GroupMember[];
  friendRequests: FriendRequest[];
  users: Record<string, User>;
  activeConversationID: string | null;
  darkMode: boolean;

  login: () => void;
  logout: () => void;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (convID: string, content: string, msgType?: Message["msgType"]) => void;
  markConversationRead: (convID: string) => void;
  togglePin: (convID: string) => void;
  toggleMute: (convID: string) => void;
  deleteConversation: (convID: string) => void;
  revokeMessage: (convID: string, msgID: string) => void;
  acceptFriendRequest: (id: string) => void;
  rejectFriendRequest: (id: string) => void;
  toggleDarkMode: () => void;
  updateProfile: (patch: Partial<User>) => void;
}

export const useAppStore = create<AppState>()(
  immer((set) => ({
    isAuthed: false,
    currentUser: _currentUser,
    conversations: initialConversations,
    messages: initialMessages,
    friends: _friends,
    groups: _groups,
    groupMembers: _groupMembers,
    friendRequests: _friendRequests,
    users: _users,
    activeConversationID: null,
    darkMode: false,

    login: () => set((s) => { s.isAuthed = true; }),
    logout: () => set((s) => { s.isAuthed = false; s.activeConversationID = null; }),

    setActiveConversation: (id) => set((s) => {
      s.activeConversationID = id;
      if (id) {
        const conv = s.conversations.find((c) => c.chatSessionID === id);
        if (conv) conv.unreadCount = 0;
      }
    }),

    sendMessage: (convID, content, msgType = "Text") => set((s) => {
      const conv = s.conversations.find((c) => c.chatSessionID === convID);
      if (!conv) return;
      const msgs = s.messages[convID] || [];
      const newMsg: Message = {
        msgID: `m_${Date.now()}`,
        sendID: s.currentUser.userID,
        recvID: conv.type === "single" ? conv.userID! : conv.groupID!,
        msgType,
        content,
        timeStamp: Date.now(),
        isRead: false,
        seq: msgs.length + 1,
        status: "sent",
      };
      msgs.push(newMsg);
      s.messages[convID] = msgs;
      conv.lastMsg = msgType === "Text" ? content : `[${msgType}]`;
      conv.lastMsgTimeStamp = Date.now();
    }),

    markConversationRead: (convID) => set((s) => {
      const conv = s.conversations.find((c) => c.chatSessionID === convID);
      if (conv) conv.unreadCount = 0;
    }),

    togglePin: (convID) => set((s) => {
      const conv = s.conversations.find((c) => c.chatSessionID === convID);
      if (conv) conv.isPinned = !conv.isPinned;
    }),

    toggleMute: (convID) => set((s) => {
      const conv = s.conversations.find((c) => c.chatSessionID === convID);
      if (conv) conv.isNotDisturb = !conv.isNotDisturb;
    }),

    deleteConversation: (convID) => set((s) => {
      s.conversations = s.conversations.filter((c) => c.chatSessionID !== convID);
      delete s.messages[convID];
      if (s.activeConversationID === convID) s.activeConversationID = null;
    }),

    revokeMessage: (convID, msgID) => set((s) => {
      const msgs = s.messages[convID];
      if (!msgs) return;
      const idx = msgs.findIndex((m) => m.msgID === msgID);
      if (idx >= 0) {
        msgs[idx].msgType = "Notice";
        msgs[idx].content = "对方撤回了一条消息";
      }
    }),

    acceptFriendRequest: (id) => set((s) => {
      const req = s.friendRequests.find((r) => r.id === id);
      if (req) {
        req.handleStatus = "accepted";
        const user = s.users[req.fromUserID];
        if (user) {
          s.friends.push({
            userID: user.userID,
            nickname: user.nickname,
            faceURL: user.faceURL,
            remark: "",
            signature: user.signature,
            isOnline: user.isOnline,
          });
        }
      }
    }),

    rejectFriendRequest: (id) => set((s) => {
      const req = s.friendRequests.find((r) => r.id === id);
      if (req) req.handleStatus = "rejected";
    }),

    toggleDarkMode: () => set((s) => { s.darkMode = !s.darkMode; }),

    updateProfile: (patch) => set((s) => {
      Object.assign(s.currentUser, patch);
    }),
  }))
);
