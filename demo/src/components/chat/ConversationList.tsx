import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Search, Plus, Pin, BellOff, Trash2, MoreVertical, UserPlus, Users, UserSearch, Check, CheckCheck } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { formatTime } from "../../utils/format";
import { SessionType } from "@openim/wasm-client-sdk";
import type { ConversationItem } from "../../services/openim";

export default function ConversationList() {
  const conversations = useAppStore((s) => s.conversations);
  const activeID = useAppStore((s) => s.activeConversationID);
  const setActive = useAppStore((s) => s.setActiveConversation);
  const pinConv = useAppStore((s) => s.pinConversation);
  const muteConv = useAppStore((s) => s.muteConversation);
  const deleteConv = useAppStore((s) => s.deleteConversation);
  const onlineStatus = useAppStore((s) => s.onlineStatus);
  const loadOnlineStatus = useAppStore((s) => s.loadOnlineStatus);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuConv, setMenuConv] = useState<string | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendID, setFriendID] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState("");
  const addFriend = useAppStore((s) => s.addFriend);
  const markAllRead = useAppStore((s) => s.markAllRead);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const singleChatUserIDs = conversations
      .filter((c) => c.conversationType === SessionType.Single && c.userID)
      .map((c) => c.userID!);
    if (singleChatUserIDs.length > 0) loadOnlineStatus(singleChatUserIDs);
  }, [conversations.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuConv(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = conversations
    .filter((c) => c.showName?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aPin = (a as any).isPinned ? 1 : 0;
      const bPin = (b as any).isPinned ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      return b.unreadCount - a.unreadCount;
    });

  const handleClick = (c: ConversationItem) => {
    setActive(c.conversationID);
    navigate(`/messages/session/${c.conversationID}`);
    setMenuConv(null);
  };

  const getLatestMsgText = (conv: ConversationItem) => {
    if (!conv.latestMsg) return "";
    try {
      const msg = JSON.parse(conv.latestMsg);
      const type = msg.contentType;
      if (type === 101) return msg.textElem?.content || "";
      if (type === 102) return "[图片]";
      if (type === 103) return "[语音]";
      if (type === 104) return "[视频]";
      if (type === 105) return "[文件]";
      if (type === 106) return "[@消息]";
      return "";
    } catch {
      return conv.latestMsg;
    }
  };

  return (
    <>
      <div className="w-[320px] border-r border-gray-100 flex flex-col bg-white">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">消息</h2>
            <div className="relative">
            <button onClick={() => setShowPlusMenu(!showPlusMenu)} className="text-gray-400 hover:text-primary-500"><Plus size={20} /></button>
            {showPlusMenu && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-36 text-sm" onClick={() => setShowPlusMenu(false)}>
                <button onClick={() => { setShowPlusMenu(false); setShowAddFriend(true); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><UserPlus size={14} /> 添加好友</button>
                <button onClick={() => navigate("/contact/create-group")} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Users size={14} /> 创建群聊</button>
                <button onClick={() => navigate("/contact/search/user")} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><UserSearch size={14} /> 搜索用户</button>
                <button onClick={() => navigate("/contact/search/group")} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Search size={14} /> 搜索群组</button>
                <button onClick={() => { markAllRead(); setShowPlusMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><CheckCheck size={14} /> 全部已读</button>
              </div>
            )}
          </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索"
              className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300 text-sm gap-2">
              <Plus size={32} className="opacity-30" />
              <span>暂无会话</span>
              <span className="text-xs">添加好友开始聊天吧</span>
            </div>
          )}
          {filtered.map((c) => {
            const isPinned = (c as any).isPinned;
            const isMuted = (c as any).recvMsgOpt && (c as any).recvMsgOpt > 0;
            return (
              <div
                key={c.conversationID}
                onClick={() => handleClick(c)}
                onContextMenu={(e) => { e.preventDefault(); setMenuConv(c.conversationID); }}
                className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${
                  activeID === c.conversationID ? "bg-primary-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img src={c.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.conversationID}`} alt="" className="w-11 h-11 rounded-xl object-cover bg-gray-100" />
                  {c.unreadCount > 0 && !isMuted && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center font-medium">
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                  {c.unreadCount > 0 && isMuted && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gray-400 text-white text-[11px] rounded-full flex items-center justify-center">
                      ·
                    </span>
                  )}
                  {c.conversationType === SessionType.Single && onlineStatus[c.userID!] && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      {isPinned && <Pin size={12} className="text-gray-300 flex-shrink-0" />}
                      <span className="text-sm font-medium text-gray-800 truncate">{c.showName || "未知"}</span>
                      {isMuted && <BellOff size={12} className="text-gray-300 flex-shrink-0" />}
                    </div>
                    <span className="text-xs text-gray-300 flex-shrink-0">{formatTime(c.latestMsgSendTime || 0)}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{getLatestMsgText(c)}</p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setMenuConv(c.conversationID); }}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition-opacity"
                >
                  <MoreVertical size={16} />
                </button>

                {menuConv === c.conversationID && (
                  <div
                    ref={menuRef}
                    className="absolute right-2 top-8 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-36"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { pinConv(c.conversationID, !isPinned); setMenuConv(null); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                    >
                      <Pin size={14} /> {isPinned ? "取消置顶" : "置顶"}
                    </button>
                    <button
                      onClick={() => { muteConv(c.conversationID, isMuted ? 0 : 2); setMenuConv(null); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                    >
                      <BellOff size={14} /> {isMuted ? "取消免打扰" : "免打扰"}
                    </button>
                    <button
                      onClick={() => { deleteConv(c.conversationID); setMenuConv(null); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-500"
                    >
                      <Trash2 size={14} /> 删除
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <Outlet />

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddFriend(false)}>
          <div className="bg-white rounded-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-800 mb-1">添加好友</h3>
            <p className="text-xs text-gray-400 mb-4">输入对方的用户 ID 发送好友申请</p>
            {addSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-3"><Check size={24} /></div>
                <p className="text-sm text-gray-600">好友申请已发送，等待对方确认</p>
                <button onClick={() => { setShowAddFriend(false); setAddSuccess(false); setFriendID(""); }} className="mt-4 w-full py-2 bg-gray-50 text-gray-500 rounded-lg text-sm hover:bg-gray-100">关闭</button>
              </div>
            ) : (
              <>
                {addError && <div className="mb-3 px-3 py-2 bg-red-50 text-red-500 text-sm rounded-lg">{addError}</div>}
                <input
                  value={friendID}
                  onChange={(e) => { setFriendID(e.target.value); setAddError(""); }}
                  placeholder="请输入用户 ID"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 mb-4"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && friendID.trim()) {
                      addFriend(friendID.trim(), "请求添加好友")
                        .then(() => { setAddSuccess(true); })
                        .catch((err) => { setAddError(err?.message || "发送失败，请检查用户 ID"); });
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button onClick={() => { setShowAddFriend(false); setFriendID(""); setAddError(""); }} className="flex-1 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-sm hover:bg-gray-100">取消</button>
                  <button
                    onClick={() => {
                      if (!friendID.trim()) return;
                      addFriend(friendID.trim(), "请求添加好友")
                        .then(() => { setAddSuccess(true); })
                        .catch((err) => { setAddError(err?.message || "发送失败，请检查用户 ID"); });
                    }}
                    className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm hover:bg-primary-600">发送申请</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
