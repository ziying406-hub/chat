import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone, Video, MoreVertical, Smile, Paperclip, Send, Image as ImageIcon, Mic,
  ArrowLeft, RotateCcw, Copy, Trash2, Forward, Reply, Check, CheckCheck,
  Play, Pause, X, Search,
} from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { formatTime } from "../../utils/format";
import { SessionType, MessageType } from "@openim/wasm-client-sdk";
import { startCall } from "../call/CallOverlay";
import MediaViewer from "../chat/media/MediaViewer";

export default function ChatView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const conv = useAppStore((s) => s.conversations.find((c) => c.conversationID === id));
  const messages = useAppStore((s) => (id ? s.messagesMap[id] : undefined)) || [];
  const currentUser = useAppStore((s) => s.currentUser);
  const friends = useAppStore((s) => s.friends);
  const loadMessages = useAppStore((s) => s.loadMessages);
  const sendText = useAppStore((s) => s.sendTextMessage);
  const sendImage = useAppStore((s) => s.sendImageMessage);
  const sendSound = useAppStore((s) => s.sendSoundMessage);
  const markRead = useAppStore((s) => s.markRead);
  const revokeMsg = useAppStore((s) => s.revokeMessage);
  const groupMembers = useAppStore((s) => s.groupMembersMap);
  const loadGroupMembers = useAppStore((s) => s.loadGroupMembers);
  const sendQuote = useAppStore((s) => s.sendQuoteMessage);
  const sendAt = useAppStore((s) => s.sendAtMessage);
  const searchMsgs = useAppStore((s) => s.searchLocalMessages);
  const groups = useAppStore((s) => s.groups);

  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [contextMsg, setContextMsg] = useState<string | null>(null);
  const [mediaViewer, setMediaViewer] = useState<{ idx: number; images: { url: string; name?: string }[] } | null>(null);
  const [recording, setRecording] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [quoteMessage, setQuoteMessage] = useState<any | null>(null);
  const [showMention, setShowMention] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const msgRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (id) { loadMessages(id); markRead(id); }
  }, [id]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (conv?.conversationType === SessionType.Group && conv.groupID && !groupMembers[conv.groupID]) {
      loadGroupMembers(conv.groupID);
    }
  }, [conv?.conversationType, conv?.groupID]);

  if (!conv) return <div className="flex-1 flex items-center justify-center text-gray-300">会话不存在</div>;

  const isGroup = conv.conversationType === SessionType.Group;
  const peerUser = !isGroup ? friends.find((f) => f.userID === conv.userID) : null;

  const handleSend = () => {
    if (!input.trim() || !id) return;
    const text = input.trim();
    if (quoteMessage) {
      sendQuote(id, text, JSON.stringify(quoteMessage));
      setQuoteMessage(null);
    } else if (mentionUsers.length > 0) {
      sendAt(id, text, mentionUsers);
      setMentionUsers([]);
    } else {
      sendText(id, text);
    }
    setInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (isGroup) {
      const lastChar = val[val.length - 1];
      if (lastChar === '@') {
        setShowMention(true);
      } else {
        setShowMention(false);
      }
    }
  };

  const handleMentionSelect = (userID: string, nickname: string, isAll: boolean) => {
    if (isAll) {
      setInput(input + '所有人 ');
      setMentionUsers(['__atAll__']);
    } else {
      setInput(input + nickname + ' ');
      setMentionUsers([...mentionUsers, userID]);
    }
    setShowMention(false);
  };

  const handleSearch = async () => {
    if (!id || !searchKeyword.trim()) return;
    const results = await searchMsgs(id, [searchKeyword.trim()]);
    setSearchResults(results);
  };

  const scrollToMessage = (clientMsgID: string) => {
    const el = msgRefs.current[clientMsgID];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary-400");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary-400"), 1500);
    }
  };

  const canRevoke = (msg: any) => {
    return Date.now() - (msg.sendTime * 1000) < 120000;
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

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  };

  const handleImageSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && id) sendImage(id, file);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        if (id) sendSound(id, file, recDuration);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecDuration(0);
      recTimerRef.current = setInterval(() => setRecDuration((d) => d + 1), 1000);
    } catch (e) { console.error("recording failed:", e); }
  };

  const stopRecording = (send: boolean) => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    if (send) {
      mediaRecorderRef.current?.stop();
    } else {
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    }
    setRecording(false);
    setRecDuration(0);
  };

  const playAudio = (url: string) => {
    if (playingAudio === url) {
      setPlayingAudio(null);
      return;
    }
    const audio = new Audio(url);
    audio.onended = () => setPlayingAudio(null);
    audio.play();
    setPlayingAudio(url);
  };

  // Collect all images for media viewer
  const allImages = messages
    .filter((m: any) => m.contentType === MessageType.PictureMessage)
    .map((m: any) => ({ url: m.pictureElem?.sourcePath || m.pictureElem?.snapshotPath || m.pictureElem?.bigPicture?.url || "", name: m.clientMsgID }))
    .filter((img: any) => img.url);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-5 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/messages")} className="text-gray-400 hover:text-gray-600 md:hidden"><ArrowLeft size={20} /></button>
          <h3 className="text-base font-semibold text-gray-800">{conv.showName || "未知"}</h3>
          {isGroup && groupMembers[conv.groupID] && <span className="text-xs text-gray-400">({groupMembers[conv.groupID].length})</span>}
        </div>
        <div className="flex items-center gap-2 relative">
          {!isGroup && (
            <>
              <button onClick={() => startCall("audio", conv.showName || "", peerUser?.faceURL || conv.faceURL || "")} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"><Phone size={18} /></button>
              <button onClick={() => startCall("video", conv.showName || "", peerUser?.faceURL || conv.faceURL || "")} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"><Video size={18} /></button>
            </>
          )}
          <button onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"><MoreVertical size={18} /></button>
          {showMenu && (
            <div className="absolute right-5 top-14 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-40 text-sm" onClick={() => setShowMenu(false)}>
              <button onClick={() => { setShowSearch(!showSearch); if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 100); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Search size={14} /> 搜索消息</button>
              {!isGroup && <button onClick={() => navigate(`/contact/user/${conv.userID}`)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">查看资料</button>}
              {isGroup && (
                <>
                  <button onClick={() => navigate(`/contact/group/${conv.groupID}`)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">群聊信息</button>
                  <button onClick={() => navigate(`/messages/groups/admin/${conv.groupID}`)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">群管理</button>
                  <button onClick={() => setShowAnnouncement(true)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">群公告</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {/* Search bar */}
      {showSearch && (
        <div className="border-b border-gray-100 bg-white px-4 py-2 flex items-center gap-2">
          <Search size={16} className="text-gray-400" />
          <input
            ref={searchInputRef}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="搜索消息..."
            className="flex-1 px-2 py-1.5 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200"
          />
          <button onClick={handleSearch} className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm">搜索</button>
          <button onClick={() => { setShowSearch(false); setSearchKeyword(""); setSearchResults([]); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      {/* Search results */}
      {showSearch && searchResults.length > 0 && (
        <div className="border-b border-gray-100 bg-gray-50 max-h-60 overflow-y-auto">
          {searchResults.map((msg: any) => (
            <button
              key={msg.clientMsgID}
              onClick={() => { scrollToMessage(msg.clientMsgID); setShowSearch(false); setSearchResults([]); }}
              className="w-full px-4 py-2 text-left hover:bg-white border-b border-gray-100 last:border-0"
            >
              <div className="text-sm text-gray-600 truncate">{msg.textElem?.content || "[非文本消息]"}</div>
              <div className="text-xs text-gray-400">{formatTime(msg.sendTime)}</div>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-bg px-5 py-4">
        <div className="space-y-1">
          {messages.length === 0 && <div className="flex justify-center py-20 text-gray-300 text-sm">暂无消息，发送第一条消息吧</div>}
          {messages.map((msg: any, idx: number) => {
            const type = msg.contentType;
            if (type === MessageType.NotificationMessage || type >= 900) {
              return <div key={msg.clientMsgID} className="flex justify-center py-2"><span className="text-xs text-gray-400 bg-gray-200/50 px-3 py-1 rounded-full">{msg.notificationElem?.detail || "[系统通知]"}</span></div>;
            }
            const self = isSelf(msg);
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showAvatar = !prevMsg || prevMsg.sendID !== msg.sendID || (prevMsg as any).contentType >= 900;

            return (
              <div key={msg.clientMsgID} ref={(el) => { msgRefs.current[msg.clientMsgID] = el; }} onContextMenu={(e) => { e.preventDefault(); setContextMsg(msg.clientMsgID); }} className={`flex items-start gap-2 ${self ? "flex-row-reverse" : "flex-row"} ${showAvatar ? "mt-3" : "mt-0.5"}`}>
                <div className="w-9 h-9 flex-shrink-0">
                  {showAvatar && <img src={getSenderAvatar(msg) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sendID}`} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100" />}
                </div>
                <div className={`flex flex-col max-w-[60%] ${self ? "items-end" : "items-start"}`}>
                  {showAvatar && isGroup && <span className="text-xs text-gray-400 mb-1 px-1">{getSenderName(msg)}</span>}
                  <div className="relative group">
                    {/* Text */}
                    {type === MessageType.TextMessage && (
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm break-words ${self ? "bg-primary-500 text-white rounded-tr-md" : "bg-white text-gray-700 rounded-tl-md shadow-sm"}`}>{msg.textElem?.content || ""}</div>
                    )}
                    {/* Image */}
                    {type === MessageType.PictureMessage && (() => {
                      const pic = msg.pictureElem;
                      const imgUrl = pic?.sourcePath || pic?.snapshotPath || pic?.bigPicture?.url || "";
                      if (!imgUrl) return <div className="px-3 py-2 bg-gray-100 rounded-xl text-xs text-gray-400">图片加载中...</div>;
                      return (
                        <img
                          src={imgUrl}
                          alt=""
                          className="max-w-[240px] max-h-[200px] rounded-xl cursor-pointer object-cover"
                          onClick={() => {
                            const imgIdx = allImages.findIndex((i: any) => i.url === imgUrl);
                            setMediaViewer({ idx: imgIdx >= 0 ? imgIdx : 0, images: allImages });
                          }}
                        />
                      );
                    })()}
                    {/* Audio */}
                    {type === MessageType.VoiceMessage && (() => {
                      const sound = msg.soundElem;
                      const url = sound?.sourceUrl || "";
                      return (
                        <button
                          onClick={() => url && playAudio(url)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl ${self ? "bg-primary-500 text-white rounded-tr-md" : "bg-white text-gray-700 rounded-tl-md shadow-sm"}`}
                        >
                          {playingAudio === url ? <Pause size={16} /> : <Play size={16} />}
                          <span className="text-sm">{sound?.duration || 0}"</span>
                        </button>
                      );
                    })()}

                    {/* Status */}
                    {self && type < 900 && (
                      <div className="flex items-center justify-end gap-1 mt-0.5 pr-1">
                        {msg.status === 1 && <span className="text-[10px] text-gray-300">发送中</span>}
                        {msg.status === 2 && (msg.isRead
                          ? <CheckCheck size={14} className="text-primary-500" />
                          : <Check size={12} className="text-gray-300" />)}
                        {msg.status === 3 && <span className="text-[10px] text-red-400">发送失败</span>}
                      </div>
                    )}

                    {/* Context menu */}
                    {contextMsg === msg.clientMsgID && (
                      <div className={`absolute z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-32 text-sm ${self ? "right-0" : "left-0"} top-full mt-1`} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setQuoteMessage(msg); setContextMsg(null); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Reply size={12} /> 回复</button>
                        {type === MessageType.TextMessage && <button onClick={() => { navigator.clipboard?.writeText(msg.textElem?.content || ""); setContextMsg(null); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Copy size={12} /> 复制</button>}
                        <button className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Forward size={12} /> 转发</button>
                        {self && canRevoke(msg) && <button onClick={() => { revokeMsg(id!, msg.clientMsgID); setContextMsg(null); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><RotateCcw size={12} /> 撤回</button>}
                        {self && !canRevoke(msg) && <button onClick={() => { setContextMsg(null); showToast("超过2分钟无法撤回"); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-300 flex items-center gap-2"><RotateCcw size={12} /> 撤回</button>}
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

      {/* Reply preview */}
      {quoteMessage && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 flex items-center gap-2">
          <Reply size={14} className="text-primary-500 flex-shrink-0" />
          <div className="flex-1 text-sm text-gray-500 truncate">
            <span className="text-gray-400">回复: </span>{quoteMessage.textElem?.content || "[非文本消息]"}
          </div>
          <button onClick={() => setQuoteMessage(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={16} /></button>
        </div>
      )}

      {/* Mention dropdown */}
      {showMention && isGroup && (
        <div className="absolute bottom-16 left-0 right-0 z-50 bg-white rounded-t-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto">
          <button onClick={() => handleMentionSelect("", "所有人", true)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm text-gray-600 border-b border-gray-100 font-medium">@所有人</button>
          {(groupMembers[conv.groupID] || []).map((m) => (
            <button key={m.userID} onClick={() => handleMentionSelect(m.userID, m.nickname || m.userID, false)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm text-gray-600 flex items-center gap-2">
              <img src={m.faceURL || ''} alt="" className="w-6 h-6 rounded-full bg-gray-100" />
              <span>{m.nickname || m.userID}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 relative">
        {recording ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-500">录音中... {recDuration}"</span>
            </div>
            <button onClick={() => stopRecording(false)} className="w-9 h-9 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center"><X size={18} /></button>
            <button onClick={() => stopRecording(true)} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm">发送</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-primary-500"><Smile size={22} /></button>
            <button className="text-gray-400 hover:text-primary-500"><Paperclip size={22} /></button>
            <button onClick={handleImageSelect} className="text-gray-400 hover:text-primary-500"><ImageIcon size={22} /></button>
            <input value={input} onChange={handleInputChange} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="输入消息..." className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200 transition-all" />
            <button onClick={startRecording} className="text-gray-400 hover:text-primary-500"><Mic size={22} /></button>
            <button onClick={handleSend} disabled={!input.trim()} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${input.trim() ? "bg-primary-500 text-white hover:bg-primary-600" : "bg-gray-100 text-gray-300"}`}><Send size={18} /></button>
          </div>
        )}
      </div>

      {/* Group announcement modal */}
      {showAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAnnouncement(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-80 max-w-[90%] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800">群公告</h3>
              <button onClick={() => setShowAnnouncement(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {groups.find((g) => g.groupID === conv.groupID)?.notification || "暂无群公告"}
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Media viewer */}
      {mediaViewer && <MediaViewer images={mediaViewer.images} index={mediaViewer.idx} onClose={() => setMediaViewer(null)} />}
    </div>
  );
}
