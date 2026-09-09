export interface User {
  userID: string;
  nickname: string;
  faceURL: string;
  gender: number;
  signature: string;
  isOnline: boolean;
}

export interface Message {
  msgID: string;
  sendID: string;
  recvID: string;
  msgType: "Text" | "Image" | "Audio" | "Video" | "File" | "Notice" | "Call";
  content: string;
  timeStamp: number;
  isRead: boolean;
  seq: number;
  status: "sending" | "sent" | "failed";
}

export interface Conversation {
  chatSessionID: string;
  type: "single" | "group";
  userID?: string;
  groupID?: string;
  name: string;
  faceURL: string;
  lastMsgTimeStamp: number;
  lastMsg: string;
  unreadCount: number;
  isPinned: boolean;
  isNotDisturb: boolean;
  isOnline?: boolean;
  atIDs?: string[];
}

export interface Group {
  groupID: string;
  groupName: string;
  faceURL: string;
  introduction: string;
  announcement: string;
  ownerUserID: string;
  memberCount: number;
  createTime: number;
}

export interface GroupMember {
  userID: string;
  groupID: string;
  roleLevel: number;
  nickname: string;
  faceURL: string;
  joinTime: number;
  muteEndTime: number;
}

export interface Friend {
  userID: string;
  nickname: string;
  faceURL: string;
  remark: string;
  signature: string;
  isOnline: boolean;
}

export interface FriendRequest {
  id: string;
  fromUserID: string;
  fromNickname: string;
  fromFaceURL: string;
  toUserID: string;
  handleStatus: "pending" | "accepted" | "rejected";
  reqMsg: string;
  createTime: number;
}

const avatar = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

export const currentUser: User = {
  userID: "u001",
  nickname: "林晚",
  faceURL: avatar("linwan"),
  gender: 2,
  signature: "山有木兮木有枝",
  isOnline: true,
};

export const users: Record<string, User> = {
  u001: currentUser,
  u002: { userID: "u002", nickname: "陈默", faceURL: avatar("chenmo"), gender: 1, signature: "沉默是金", isOnline: true },
  u003: { userID: "u003", nickname: "苏夏", faceURL: avatar("suxia"), gender: 2, signature: "夏日终焉", isOnline: false },
  u004: { userID: "u004", nickname: "周野", faceURL: avatar("zhouye"), gender: 1, signature: "荒野求生", isOnline: true },
  u005: { userID: "u005", nickname: "叶秋", faceURL: avatar("yeqiu"), gender: 1, signature: "一叶知秋", isOnline: false },
  u006: { userID: "u006", nickname: "沈音", faceURL: avatar("shenyin"), gender: 2, signature: "音为有你", isOnline: true },
  u007: { userID: "u007", nickname: "韩星", faceURL: avatar("hanxing"), gender: 1, signature: "星光不问赶路人", isOnline: false },
  u008: { userID: "u008", nickname: "程潇", faceURL: avatar("chengxiao"), gender: 2, signature: "潇洒走一回", isOnline: true },
};

export const friends: Friend[] = [
  { userID: "u002", nickname: "陈默", faceURL: avatar("chenmo"), remark: "", signature: "沉默是金", isOnline: true },
  { userID: "u003", nickname: "苏夏", faceURL: avatar("suxia"), remark: "夏天", signature: "夏日终焉", isOnline: false },
  { userID: "u004", nickname: "周野", faceURL: avatar("zhouye"), remark: "", signature: "荒野求生", isOnline: true },
  { userID: "u005", nickname: "叶秋", faceURL: avatar("yeqiu"), remark: "老叶", signature: "一叶知秋", isOnline: false },
  { userID: "u006", nickname: "沈音", faceURL: avatar("shenyin"), remark: "", signature: "音为有你", isOnline: true },
  { userID: "u007", nickname: "韩星", faceURL: avatar("hanxing"), remark: "", signature: "星光不问赶路人", isOnline: false },
  { userID: "u008", nickname: "程潇", faceURL: avatar("chengxiao"), remark: "潇潇", signature: "潇洒走一回", isOnline: true },
];

export const groups: Group[] = [
  {
    groupID: "g001",
    groupName: "前端技术交流群",
    faceURL: avatar("frontend"),
    introduction: "探讨前端技术，分享学习资源",
    announcement: "本周讨论主题：React 19 新特性解析",
    ownerUserID: "u002",
    memberCount: 6,
    createTime: Date.now() - 86400000 * 30,
  },
  {
    groupID: "g002",
    groupName: "周末徒步队",
    faceURL: avatar("hiking"),
    introduction: "周末一起去徒步吧！",
    announcement: "本周六早上8点，白云山集合",
    ownerUserID: "u004",
    memberCount: 5,
    createTime: Date.now() - 86400000 * 60,
  },
  {
    groupID: "g003",
    groupName: "读书会",
    faceURL: avatar("book"),
    introduction: "每月共读一本书",
    announcement: "本月共读：《百年孤独》",
    ownerUserID: "u006",
    memberCount: 4,
    createTime: Date.now() - 86400000 * 90,
  },
];

export const groupMembers: GroupMember[] = [
  // g001
  { userID: "u002", groupID: "g001", roleLevel: 100, nickname: "陈默", faceURL: avatar("chenmo"), joinTime: Date.now() - 86400000 * 30, muteEndTime: 0 },
  { userID: "u001", groupID: "g001", roleLevel: 20, nickname: "林晚", faceURL: avatar("linwan"), joinTime: Date.now() - 86400000 * 28, muteEndTime: 0 },
  { userID: "u003", groupID: "g001", roleLevel: 60, nickname: "苏夏", faceURL: avatar("suxia"), joinTime: Date.now() - 86400000 * 25, muteEndTime: 0 },
  { userID: "u004", groupID: "g001", roleLevel: 20, nickname: "周野", faceURL: avatar("zhouye"), joinTime: Date.now() - 86400000 * 20, muteEndTime: 0 },
  { userID: "u005", groupID: "g001", roleLevel: 20, nickname: "叶秋", faceURL: avatar("yeqiu"), joinTime: Date.now() - 86400000 * 15, muteEndTime: 0 },
  { userID: "u006", groupID: "g001", roleLevel: 20, nickname: "沈音", faceURL: avatar("shenyin"), joinTime: Date.now() - 86400000 * 10, muteEndTime: 0 },
  // g002
  { userID: "u004", groupID: "g002", roleLevel: 100, nickname: "周野", faceURL: avatar("zhouye"), joinTime: Date.now() - 86400000 * 60, muteEndTime: 0 },
  { userID: "u001", groupID: "g002", roleLevel: 20, nickname: "林晚", faceURL: avatar("linwan"), joinTime: Date.now() - 86400000 * 55, muteEndTime: 0 },
  { userID: "u002", groupID: "g002", roleLevel: 20, nickname: "陈默", faceURL: avatar("chenmo"), joinTime: Date.now() - 86400000 * 50, muteEndTime: 0 },
  { userID: "u007", groupID: "g002", roleLevel: 20, nickname: "韩星", faceURL: avatar("hanxing"), joinTime: Date.now() - 86400000 * 40, muteEndTime: 0 },
  { userID: "u008", groupID: "g002", roleLevel: 20, nickname: "程潇", faceURL: avatar("chengxiao"), joinTime: Date.now() - 86400000 * 30, muteEndTime: 0 },
  // g003
  { userID: "u006", groupID: "g003", roleLevel: 100, nickname: "沈音", faceURL: avatar("shenyin"), joinTime: Date.now() - 86400000 * 90, muteEndTime: 0 },
  { userID: "u001", groupID: "g003", roleLevel: 20, nickname: "林晚", faceURL: avatar("linwan"), joinTime: Date.now() - 86400000 * 85, muteEndTime: 0 },
  { userID: "u003", groupID: "g003", roleLevel: 60, nickname: "苏夏", faceURL: avatar("suxia"), joinTime: Date.now() - 86400000 * 80, muteEndTime: 0 },
  { userID: "u008", groupID: "g003", roleLevel: 20, nickname: "程潇", faceURL: avatar("chengxiao"), joinTime: Date.now() - 86400000 * 70, muteEndTime: 0 },
];

export const friendRequests: FriendRequest[] = [
  { id: "fr1", fromUserID: "u007", fromNickname: "韩星", fromFaceURL: avatar("hanxing"), toUserID: "u001", handleStatus: "pending", reqMsg: "我是韩星，在徒步群认识的", createTime: Date.now() - 3600000 },
  { id: "fr2", fromUserID: "u008", fromNickname: "程潇", fromFaceURL: avatar("chengxiao"), toUserID: "u001", handleStatus: "pending", reqMsg: "你好，想加你好友", createTime: Date.now() - 7200000 },
];

function ts(minutesAgo: number) {
  return Date.now() - minutesAgo * 60000;
}

export const initialConversations: Conversation[] = [
  {
    chatSessionID: "c001", type: "single", userID: "u002", name: "陈默", faceURL: avatar("chenmo"),
    lastMsgTimeStamp: ts(3), lastMsg: "那个 PR 你看了吗？", unreadCount: 2, isPinned: true, isNotDisturb: false, isOnline: true,
  },
  {
    chatSessionID: "c002", type: "group", groupID: "g001", name: "前端技术交流群", faceURL: avatar("frontend"),
    lastMsgTimeStamp: ts(15), lastMsg: "苏夏: React 19 的 use 钩子真不错", unreadCount: 5, isPinned: true, isNotDisturb: false,
  },
  {
    chatSessionID: "c003", type: "single", userID: "u004", name: "周野", faceURL: avatar("zhouye"),
    lastMsgTimeStamp: ts(60), lastMsg: "周六还去徒步吗？", unreadCount: 0, isPinned: false, isNotDisturb: false, isOnline: true,
  },
  {
    chatSessionID: "c004", type: "group", groupID: "g002", name: "周末徒步队", faceURL: avatar("hiking"),
    lastMsgTimeStamp: ts(120), lastMsg: "程潇: 我带相机！", unreadCount: 0, isPinned: false, isNotDisturb: true,
  },
  {
    chatSessionID: "c005", type: "single", userID: "u006", name: "沈音", faceURL: avatar("shenyin"),
    lastMsgTimeStamp: ts(300), lastMsg: "好的，谢谢～", unreadCount: 0, isPinned: false, isNotDisturb: false, isOnline: true,
  },
  {
    chatSessionID: "c006", type: "group", groupID: "g003", name: "读书会", faceURL: avatar("book"),
    lastMsgTimeStamp: ts(1440), lastMsg: "沈音: 本月共读《百年孤独》", unreadCount: 0, isPinned: false, isNotDisturb: false,
  },
  {
    chatSessionID: "c007", type: "single", userID: "u003", name: "苏夏", faceURL: avatar("suxia"),
    lastMsgTimeStamp: ts(2880), lastMsg: "[图片]", unreadCount: 0, isPinned: false, isNotDisturb: false, isOnline: false,
  },
];

export const initialMessages: Record<string, Message[]> = {
  c001: [
    { msgID: "m1", sendID: "u002", recvID: "u001", msgType: "Text", content: "在吗？", timeStamp: ts(30), isRead: true, seq: 1, status: "sent" },
    { msgID: "m2", sendID: "u001", recvID: "u002", msgType: "Text", content: "在的，怎么了？", timeStamp: ts(28), isRead: true, seq: 2, status: "sent" },
    { msgID: "m3", sendID: "u002", recvID: "u001", msgType: "Text", content: "我刚才提交了个 PR，你帮忙 review 一下", timeStamp: ts(25), isRead: true, seq: 3, status: "sent" },
    { msgID: "m4", sendID: "u001", recvID: "u002", msgType: "Text", content: "好的，我看看", timeStamp: ts(20), isRead: true, seq: 4, status: "sent" },
    { msgID: "m5", sendID: "u002", recvID: "u001", msgType: "Text", content: "主要是改了 WebSocket 重连逻辑", timeStamp: ts(10), isRead: false, seq: 5, status: "sent" },
    { msgID: "m6", sendID: "u002", recvID: "u001", msgType: "Text", content: "那个 PR 你看了吗？", timeStamp: ts(3), isRead: false, seq: 6, status: "sent" },
  ],
  c002: [
    { msgID: "g1", sendID: "u003", recvID: "g001", msgType: "Text", content: "大家觉得 React 19 怎么样？", timeStamp: ts(20), isRead: false, seq: 1, status: "sent" },
    { msgID: "g2", sendID: "u002", recvID: "g001", msgType: "Text", content: "Server Components 用起来挺爽的", timeStamp: ts(18), isRead: false, seq: 2, status: "sent" },
    { msgID: "g3", sendID: "u003", recvID: "g001", msgType: "Text", content: "React 19 的 use 钩子真不错", timeStamp: ts(15), isRead: false, seq: 3, status: "sent" },
  ],
  c003: [
    { msgID: "h1", sendID: "u004", recvID: "u001", msgType: "Text", content: "周六还去徒步吗？", timeStamp: ts(60), isRead: true, seq: 1, status: "sent" },
  ],
  c004: [
    { msgID: "t1", sendID: "u004", recvID: "g002", msgType: "Text", content: "周六早上8点白云山集合", timeStamp: ts(180), isRead: true, seq: 1, status: "sent" },
    { msgID: "t2", sendID: "u008", recvID: "g002", msgType: "Text", content: "我带相机！", timeStamp: ts(120), isRead: true, seq: 2, status: "sent" },
  ],
  c005: [
    { msgID: "s1", sendID: "u006", recvID: "u001", msgType: "Text", content: "好的，谢谢～", timeStamp: ts(300), isRead: true, seq: 1, status: "sent" },
  ],
  c006: [
    { msgID: "b1", sendID: "u006", recvID: "g003", msgType: "Notice", content: "沈音 修改了群公告", timeStamp: ts(1500), isRead: true, seq: 1, status: "sent" },
    { msgID: "b2", sendID: "u006", recvID: "g003", msgType: "Text", content: "本月共读《百年孤独》", timeStamp: ts(1440), isRead: true, seq: 2, status: "sent" },
  ],
  c007: [
    { msgID: "x1", sendID: "u003", recvID: "u001", msgType: "Text", content: "看看这个", timeStamp: ts(2880), isRead: true, seq: 1, status: "sent" },
    { msgID: "x2", sendID: "u003", recvID: "u001", msgType: "Image", content: "https://picsum.photos/400/300", timeStamp: ts(2875), isRead: true, seq: 2, status: "sent" },
  ],
};
