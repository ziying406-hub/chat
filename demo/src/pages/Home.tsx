import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Users, Settings as SettingsIcon, MessageCircle } from "lucide-react";
import { useAppStore } from "../store/app-store";

export default function Home() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);

  useEffect(() => {
    const timer = setTimeout(() => navigate("/messages", { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-white mb-5 shadow-lg">
        <MessageCircle size={40} />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">99chat</h1>
      <p className="text-white/70 text-sm mb-8">Welcome, {currentUser?.nickname || "User"}</p>

      <div className="flex gap-4">
        <button
          onClick={() => navigate("/messages", { replace: true })}
          className="w-16 h-16 bg-white/15 hover:bg-white/25 rounded-2xl flex flex-col items-center justify-center gap-1 text-white transition-colors"
        >
          <MessageSquare size={22} />
          <span className="text-[10px] font-medium">消息</span>
        </button>
        <button
          onClick={() => navigate("/contact", { replace: true })}
          className="w-16 h-16 bg-white/15 hover:bg-white/25 rounded-2xl flex flex-col items-center justify-center gap-1 text-white transition-colors"
        >
          <Users size={22} />
          <span className="text-[10px] font-medium">通讯录</span>
        </button>
        <button
          onClick={() => navigate("/settings", { replace: true })}
          className="w-16 h-16 bg-white/15 hover:bg-white/25 rounded-2xl flex flex-col items-center justify-center gap-1 text-white transition-colors"
        >
          <SettingsIcon size={22} />
          <span className="text-[10px] font-medium">设置</span>
        </button>
      </div>

      <p className="text-white/40 text-xs mt-12">即将进入消息...</p>
    </div>
  );
}
