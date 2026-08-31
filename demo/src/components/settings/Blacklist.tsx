import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function Blacklist() {
  const navigate = useNavigate();
  const blackList = useAppStore((s) => s.blackList);
  const loadBlackList = useAppStore((s) => s.loadBlackList);
  const removeBlack = useAppStore((s) => s.removeBlack);

  useEffect(() => {
    loadBlackList();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/settings/privacy")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">黑名单</h2>
      </div>

      <div className="bg-white mt-2 border-y border-gray-50 flex-1 overflow-y-auto">
        {blackList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300 text-sm gap-2">
            <span>黑名单为空</span>
          </div>
        )}
        {blackList.map((b: any) => (
          <div key={b.userID} className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-50">
            <img src={b.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.userID}`} alt="" className="w-10 h-10 rounded-xl object-cover bg-gray-100" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-800 truncate block">{b.nickname || b.userID}</span>
              <span className="text-xs text-gray-400 truncate block">ID: {b.userID}</span>
            </div>
            <button
              onClick={() => removeBlack(b.userID)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
