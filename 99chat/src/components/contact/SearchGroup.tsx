import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { getIMSDK } from "../../services/openim";

export default function SearchGroup() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const im = getIMSDK();
      const res = await im.searchGroups({ keywordList: [keyword.trim()], isSearchGroupID: true, isSearchGroupName: true });
      setResults(res.data || []);
    } catch (e) {
      console.error("searchGroups:", e);
      setResults([]);
    }
    setSearching(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/contact")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">搜索群组</h2>
      </div>

      <div className="bg-white px-5 py-4 border-b border-gray-50">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="输入群名称"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200 transition-all"
            />
          </div>
          <button onClick={handleSearch} disabled={searching} className="px-4 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50">
            {searching ? "搜索中..." : "搜索"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searching && <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2"><Loader2 size={20} className="animate-spin" /><span>搜索中...</span></div>}
        {!searching && searched && results.length === 0 && <div className="flex flex-col items-center justify-center py-20 text-gray-300 text-sm gap-2"><Search size={28} className="opacity-30" /><span>未找到群组</span></div>}
        {!searching && results.map((g: any, idx) => {
          const groupID = g.groupID || "";
          const groupName = g.groupName || "未知群组";
          const memberCount = g.memberCount ?? g.groupMemberCount ?? 0;
          const faceURL = g.faceURL || "";
          return <div key={groupID || idx} onClick={() => navigate(`/contact/group/${groupID}`)} className="bg-white px-5 py-4 border-b border-gray-50 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"><img src={faceURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${groupID}`} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100" /><div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800">{groupName}</p><p className="text-xs text-gray-400 mt-0.5">{memberCount} 人</p></div><button className="px-3 py-1.5 bg-primary-50 text-primary-500 rounded-lg text-sm hover:bg-primary-100 transition-colors">查看</button></div>;
        })}
        {!searching && !searched && <div className="flex flex-col items-center justify-center py-20 text-gray-300 text-sm gap-2"><Search size={28} className="opacity-30" /><span>输入群名称开始搜索</span></div>}
      </div>
    </div>
  );
}
