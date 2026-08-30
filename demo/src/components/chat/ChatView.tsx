import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone, Video, MoreVertical, Smile, Paperclip, Send, Image, Mic,
  ArrowLeft, RotateCcw, Copy, Trash2, Forward, Reply, Check, CheckCheck,
} from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { formatTime } from "../../utils/format";
import { SessionType, MessageType } from "@openim/wasm-client-sdk";
import { startCall } from "../call/CallOverlay";

export default function ChatView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const conv = useAppStore((s) => s.conversations.find((c) => c.conversationID === id));
  const messages = useAppStore((s) => (id ? s.messagesMap[id] : undefined)) || [];
  const currentUser = useAppStore((s) => s.currentUser);
  const friends = useAppStore((s) => s.friends);
  const loadMessages = useAppStore((s) => s.loadMessages);
  const sendText = useAppStore((s) => s.sendTextMessage);
  const markRead = useAppStore((s) => s.markRead);
  const revokeMsg = useAppStore((s) => s.revokeMessage);
  const groupMembers = useAppStore((s) => s.groupMembersMap);
  const loadGroupMembers = useAppStore((s) => s.loadGroupMembers);

  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [contextMsg, setContextMsg] = useState<string | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadMessages(id);
      markRead(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!conv) {
    return <div className="flex-1 flex items-center justify-center text-gray-300">会话不存在</div>;
  }

  const isGroup = conv.conversationType === SessionType.Group;

  // Load group members for group chat
  useEffect(() => {
    if (isGroup && conv.groupID && !groupMembers[conv.groupID]) {
      loadGroupMembers(conv.groupID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGroup, conv.groupID, groupMembers]);
  

  const getPeerUser = () => {
    if (isGroup) return null;
    return friends.find((f) => f.userID === conv.userID);
  };
  const peerUser = getPeerUser();

  const handleSend = () => {
    if (!input.trim() || !id) return;
    sendText(id, input.trim());
    setInput("");
  };

  const getSenderName = (msg: any) => {
    if (msg.sendID === currentUser?.userID) return "我";
    if (isGroup) {
      const m = groupMembers[conv.groupID]?.find((g) => g.userID === msg.sendID);
      return m?.nickname || msg.senderNickname || msg.sendID;
    }
    return peerUser?.nickname || conv.showName || "";
  };

  const getSenderAvatar = (msg: any) => {
    if (msg.sendID === currentUser?.userID) return currentUser?.faceURL || "";
    if (isGroup) {
      const m = groupMembers[conv.groupID]?.find((g) => g.userID === msg.sendID);
      return m?.faceURL || "";
    }
    return peerUser?.faceURL || conv.faceURL || "";
  };

  const isSelf = (msg: any) => msg.sendID === currentUser?.userID;

  const getMsgContent = (msg: any) => {
    const type = msg.contentType;
    if (type === MessageType.TextMessage) return msg.textElem?.content || "";
    if (type === MessageType.PictureMessage) return msg.pictureElem?.sourcePath || "";
    if (type === MessageType.NotificationMessage) return "[系统通知]";
    return "";
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
            <h3 className="text-base font-semibold text-gray-800">{conv.showName || "未知"}</h3>
            {isGroup && groupMembers[conv.groupID] && (
              <span className="text-xs text-gray-400">({groupMembers[conv.groupID].length})</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          {!isGroup && (
            <>
              <button onClick={() => startCall("audio", conv.showName || "", peerUser?.faceURL || conv.faceURL || "")} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                <Phone size={18} />
              </button>
              <button onClick={() => startCall("video", conv.showName || "", peerUser?.faceURL || conv.faceURL || "")} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                <Video size={18} />
              </button>
            </>
          )}
          <button onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="absolute right-5 top-14 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-40 text-sm" onClick={() => setShowMenu(false)}>
              {!isGroup && (
                <button onClick={() => navigate(`/contact/user/${conv.userID}`)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">查看资料</button>
              )}
              {isGroup && (
                <button onClick={() => navigate(`/contact/group/${conv.groupID}`)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">群聊信息</button>
              )}
              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">清空聊天记录</button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-bg px-5 py-4">
        <div className="space-y-1">
          {messages.length === 0 && (
            <div className="flex justify-center py-20 text-gray-300 text-sm">暂无消息，发送第一条消息吧</div>
          )}
          {messages.map((msg: any, idx) => {
            const type = msg.contentType;
            if (type === MessageType.NotificationMessage || type >= 900) {
              return (
                <div key={msg.clientMsgID} className="flex justify-center py-2">
                  <span className="text-xs text-gray-400 bg-gray-200/50 px-3 py-1 rounded-full">
                    {msg.notificationElem?.detail || "[系统通知]"}
                  </span>
                </div>
              );
            }

            const self = isSelf(msg);
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showAvatar = !prevMsg || prevMsg.sendID !== msg.sendID || (prevMsg as any).contentType >= 900;

            return (
              <div
                key={msg.clientMsgID}
                onContextMenu={(e) => { e.preventDefault(); setContextMsg(msg.clientMsgID); }}
                className={`flex items-start gap-2 ${self ? "flex-row-reverse" : "flex-row"} ${showAvatar ? "mt-3" : "mt-0.5"}`}
              >
                <div className="w-9 h-9 flex-shrink-0">
                  {showAvatar && (
                    <img src={getSenderAvatar(msg) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sendID}`} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100" />
                  )}
                </div>

                <div className={`flex flex-col max-w-[60%] ${self ? "items-end" : "items-start"}`}>
                  {showAvatar && isGroup && (
                    <span className="text-xs text-gray-400 mb-1 px-1">{getSenderName(msg)}</span>
                  )}
                  <div className="relative group">
                    {type === MessageType.TextMessage && (
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm break-words ${
                        self ? "bg-primary-500 text-white rounded-tr-md" : "bg-white text-gray-700 rounded-tl-md shadow-sm"
                      }`}>
                        {msg.textElem?.content || ""}
                      </div>
                    )}
                    {type === MessageType.PictureMessage && msg.pictureElem?.sourcePath && (
                      <img src={msg.pictureElem.sourcePath} alt="" className="max-w-[240px] max-h-[200px] rounded-xl object-cover" />
                    )}
                    {type === MessageType.PictureMessage && msg.pictureElem?.snapshotPath && !msg.pictureElem?.sourcePath && (
                      <img src={msg.pictureElem.snapshotPath} alt="" className="max-w-[240px] max-h-[200px] rounded-xl object-cover" />
                    )}

                    {self && type < 900 && (
                      <div className="flex items-center justify-end gap-1 mt-0.5 pr-1">
                        {msg.status === 1 && <span className="text-[10px] text-gray-300">发送中</span>}
                        {msg.status === 2 && <Check size={12} className="text-gray-300" />}
                        {msg.status === 3 && <span className="text-[10px] text-red-400">发送失败</span>}
                      </div>
                    )}

                    {contextMsg === msg.clientMsgID && (
                      <div className="absolute z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-32 text-sm ${self ? 'right-0' : 'left-0'} top-full mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Reply size={12} /> 回复</button>
                        {type === MessageType.TextMessage && (
                          <button onClick={() => { navigator.clipboard?.writeText(msg.textElem?.content || ""); setContextMsg(null); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Copy size={12} /> 复制</button>
                        )}
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Forward size={12} /> 转发</button>
                        {self && (
                          <button onClick={() => { revokeMsg(id!, msg.clientMsgID); setContextMsg(null); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><RotateCcw size={12} /> 撤回</button>
                        )}
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-red-400 flex items-center gap-2"><Trash2 size={12} /> 删除</button>
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
          <button className="text-gray-400 hover:text-primary-500"><Smile size={22} /></button>
          <button className="text-gray-400 hover:text-primary-500"><Paperclip size={22} /></button>
          <button className="text-gray-400 hover:text-primary-500"><Image size={22} /></button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="输入消息..."
            className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200 transition-all"
          />
          <button className="text-gray-400 hover:text-primary-500"><Mic size={22} /></button>
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
