import { Fragment, useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Video, MoreVertical, Smile, Paperclip, Send, Image as ImageIcon, Mic,
  ArrowLeft, RotateCcw, Copy, Forward, Reply, Check, CheckCheck,
  Play, Pause, X, Search, Contact, UserPlus, BellOff, Star,
  Camera, MapPin, Settings, CheckSquare, Square,
} from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { formatMessageDate, formatTime, formatVoiceDuration, isSameCalendarDay } from "../../utils/format";
import { getFavoritesStorageKey } from "../../utils/favorites";
import { createCollectionItem } from "../../utils/collections";
import { getUserStorageKey } from "../../utils/storage";
import { saveFavorite } from "../../services/openim";
import { SessionType, MessageType } from "@openim/wasm-client-sdk";
import MediaViewer from "../chat/media/MediaViewer";
import EmojiPicker from "./EmojiPicker";
import { groupPermissions } from "../../utils/group-permissions";

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
  const sendFile = useAppStore((s) => s.sendFileMessage);
  const sendVideo = useAppStore((s) => s.sendVideoMessage);
  const sendLocation = useAppStore((s) => s.sendLocationMessage);
  const forwardMsg = useAppStore((s) => s.forwardMessage);
  const forwardMergedMessages = useAppStore((s) => s.forwardMergedMessages);
  const markRead = useAppStore((s) => s.markRead);
  const deleteMessagesFromLocalStorage = useAppStore((s) => s.deleteMessagesFromLocalStorage);
  const revokeMsg = useAppStore((s) => s.revokeMessage);
  const groupMembers = useAppStore((s) => s.groupMembersMap);
  const loadGroupMembers = useAppStore((s) => s.loadGroupMembers);
  const sendQuote = useAppStore((s) => s.sendQuoteMessage);
  const sendAt = useAppStore((s) => s.sendAtMessage);
  const searchMsgs = useAppStore((s) => s.searchLocalMessages);
  const groups = useAppStore((s) => s.groups);
  const sendContactCard = useAppStore((s) => s.sendContactCard);
  const inviteToGroup = useAppStore((s) => s.inviteToGroup);
  const muteConversation = useAppStore((s) => s.muteConversation);
  const conversations = useAppStore((s) => s.conversations);
  const drafts = useAppStore((s) => s.drafts);
  const setDraft = useAppStore((s) => s.setDraft);
  const clearDraft = useAppStore((s) => s.clearDraft);
  const favoritesKey = currentUser ? getFavoritesStorageKey(currentUser.userID) : null;
  const chatToken = useAppStore((s) => s.authData?.chatToken);

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
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [forwardMsgData, setForwardMsgData] = useState<any | null>(null);
  const [forwardMergeData, setForwardMergeData] = useState<any[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState("");
  const [recPulse, setRecPulse] = useState(0);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const docFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const msgRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recPulseRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (id) {
      loadMessages(id);
      markRead(id);
      setInput(drafts[id] || "");
    }
    return () => {
      if (id && input.trim()) setDraft(id, input.trim());
    };
  }, [id]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (conv?.conversationType === SessionType.Group && conv.groupID && !groupMembers[conv.groupID]) {
      loadGroupMembers(conv.groupID);
    }
  }, [conv?.conversationType, conv?.groupID]);

  const group = groups.find((item) => item.groupID === conv?.groupID);
  const { canInvite } = groupPermissions(group?.ownerUserID, currentUser?.userID, groupMembers[group?.groupID || ""] || []);
  const groupAnnouncement = group?.notification?.trim() || "";
  const announcementStorageKey = currentUser && conv?.groupID
    ? getUserStorageKey(`99chat_hidden_group_announcement_${conv.groupID}`, currentUser.userID)
    : "";

  useEffect(() => {
    if (!announcementStorageKey) {
      setDismissedAnnouncement("");
      return;
    }
    setDismissedAnnouncement(localStorage.getItem(announcementStorageKey) || "");
  }, [announcementStorageKey]);

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
    if (id) clearDraft(id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (id) { if (val.trim()) setDraft(id, val.trim()); else clearDraft(id); }
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

  const handleEmojiPick = (emoji: string) => {
    setInput(input + emoji);
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
    return Date.now() - msg.sendTime < 120000;
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

  const handleImageSelect = () => imageFileRef.current?.click();
  const handleFileSelect = () => docFileRef.current?.click();
  const handleVideoSelect = () => videoFileRef.current?.click();

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && id) sendFile(id, file);
    e.target.value = "";
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && id) sendVideo(id, file, 0);
    e.target.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && id) sendImage(id, file);
    e.target.value = "";
  };

  const handleLocation = () => {
    if (!id) return;
    if (!navigator.geolocation) {
      showToast("当前浏览器不支持定位");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await sendLocation(id, coords.latitude, coords.longitude, "我的位置");
          setShowAttachMenu(false);
        } catch {
          showToast("位置发送失败");
        }
      },
      () => showToast("无法获取位置，请检查定位权限"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();
      const canvas = document.createElement("canvas");
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      canvas.width = settings.width || 640;
      canvas.height = settings.height || 480;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach((t) => t.stop());
      canvas.toBlob((blob) => {
        if (blob && id) {
          const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
          sendImage(id, file);
        }
      }, "image/jpeg", 0.9);
    } catch (e) { console.error("camera failed:", e); showToast("无法访问摄像头"); }
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
      setRecPulse(0);
      recTimerRef.current = setInterval(() => setRecDuration((d) => d + 1), 1000);
      recPulseRef.current = setInterval(() => setRecPulse((p) => (p + 1) % 4), 300);
    } catch (e) { console.error("recording failed:", e); }
  };

  const stopRecording = (send: boolean) => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    if (recPulseRef.current) clearInterval(recPulseRef.current);
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

  const toggleSelect = (clientMsgID: string) => {
    setSelectedMsgs((prev) => {
      const next = new Set(prev);
      if (next.has(clientMsgID)) next.delete(clientMsgID);
      else next.add(clientMsgID);
      return next;
    });
  };

  const handleBatchForward = () => {
    const msgs = messages.filter((m: any) => selectedMsgs.has(m.clientMsgID));
    if (msgs.length === 1) {
      setForwardMsgData(msgs[0]);
      setForwardMergeData(null);
      setShowForward(true);
    } else if (msgs.length > 1) {
      setForwardMsgData(null);
      setForwardMergeData(msgs);
      setShowForward(true);
    }
    setMultiSelect(false);
    setSelectedMsgs(new Set());
  };

  const handleBatchDelete = async () => {
    if (!id || selectedMsgs.size === 0) return;
    try {
      await deleteMessagesFromLocalStorage(id, [...selectedMsgs]);
      showToast("已从本机删除选中消息");
    } catch {
      showToast("删除消息失败");
    } finally {
      setSelectedMsgs(new Set());
      setMultiSelect(false);
    }
  };

  // Collect all images for media viewer
  const allImages = messages
    .filter((m: any) => m.contentType === MessageType.PictureMessage)
    .map((m: any) => ({ url: m.pictureElem?.sourcePicture?.url || m.pictureElem?.bigPicture?.url || m.pictureElem?.snapshotPicture?.url || m.pictureElem?.sourcePath || "", name: m.clientMsgID }))
    .filter((img: any) => img.url);

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full">
      {/* Header */}
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-5 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/messages")} className="text-gray-400 hover:text-gray-600 md:hidden"><ArrowLeft size={20} /></button>
          <h3 className="text-base font-semibold text-gray-800">{conv.showName || "未知"}</h3>
          {isGroup && groupMembers[conv.groupID] && <span className="text-xs text-gray-400">({groupMembers[conv.groupID].length})</span>}
        </div>
        <div className="flex items-center gap-2 relative">
          <button aria-label="更多聊天操作" onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"><MoreVertical size={18} /></button>
          <button aria-label="聊天设置" onClick={() => navigate(`/messages/session/${id}/settings`)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"><Settings size={18} /></button>
          {showMenu && (
            <div className="absolute right-5 top-14 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-40 text-sm" onClick={() => setShowMenu(false)}>
              <button onClick={() => { setShowSearch(!showSearch); if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 100); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Search size={14} /> 搜索消息</button>
              <button onClick={() => { setMultiSelect(!multiSelect); if (!multiSelect) setSelectedMsgs(new Set()); setShowMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><CheckSquare size={14} /> {multiSelect ? "退出多选" : "多选"}</button>
              {!isGroup && <button onClick={() => navigate(`/contact/user/${conv.userID}`)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">查看资料</button>}
              {isGroup && (
                <>
                  <button onClick={() => navigate(`/contact/group/${conv.groupID}`)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">群聊信息</button>
                  <button onClick={() => navigate(`/messages/groups/admin/${conv.groupID}`)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">群管理</button>
                  <button onClick={() => setShowAnnouncement(true)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600">群公告</button>
                  {canInvite && <button onClick={() => setShowInvite(true)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><UserPlus size={14} /> 邀请好友</button>}
                  <button onClick={() => muteConversation(id!, conv.recvMsgOpt === 0 ? 2 : 0)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><BellOff size={14} /> {conv.recvMsgOpt === 0 ? "消息免打扰" : "解除免打扰"}</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {isGroup && groupAnnouncement && dismissedAnnouncement !== groupAnnouncement && (
        <div data-group-announcement className="flex min-w-0 max-w-full items-center gap-3 overflow-hidden border-b border-amber-100 bg-amber-50 px-5 py-2.5 text-sm">
          <button onClick={() => setShowAnnouncement(true)} className="flex h-6 min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap text-left text-amber-900">
            <span className="mr-2 flex-shrink-0 font-medium">群公告</span>
            <span className="min-w-0 flex-1 truncate text-amber-800">{groupAnnouncement}</span>
          </button>
          <button
            onClick={() => {
              if (announcementStorageKey) localStorage.setItem(announcementStorageKey, groupAnnouncement);
              setDismissedAnnouncement(groupAnnouncement);
            }}
            className="flex-shrink-0 text-xs text-amber-700 hover:text-amber-900"
          >
            不再显示
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={imageFileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <input ref={docFileRef} type="file" onChange={handleDocFileChange} className="hidden" />
      <input ref={videoFileRef} type="file" accept="video/*" onChange={handleVideoFileChange} className="hidden" />

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

      {multiSelect && (
        <div className="border-b border-gray-100 bg-primary-50 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-primary-600">已选择 {selectedMsgs.size} 条</span>
          <div className="flex items-center gap-2">
            <button onClick={handleBatchForward} disabled={selectedMsgs.size === 0} className="px-3 py-1.5 bg-white text-primary-500 rounded-lg text-sm hover:bg-primary-100 disabled:opacity-40">转发</button>
            <button onClick={handleBatchDelete} disabled={selectedMsgs.size === 0} className="px-3 py-1.5 bg-white text-red-500 rounded-lg text-sm hover:bg-red-50 disabled:opacity-40">删除</button>
            <button onClick={() => { setMultiSelect(false); setSelectedMsgs(new Set()); }} className="px-3 py-1.5 bg-white text-gray-500 rounded-lg text-sm hover:bg-gray-100">取消</button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-bg px-5 py-4">
        <div className="space-y-1">
          {messages.length === 0 && <div className="flex justify-center py-20 text-gray-300 text-sm">暂无消息，发送第一条消息吧</div>}
          {messages.map((msg: any, idx: number) => {
            const type = msg.contentType;
            const previousMsg = idx > 0 ? messages[idx - 1] : null;
            const showDateDivider = !previousMsg || !isSameCalendarDay(previousMsg.sendTime, msg.sendTime);
            const dateDivider = showDateDivider && (
              <div data-message-date-divider className="flex justify-center py-3">
                <span className="text-xs text-gray-400">{formatMessageDate(msg.sendTime)}</span>
              </div>
            );
            // System notification messages (FriendAdded=1201, GroupCreated=1501, etc.)
            if (type >= 1000 && type !== MessageType.CustomMessage) {
              // Parse notification detail for friendly display
              let displayText = '[系统通知]';
              if (type === 1201) displayText = '你们已成为好友';
              else if (type === 1501) displayText = '群组已创建';
              else if (type === 1502) displayText = '群信息已更新';
              else if (type === 1504) displayText = '有成员退出群组';
              else if (type === 1507) displayText = '群主已转让';
              else if (type === 1508) displayText = '有成员被移出';
              else if (type === 1509) displayText = '有成员被邀请加入';
              else if (type === 1510) displayText = '有成员加入群组';
              else if (type === 1511) displayText = '群组已解散';
              else if (type === 1512) displayText = '有成员被禁言';
              else if (type === 1513) displayText = '有成员被解除禁言';
              else if (type === 1514) displayText = '群组已被禁言';
              else if (type === 1515) displayText = '群组已被解除禁言';
              else if (type === 1519) displayText = '群公告已更新';
              else if (type === 1520) displayText = '群名称已更新';
              else if (type === 2101) displayText = '消息已撤回';
              else if (msg.notificationElem?.detail) {
                try { displayText = JSON.parse(msg.notificationElem.detail).op || displayText; } catch {}
              }
              return <Fragment key={msg.clientMsgID}>{dateDivider}<div className='flex justify-center py-2'><span className='text-xs text-gray-400 bg-gray-200/50 px-3 py-1 rounded-full'>{displayText}</span></div></Fragment>;
            }
            const self = isSelf(msg);
            const showAvatar = !previousMsg || previousMsg.sendID !== msg.sendID || (previousMsg as any).contentType >= 1000;

            return (
              <Fragment key={msg.clientMsgID}>
              {dateDivider}
              <div ref={(el) => { msgRefs.current[msg.clientMsgID] = el; }} onContextMenu={(e) => { e.preventDefault(); if (!multiSelect) setContextMsg(msg.clientMsgID); }} className={`flex items-start gap-2 ${self ? "flex-row-reverse" : "flex-row"} ${showAvatar ? "mt-3" : "mt-0.5"}`}>
                {multiSelect && (
                  <button aria-label={`选择消息 ${msg.clientMsgID}`} onClick={() => toggleSelect(msg.clientMsgID)} className="flex-shrink-0 mt-1">
                    {selectedMsgs.has(msg.clientMsgID)
                      ? <CheckSquare size={20} className="text-primary-500" />
                      : <Square size={20} className="text-gray-300" />}
                  </button>
                )}
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
                    {/* @ mention message */}
                    {type === MessageType.AtTextMessage && <div data-message-type="at-text" className={`px-3.5 py-2.5 rounded-2xl text-sm break-words ${self ? "bg-primary-500 text-white rounded-tr-md" : "bg-white text-gray-700 rounded-tl-md shadow-sm"}`}>{msg.atTextElem?.text || ""}</div>}

                    {/* Image */}
                    {type === MessageType.PictureMessage && (() => {
                      const pic = msg.pictureElem;
                      const imgUrl = pic?.sourcePicture?.url || pic?.bigPicture?.url || pic?.snapshotPicture?.url || pic?.sourcePath || "";
                      if (!imgUrl) return <div className="px-3 py-2 bg-gray-100 rounded-xl text-xs text-gray-400">图片加载中...</div>;
                      return (
                        <img
                          data-message-type="image"
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
                      const duration = formatVoiceDuration(sound?.duration);
                      return (
                        <button
                          onClick={() => url && playAudio(url)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl ${self ? "bg-primary-500 text-white rounded-tr-md" : "bg-white text-gray-700 rounded-tl-md shadow-sm"}`}
                        >
                          {playingAudio === url ? <Pause size={16} /> : <Play size={16} />}
                          {duration && <span className="text-sm">{duration}</span>}
                        </button>
                      );
                    })()}

                    {/* Quote message */}
                    {type === MessageType.QuoteMessage && (() => {
                      const quote = msg.quoteElem;
                      const original = quote?.quoteMessage;
                      const originalText = original?.textElem?.content || original?.faceElem?.data || original?.fileElem?.fileName || "[消息]";
                      return <div data-message-type="quote" className={`min-w-[180px] px-3.5 py-2.5 rounded-2xl text-sm ${self ? "bg-primary-500 text-white rounded-tr-md" : "bg-white text-gray-700 rounded-tl-md shadow-sm"}`}><p>{quote?.text || ""}</p><div className={`mt-2 border-l-2 pl-2 text-xs opacity-75 ${self ? "border-white/50" : "border-gray-300"}`}>{originalText}</div></div>;
                    })()}

                    {/* Contact card */}
                    {type === MessageType.CustomMessage && msg.customElem?.extension === "contactCard" && (() => {
                      const card = JSON.parse(msg.customElem?.data || "{}");
                      return (
                        <div data-message-type="contact-card" className={`px-3 py-2.5 rounded-2xl ${self ? "bg-primary-500 text-white rounded-tr-md" : "bg-white text-gray-700 rounded-tl-md shadow-sm"}`}>
                          <div className="flex items-center gap-2 min-w-[200px]">
                            <img src={card.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${card.userID}`} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/20" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{card.nickname || card.userID}</p>
                              <p className="text-xs opacity-70 truncate">名片</p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/contact/user/${card.userID}`)}
                            className={`mt-2 w-full py-1.5 rounded-lg text-xs font-medium ${self ? "bg-white/20 text-white" : "bg-primary-50 text-primary-500"}`}
                          >
                            查看资料
                          </button>
                        </div>
                      );
                    })()}

                    {/* Emoticon (custom message) */}
                    {type === MessageType.CustomMessage && msg.customElem?.extension === "emoticon" && (() => {
                      try {
                        const parsed = JSON.parse(msg.customElem?.data || "{}");
                        if (parsed.emoji) return <div className="px-2 py-1 text-3xl">{parsed.emoji}</div>;
                      } catch {}
                      return <div className="px-3.5 py-2.5 rounded-2xl text-sm bg-gray-100 text-gray-500">{msg.customElem?.description || "[自定义消息]"}</div>;
                    })()}
                    {/* Other custom messages */}
                    {type === MessageType.CustomMessage && msg.customElem?.extension !== "emoticon" && msg.customElem?.extension !== "contactCard" && (
                      <div className="px-3.5 py-2.5 rounded-2xl text-sm bg-gray-100 text-gray-500">{msg.customElem?.description || "[自定义消息]"}</div>
                    )}


                    {/* File */}
                    {type === MessageType.FileMessage && (() => {
                      const fileElem = msg.fileElem;
                      const url = fileElem?.sourceUrl || fileElem?.filePath;
                      const content = <><Paperclip size={18} /><div><p className="text-sm font-medium">{fileElem?.fileName || "文件"}</p><p className="text-xs opacity-60">{fileElem ? Math.round((fileElem.fileSize || 0) / 1024) + "KB" : ""}</p></div></>;
                      const className = `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl ${self ? "bg-primary-500 text-white rounded-tr-md" : "bg-white text-gray-700 rounded-tl-md shadow-sm"}`;
                      return url ? <a data-message-type="file" href={url} download={fileElem?.fileName || ""} className={className}>{content}</a> : <div data-message-type="file" className={className}>{content}</div>;
                    })()}
                    {/* Merge message */}
                    {type === MessageType.MergeMessage && (() => {
                      const merged = msg.mergeElem;
                      return <div className={`min-w-[220px] px-3.5 py-2.5 rounded-2xl text-sm ${self ? "bg-primary-500 text-white rounded-tr-md" : "bg-white text-gray-700 rounded-tl-md shadow-sm"}`}><p className="font-medium">{merged?.title || "聊天记录"}</p><div className="mt-2 space-y-1 text-xs opacity-80">{(merged?.abstractList || []).slice(0, 4).map((summary: string, index: number) => <p key={index} className="truncate">{summary}</p>)}</div></div>;
                    })()}
                    {/* Face message */}
                    {type === MessageType.FaceMessage && (msg.faceElem?.data?.startsWith("http")
                      ? <div data-message-type="face" className="p-1"><img src={msg.faceElem.data} alt="表情" className="w-20 h-20 object-contain" /></div>
                      : <div data-message-type="face" className="px-2 py-1 text-3xl">{msg.faceElem?.data || "🙂"}</div>)}
                    {/* Location */}
                    {type === MessageType.LocationMessage && (() => {
                      const location = msg.locationElem;
                      const href = `https://www.google.com/maps?q=${location?.latitude},${location?.longitude}`;
                      return <a href={href} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-sm ${self ? "bg-primary-500 text-white rounded-tr-md" : "bg-white text-gray-700 rounded-tl-md shadow-sm"}`}><MapPin size={17} /><span>{location?.description || "我的位置"}</span></a>;
                    })()}
                    {/* Video */}
                    {type === MessageType.VideoMessage && (() => {
                      const video = msg.videoElem;
                      const src = video?.videoUrl || video?.videoPath || "";
                      if (!src) return <div className="px-3 py-2 bg-gray-100 rounded-xl text-xs text-gray-400">视频加载中...</div>;
                      return <video controls preload="metadata" poster={video?.snapshotUrl || video?.snapshotPath || undefined} className="max-w-[320px] max-h-[240px] rounded-xl bg-black"><source src={src} type={video?.videoType || "video/mp4"} /></video>;
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
                    <div className="mt-1 px-1 text-[10px] text-gray-400">{formatTime(msg.sendTime)}</div>

                    {/* Context menu */}
                    {contextMsg === msg.clientMsgID && (
                      <div className={`absolute z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-32 text-sm ${self ? "right-0" : "left-0"} top-full mt-1`} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setQuoteMessage(msg); setContextMsg(null); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Reply size={12} /> 回复</button>
                        {type === MessageType.TextMessage && <button onClick={() => { navigator.clipboard?.writeText(msg.textElem?.content || ""); setContextMsg(null); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Copy size={12} /> 复制</button>}
                        <button onClick={() => { setForwardMsgData(msg); setShowForward(true); setContextMsg(null); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Forward size={12} /> 转发</button>
                        <button onClick={async () => {
                          if (!favoritesKey) return;
                          const favorite = createCollectionItem(msg, getSenderName(msg));
                          try {
                            const raw = localStorage.getItem(favoritesKey);
                            const favs = raw ? JSON.parse(raw) : [];
                            favs.push(favorite);
                            localStorage.setItem(favoritesKey, JSON.stringify(favs));
                          } catch {}
                          try {
                            if (!chatToken) throw new Error("token unavailable");
                            await saveFavorite(chatToken, favorite);
                            showToast("已收藏");
                          } catch { showToast("收藏仅保存在本机，服务端暂不可用"); }
                          setContextMsg(null);
                        }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Star size={12} /> 收藏</button>
                        {self && canRevoke(msg) && <button onClick={async () => { try { await revokeMsg(id!, msg.clientMsgID); } catch { showToast("撤回失败"); } finally { setContextMsg(null); } }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><RotateCcw size={12} /> 撤回</button>}
                        {self && !canRevoke(msg) && <button onClick={() => { setContextMsg(null); showToast("超过2分钟无法撤回"); }} className="w-full px-3 py-1.5 text-left hover:bg-gray-50 text-gray-300 flex items-center gap-2"><RotateCcw size={12} /> 撤回</button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </Fragment>
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

      {/* Emoji picker */}
      {showEmoji && (
        <EmojiPicker
          onPick={handleEmojiPick}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {/* Input bar */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 relative">
        {recording ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-1 bg-red-500 rounded-full transition-all" style={{ height: `${8 + (recPulse === i ? 12 : 0) + (recPulse === (i + 1) % 5 ? 6 : 0)}px` }} />
                ))}
              </div>
              <span className="text-sm text-gray-500">{recDuration}"</span>
              <span className="text-xs text-gray-300 ml-2">滑动取消</span>
            </div>
            <button onClick={() => stopRecording(false)} className="w-9 h-9 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-400" title="取消"><X size={18} /></button>
            <button onClick={() => stopRecording(true)} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600">发送</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button aria-label="表情" onClick={() => setShowEmoji(!showEmoji)} className={`hover:text-primary-500 ${showEmoji ? "text-primary-500" : "text-gray-400"}`}><Smile size={22} /></button>
            <button aria-label="附件" onClick={() => setShowAttachMenu(!showAttachMenu)} className="text-gray-400 hover:text-primary-500 relative"><Paperclip size={22} /></button>
            {showAttachMenu && (
              <div className="absolute bottom-12 left-8 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-32 text-sm" onClick={() => setShowAttachMenu(false)}>
                <button onClick={handleFileSelect} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Paperclip size={14} /> 文件</button>
                <button onClick={handleImageSelect} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><ImageIcon size={14} /> 图片</button>
                <button onClick={handleVideoSelect} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Video size={14} /> 视频</button>
                <button onClick={handleCamera} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Camera size={14} /> 拍照</button>
                <button onClick={handleLocation} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><MapPin size={14} /> 发送位置</button>
                <button onClick={() => { setShowFavorites(true); setShowAttachMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Star size={14} /> 收藏</button>
                <button onClick={() => setShowContactPicker(true)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-600 flex items-center gap-2"><Contact size={14} /> 发送名片</button>
              </div>
            )}
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
              {groupAnnouncement || "暂无群公告"}
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

      {/* Contact card picker modal */}
      {showContactPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowContactPicker(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-80 max-w-[90%] max-h-[60vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">发送名片</h3>
              <button onClick={() => setShowContactPicker(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {friends.length === 0 && <div className="flex items-center justify-center py-10 text-gray-300 text-sm">暂无好友</div>}
              {friends.map((f) => (
                <button
                  key={f.userID}
                  aria-label={`发送 ${f.nickname || f.userID} 的名片`}
                  onClick={async () => {
                    if (!id) return;
                    try {
                      await sendContactCard(id, f.userID, f.nickname || f.userID, f.faceURL || "");
                      setShowContactPicker(false);
                      setShowAttachMenu(false);
                    } catch {
                      showToast("发送名片失败");
                    }
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <img src={f.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.userID}`} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">{f.remark || f.nickname || f.userID}</p>
                    <p className="text-xs text-gray-400">ID: {f.userID}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invite friends modal */}
      {showInvite && isGroup && canInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-80 max-w-[90%] max-h-[60vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">邀请好友进群</h3>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(() => {
                const memberIDs = new Set((groupMembers[conv.groupID] || []).map((m) => m.userID));
                const candidates = friends.filter((f) => !memberIDs.has(f.userID));
                if (candidates.length === 0) return <div className="flex items-center justify-center py-10 text-gray-300 text-sm">暂无可邀请的好友</div>;
                return candidates.map((f) => (
                  <button
                    key={f.userID}
                    onClick={async () => {
                      try {
                        await inviteToGroup(conv.groupID, [f.userID], "邀请加入群组");
                        setShowInvite(false);
                        showToast("邀请已发送");
                      } catch {
                        showToast("邀请失败");
                      }
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <img src={f.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.userID}`} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-700">{f.remark || f.nickname || f.userID}</p>
                      <p className="text-xs text-gray-400">ID: {f.userID}</p>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Forward modal */}
      {showForward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowForward(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-80 max-w-[90%] max-h-[60vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">{forwardMergeData ? "合并转发" : "转发到"}</h3>
              <button onClick={() => setShowForward(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.filter((c) => c.conversationID !== id).length === 0 && <div className="flex items-center justify-center py-10 text-gray-300 text-sm">没有其他会话</div>}
              {conversations.filter((c) => c.conversationID !== id).map((c) => (
                <button
                  key={c.conversationID}
                  onClick={async () => {
                    try {
                      if (forwardMergeData) await forwardMergedMessages(c.conversationID, forwardMergeData);
                      else await forwardMsg(c.conversationID, forwardMsgData);
                      showToast("转发成功");
                    } catch {
                      showToast("转发失败");
                    }
                    setShowForward(false);
                    setForwardMsgData(null);
                    setForwardMergeData(null);
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <img src={c.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.conversationID}`} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                  <span className="text-sm font-medium text-gray-700">{c.showName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Favorites modal */}
      {showFavorites && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowFavorites(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-80 max-w-[90%] max-h-[60vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">收藏</h3>
              <button onClick={() => setShowFavorites(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(() => {
                try {
                  if (!favoritesKey) return <div className="flex items-center justify-center py-10 text-gray-300 text-sm">暂无收藏</div>;
                  const raw = localStorage.getItem(favoritesKey);
                  const favs = raw ? JSON.parse(raw) : [];
                  if (favs.length === 0) return <div className="flex items-center justify-center py-10 text-gray-300 text-sm">暂无收藏</div>;
                  return favs.map((f: any) => (
                    <div key={f.clientMsgID} className="px-5 py-3 border-b border-gray-100">
                      <div className="text-sm text-gray-600">{f.content || "[非文本消息]"}</div>
                      <div className="text-xs text-gray-400 mt-1">{formatTime(Math.floor(f.time / 1000))}</div>
                    </div>
                  ));
                } catch { return <div className="flex items-center justify-center py-10 text-gray-300 text-sm">暂无收藏</div>; }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Media viewer */}
      {mediaViewer && <MediaViewer images={mediaViewer.images} index={mediaViewer.idx} onClose={() => setMediaViewer(null)} />}
    </div>
  );
}
