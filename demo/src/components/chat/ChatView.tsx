import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone, Video, MoreVertical, Smile, Paperclip, Send, Image, Mic,
  ArrowLeft, RotateCcw, Copy, Trash2, Forward, Reply, Check, CheckCheck,
} from "lucide-react";
import { startCall } from "../call/CallOverlay";
import { useAppStore } from "../../store/app-store";
import { formatTime } from "../../utils/format";
import type { Message } from "../../mock/data";

export default function ChatView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const conv = useAppStore((s) => s.conversations.find((c) => c.chatSessionID === id));
  const messages = useAppStore((s) => (id ? s.messages[id] || [] : []));
  const currentUser = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const groupMembers = useAppStore((s) => s.groupMembers);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const revokeMsg = useAppStore((s) => s.revokeMessage);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [contextMsg, setContextMsg] = useState<string | null>(null);
    const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!conv) {
    return <div className="flex-1 flex items-center justify-center text-gray-300">会话不存在</div>;
  }

  const isGroup = conv.type === "group";
  const peerUser = !isGroup ? users[conv.userID!] : null;

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(conv.chatSessionID, input.trim());
    setInput("");
  };

  const getSenderName = (msg: Message) => {
    if (msg.sendID === currentUser.userID) return "我";
    if (isGroup) {
      const m = groupMembers.find((g) => g.userID === msg.sendID && g.groupID === conv.groupID);
      return m?.nickname || users[msg.sendID]?.nickname || "未知";
    }
    return peerUser?.nickname || "";
  };

  const getSenderAvatar = (msg: Message) => {
    if (msg.sendID === currentUser.userID) return currentUser.faceURL;
    return users[msg.sendID]?.faceURL || "";
  };

  const isSelf = (msg: Message) => msg.sendID === currentUser.userID;

  const handleRevoke = (msgID: string) => {
    revokeMsg(conv.chatSessionID, msgID);
    setContextMsg(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-5 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/messages")} className="text-gray-400 hover:text-gray-600 md:hidden">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800">{conv.name}</h3>
            {isGroup && <span className="text-xs text-gray-400">({groupMembers.filter(m => m.groupID === conv.groupID).length})</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => startCall("audio", conv.name, peerUser?.faceURL || conv.faceURL)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
            <Phone size={18} />
          </button>
          <button onClick={() => startCall("video", conv.name, peerUser?.faceURL || conv.faceURL)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
            <Video size={18} />
          </button>
          <button onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="absolute right-5 top-14 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-40 text-sm">
              {!isGroup && (
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600" onClick={() => { navigate(`/contact/user/${conv.userID}`); setShowMenu(false); }}>
                  查看资料
                </button>
              )}
              {isGroup && (
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600" onClick={() => { navigate(`/contact/group/${conv.groupID}`); setShowMenu(false); }}>
                  群聊信息
                </button>
              )}
              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">消息搜索</button>
              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">清空聊天记录</button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-bg px-5 py-4">
        <div className="space-y-1">
          {/* Time divider */}
          {messages.length > 0 && (
            <div className="flex justify-center mb-4">
              <span className="text-xs text-gray-400 bg-gray-200/60 px-3 py-1 rounded-full">
                {formatTime(messages[0].timeStamp)}
              </span>
            </div>
          )}
          {messages.map((msg, idx) => {
            if (msg.msgType === "Notice") {
              return (
                <div key={msg.msgID} className="flex justify-center py-2">
                  <span className="text-xs text-gray-400 bg-gray-200/50 px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }

            const self = isSelf(msg);
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showAvatar = !prevMsg || prevMsg.sendID !== msg.sendID || prevMsg.msgType === "Notice";

            return (
              <div
                key={msg.msgID}
                onContextMenu={(e) => { e.preventDefault(); setContextMsg(msg.msgID); }}
                className={`flex items-start gap-2 ${self ? "flex-row-reverse" : "flex-row"} ${showAvatar ? "mt-3" : "mt-0.5"}`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 flex-shrink-0">
                  {showAvatar && (
                    <img src={getSenderAvatar(msg)} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100" />
                  )}
                </div>

                {/* Message content */}
                <div className={`flex flex-col max-w-[60%] ${self ? "items-end" : "items-start"}`}>
                  {showAvatar && isGroup && (
                    <span className="text-xs text-gray-400 mb-1 px-1">{getSenderName(msg)}</span>
                  )}
                  <div className="relative group">
                    {msg.msgType === "Text" && (
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm break-words ${
                          self
                            ? "bg-primary-500 text-white rounded-tr-md"
                            : "bg-white text-gray-700 rounded-tl-md shadow-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}
                    {msg.msgType === "Image" && (
                      <img src={msg.content} alt="" className="max-w-[240px] max-h-[200px] rounded-xl object-cover" />
                    )}

                    {/* Self status */}
                    {self && msg.msgType !== "Notice" && (
                      <div className="flex items-center justify-end gap-1 mt-0.5 pr-1">
                        {msg.status === "sending" && <span className="text-[10px] text-gray-300">发送中</span>}
                        {msg.status === "sent" && !msg.isRead && <Check size={12} className="text-gray-300" />}
                        {msg.status === "sent" && msg.isRead && <CheckCheck size={12} className="text-primary-400" />}
                        {msg.status === "failed" && <span className="text-[10px] text-red-400">发送失败</span>}
                      </div>
                    )}

                    {/* Context menu */}
                    {contextMsg === msg.msgID && (
                      <div
                        className={`absolute z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-32 text-sm ${self ? "right-0" : "left-0"} top-full mt-1`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2">
                          <Reply size={12} /> 回复
                        </button>
                        {msg.msgType === "Text" && (
                          <button
                            onClick={() => { navigator.clipboard?.writeText(msg.content); setContextMsg(null); }}
                            className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"
                          >
                            <Copy size={12} /> 复制
                          </button>
                        )}
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2">
                          <Forward size={12} /> 转发
                        </button>
                        {self && (
                          <button
                            onClick={() => handleRevoke(msg.msgID)}
                            className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"
                          >
                            <RotateCcw size={12} /> 撤回
                          </button>
                        )}
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-red-400 flex items-center gap-2">
                          <Trash2 size={12} /> 删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={msgEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="text-gray-400 hover:text-primary-500">
            <Smile size={22} />
          </button>
          <button className="text-gray-400 hover:text-primary-500">
            <Paperclip size={22} />
          </button>
          <button className="text-gray-400 hover:text-primary-500">
            <Image size={22} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="输入消息..."
            className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200 transition-all"
          />
          <button className="text-gray-400 hover:text-primary-500">
            <Mic size={22} />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              input.trim() ? "bg-primary-500 text-white hover:bg-primary-600" : "bg-gray-100 text-gray-300"
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

    </div>
  );
}