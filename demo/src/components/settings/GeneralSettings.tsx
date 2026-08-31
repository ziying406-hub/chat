import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function GeneralSettings() {
  const navigate = useNavigate();
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const [notif, setNotif] = useState(true);
  const [fontScale, setFontScale] = useState(1);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/settings")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">通用设置</h2>
      </div>

      <div className="bg-white mt-2 border-y border-gray-50">
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-600">消息通知</span>
          <button onClick={() => setNotif(!notif)} className={`w-11 h-6 rounded-full transition-colors ${notif ? "bg-primary-500" : "bg-gray-200"}`}>
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${notif ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-600">深色模式</span>
          <button onClick={toggleDarkMode} className={`w-11 h-6 rounded-full transition-colors ${darkMode ? "bg-primary-500" : "bg-gray-200"}`}>
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between">
          <span className="text-sm text-gray-600">语言</span>
          <span className="text-sm text-gray-400">简体中文</span>
        </div>
      </div>

      <div className="bg-white mt-2 border-y border-gray-50 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">字体大小</span>
          <span className="text-sm text-gray-400">{fontScale === 0.85 ? "小" : fontScale === 1 ? "标准" : "大"}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFontScale(0.85)} className={`flex-1 py-2 rounded-lg text-xs ${fontScale === 0.85 ? "bg-primary-50 text-primary-500" : "bg-gray-50 text-gray-400"}`}>小</button>
          <button onClick={() => setFontScale(1)} className={`flex-1 py-2 rounded-lg text-xs ${fontScale === 1 ? "bg-primary-50 text-primary-500" : "bg-gray-50 text-gray-400"}`}>标准</button>
          <button onClick={() => setFontScale(1.15)} className={`flex-1 py-2 rounded-lg text-xs ${fontScale === 1.15 ? "bg-primary-50 text-primary-500" : "bg-gray-50 text-gray-400"}`}>大</button>
        </div>
      </div>
    </div>
  );
}
