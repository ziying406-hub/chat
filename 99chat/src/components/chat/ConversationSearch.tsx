import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { formatTime } from "../../utils/format";

export default function ConversationSearch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const searchLocalMessages = useAppStore((s) => s.searchLocalMessages);
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!id || !keyword.trim()) return;
    setResults(await searchLocalMessages(id, [keyword.trim()]));
    setSearched(true);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
      <header className="h-16 px-5 bg-white border-b border-gray-100 flex items-center gap-3">
        <button aria-label="返回聊天设置" onClick={() => navigate(`/messages/session/${id}/settings`)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">搜索聊天记录</h2>
      </header>
      <div className="p-4 bg-white border-b border-gray-100 flex gap-2">
        <input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && search()} placeholder="搜索聊天记录" className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-200" />
        <button onClick={search} disabled={!keyword.trim()} className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"><Search size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {searched && results.length === 0 && <div className="flex justify-center py-20 text-sm text-gray-300">未找到相关消息</div>}
        {results.map((message: any) => (
          <button key={message.clientMsgID} onClick={() => navigate(`/messages/session/${id}`)} className="w-full bg-white px-5 py-3 text-left border-b border-gray-50 hover:bg-gray-50">
            <p className="text-sm text-gray-700 truncate">{message.textElem?.content || message.fileElem?.fileName || "[非文本消息]"}</p>
            <p className="mt-1 text-xs text-gray-400">{formatTime(message.sendTime)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
