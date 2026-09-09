import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Users } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function CreateGroup() {
  const navigate = useNavigate();
  const friends = useAppStore((s) => s.friends);
  const createGroup = useAppStore((s) => s.createGroup);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleCreate = async () => {
    if (selected.size === 0 || !groupName.trim()) return;
    setCreating(true);
    setError("");
    try {
      await createGroup(groupName.trim(), Array.from(selected));
      navigate("/contact/groups");
    } catch (e: any) {
      setError(e?.message || "创建失败，请重试");
    }
    setCreating(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/contact")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
          <h2 className="text-base font-semibold text-gray-800">创建群组</h2>
        </div>
        <span className="text-sm text-gray-400">{selected.size} 人</span>
      </div>

      <div className="bg-white px-5 py-3 border-b border-gray-50">
        <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="群名称"
          className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200" />
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {friends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300 text-sm gap-3">
            <Users size={28} className="opacity-30" />
            <span>暂无好友，无法创建群聊</span>
            <button onClick={() => navigate("/contact/requests")} className="text-primary-500 hover:underline text-sm">添加好友</button>
          </div>
        )}
        {friends.map((f) => (
          <button key={f.userID} onClick={() => toggle(f.userID)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selected.has(f.userID) ? "bg-primary-500 border-primary-500" : "border-gray-300"}`}>
              {selected.has(f.userID) && <Check size={12} className="text-white" />}
            </div>
            <img src={f.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.userID}`} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
            <span className="text-sm font-medium text-gray-700">{f.remark || f.nickname || f.userID}</span>
          </button>
        ))}
      </div>

      {error && <div className="px-5 py-2 bg-red-50 text-red-500 text-sm text-center">{error}</div>}
      <div className="px-5 py-4 bg-white border-t border-gray-100 sticky bottom-0 z-20">
        <button onClick={handleCreate} disabled={selected.size === 0 || !groupName.trim() || creating}
          className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${selected.size > 0 && groupName.trim() && !creating ? "bg-primary-500 text-white hover:bg-primary-600" : "bg-gray-100 text-gray-300"}`}>
          {creating ? "创建中..." : `完成（${selected.size}）`}
        </button>
      </div>
    </div>
  );
}
