import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Search, Plus, Pin, BellOff, Trash2, MoreVertical, Check } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { formatTime } from "../../utils/format";
import type { Conversation } from "../../mock/data";

export default function ConversationList() {
  const conversations = useAppStore((s) => s.conversations);
  const activeID = useAppStore((s) => s.activeConversationID);
  const setActive = useAppStore((s) => s.setActiveConversation);
  const togglePin = useAppStore((s) => s.togglePin);
  const toggleMute = useAppStore((s) => s.toggleMute);
  const deleteConv = useAppStore((s) => s.deleteConversation);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuConv, setMenuConv] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuConv(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = conversations
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.lastMsg.includes(search))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.lastMsgTimeStamp - a.lastMsgTimeStamp;
    });

  const handleClick = (c: Conversation) => {
    setActive(c.chatSessionID);
    navigate(`/messages/session/${c.chatSessionID}`);
    setMenuConv(null);
  };

  return (
    <>
      <div className="w-[320px] border-r border-gray-100 flex flex-col bg-white">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">消息</h2>
            <button className="text-gray-400 hover:text-primary-500">
              <Plus size={20} />
            </button>
          </div>
          {/* Search */}
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

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-20 text-gray-300 text-sm">无搜索结果</div>
          )}
          {filtered.map((c) => (
            <div
              key={c.chatSessionID}
              onClick={() => handleClick(c)}
              onContextMenu={(e) => { e.preventDefault(); setMenuConv(c.chatSessionID); }}
              className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${
                activeID === c.chatSessionID ? "bg-primary-50" : "hover:bg-gray-50"
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img src={c.faceURL} alt="" className="w-11 h-11 rounded-xl object-cover bg-gray-100" />
                {c.type === "single" && c.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                )}
                {c.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center font-medium">
                    {c.unreadCount > 99 ? "99+" : c.unreadCount}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    {c.isPinned && <Pin size={12} className="text-gray-300 flex-shrink-0" />}
                    <span className="text-sm font-medium text-gray-800 truncate">{c.name}</span>
                    {c.isNotDisturb && <BellOff size={12} className="text-gray-300 flex-shrink-0" />}
                  </div>
                  <span className="text-xs text-gray-300 flex-shrink-0">{formatTime(c.lastMsgTimeStamp)}</span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{c.lastMsg}</p>
              </div>

              {/* More button */}
              <button
                onClick={(e) => { e.stopPropagation(); setMenuConv(c.chatSessionID); }}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition-opacity"
              >
                <MoreVertical size={16} />
              </button>

              {/* Context menu */}
              {menuConv === c.chatSessionID && (
                <div
                  ref={menuRef}
                  className="absolute right-2 top-8 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-36"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { togglePin(c.chatSessionID); setMenuConv(null); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                  >
                    <Pin size={14} /> {c.isPinned ? "取消置顶" : "置顶"}
                  </button>
                  <button
                    onClick={() => { toggleMute(c.chatSessionID); setMenuConv(null); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                  >
                    <BellOff size={14} /> {c.isNotDisturb ? "取消免打扰" : "免打扰"}
                  </button>
                  <button
                    onClick={() => { deleteConv(c.chatSessionID); setMenuConv(null); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-500"
                  >
                    <Trash2 size={14} /> 删除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Outlet />
    </>
  );
}
