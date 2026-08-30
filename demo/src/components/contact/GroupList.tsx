import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function GroupList() {
  const navigate = useNavigate();
  const groups = useAppStore((s) => s.groups);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/contact")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">群组列表</h2>
        <button onClick={() => navigate("/contact/create-group")} className="ml-auto text-primary-500 hover:text-primary-600"><Plus size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300 text-sm gap-2">
            <Users size={28} className="opacity-30" />
            <span>暂无群组</span>
          </div>
        )}
        {groups.map((g) => (
          <button key={g.groupID} onClick={() => navigate(`/contact/group/${g.groupID}`)}
            className="w-full flex items-center gap-3 px-5 py-3 bg-white hover:bg-gray-50 border-b border-gray-50 transition-colors">
            <img src={g.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.groupID}`} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-gray-800">{g.groupName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{g.memberCount} 人 · {g.introduction || "暂无简介"}</p>
            </div>
            <Users size={16} className="text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  );
}
