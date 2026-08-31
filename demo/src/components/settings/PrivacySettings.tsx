import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function PrivacySettings() {
  const navigate = useNavigate();
  const blackList = useAppStore((s) => s.blackList);
  const [showOnline, setShowOnline] = useState(true);
  const [encrypt, setEncrypt] = useState(true);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/settings")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">隐私与安全</h2>
      </div>

      <div className="bg-white mt-2 border-y border-gray-50">
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-600">展示在线状态</span>
          <button onClick={() => setShowOnline(!showOnline)} className={`w-11 h-6 rounded-full transition-colors ${showOnline ? "bg-primary-500" : "bg-gray-200"}`}>
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${showOnline ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between">
          <span className="text-sm text-gray-600">加密本地存储</span>
          <button onClick={() => setEncrypt(!encrypt)} className={`w-11 h-6 rounded-full transition-colors ${encrypt ? "bg-primary-500" : "bg-gray-200"}`}>
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${encrypt ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      <div className="bg-white mt-2 border-y border-gray-50">
        <button className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <span className="text-sm text-gray-600">黑名单</span>
          <div className="flex items-center gap-2"><span className="text-sm text-gray-400">{blackList.length}</span><ChevronRight size={16} className="text-gray-300" /></div>
        </button>
        <button onClick={() => navigate("/settings/change-password")} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-50">
          <span className="text-sm text-gray-600">修改密码</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>
    </div>
  );
}
