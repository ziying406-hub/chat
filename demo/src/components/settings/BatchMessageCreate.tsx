import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SessionType, type ConversationItem } from "@openim/wasm-client-sdk";
import { useAppStore } from "../../store/app-store";
import { createBatchMessageTask, getBatchMessageTask } from "../../services/batch-message";
import { getIMSDK } from "../../services/openim";

export default function BatchMessageCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversations = useAppStore((state) => state.conversations);
  const userID = useAppStore((state) => state.currentUser?.userID);
  const friends = useAppStore((state) => state.friends);
  const refreshConversations = useAppStore((state) => state.refreshConversations);
  const sourceTask = useMemo(() => {
    const taskID = searchParams.get("task");
    return taskID ? getBatchMessageTask(userID, taskID) : null;
  }, [searchParams, userID]);
  const [content, setContent] = useState(sourceTask?.content || "");
  const [selected, setSelected] = useState<string[]>(sourceTask?.recipients.filter((recipient) => recipient.status === "sent").map((recipient) => recipient.conversationID) || []);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [recipients, setRecipients] = useState<ConversationItem[]>(conversations);

  useEffect(() => {
    let cancelled = false;
    const loadRecipients = async () => {
      const available = new Map(conversations.map((conversation) => [conversation.conversationID, conversation]));
      const knownFriendIDs = new Set(conversations.filter((conversation) => conversation.conversationType === SessionType.Single).map((conversation) => conversation.userID));
      const missingFriends = friends.filter((friend) => !knownFriendIDs.has(friend.userID));
      const im = getIMSDK();
      const resolved = await Promise.all(missingFriends.map(async (friend) => {
        const result = await im.getOneConversation({ sourceID: friend.userID, sessionType: SessionType.Single });
        return result.data;
      }));
      for (const conversation of resolved) if (conversation) available.set(conversation.conversationID, conversation);
      if (!cancelled) setRecipients([...available.values()]);
    };
    loadRecipients().catch(() => { if (!cancelled) setRecipients(conversations); });
    return () => { cancelled = true; };
  }, [conversations, friends]);

  const toggle = (conversationID: string) => {
    setSelected((items) => items.includes(conversationID) ? items.filter((item) => item !== conversationID) : [...items, conversationID]);
  };

  const send = async () => {
    setError("");
    setSending(true);
    try {
      const task = await createBatchMessageTask(userID, content, selected, recipients);
      await refreshConversations();
      navigate(`/settings/messaging/batch/${task.id}`, { replace: true });
    } catch (cause: any) {
      setError(cause?.message || "群发失败");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      <header className="h-16 px-5 bg-white border-b border-gray-100 flex items-center gap-3">
        <button aria-label="返回群发助手" onClick={() => navigate("/settings/messaging/batch")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">新建群发</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-medium text-gray-700">收件人</h3><span className="text-xs text-gray-400">已选择 {selected.length} 位</span></div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {recipients.map((conversation) => (
              <label key={conversation.conversationID} className="flex items-center gap-3 py-3 cursor-pointer">
                <input type="checkbox" checked={selected.includes(conversation.conversationID)} onChange={() => toggle(conversation.conversationID)} className="w-4 h-4 accent-blue-500" />
                <img src={conversation.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conversation.conversationID}`} alt="" className="w-9 h-9 rounded-lg bg-gray-100 object-cover" />
                <span className="flex-1 min-w-0 text-sm text-gray-700 truncate">{conversation.showName || "未知"}</span>
                <span className="text-xs text-gray-400">{conversation.groupID ? "群聊" : "好友"}</span>
              </label>
            ))}
          </div>
        </section>
        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">群发内容</label>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="输入群发内容" maxLength={200} rows={6} className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-primary-400" />
          <p className="mt-1 text-right text-xs text-gray-400">{content.length}/200</p>
        </section>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <div className="bg-white border-t border-gray-100 p-4">
        <button onClick={send} disabled={sending || !content.trim() || selected.length === 0} className="w-full py-3 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{sending ? "发送中..." : "发送"}</button>
      </div>
    </div>
  );
}
