import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Settings as SettingsIcon, Shield, Info, LogOut, QrCode } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { useState } from "react";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);
  const [showQR, setShowQR] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className="w-[320px] border-r border-gray-100 flex flex-col bg-white">
        <div className="px-5 pt-4 pb-2"><h2 className="text-lg font-semibold text-gray-800">设置</h2></div>
        <div className="flex-1 overflow-y-auto">
          <div
            onClick={() => navigate("/settings/profile")}
            className={`w-full flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 cursor-pointer ${isActive("/settings/profile") ? "bg-primary-50" : ""}`}
          >
            <img src={currentUser?.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">{currentUser?.nickname || "未设置"}</p>
              <p className="text-xs text-gray-400 mt-0.5">ID: {currentUser?.userID}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setShowQR(true); }} className="ml-auto w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100">
              <QrCode size={18} />
            </button>
          </div>

          <div className="mt-2 border-t border-gray-50">
            <button onClick={() => navigate("/settings/general")} className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 ${isActive("/settings/general") ? "bg-primary-50" : ""}`}>
              <SettingsIcon size={18} className="text-gray-400" /><span className="text-sm text-gray-600">通用设置</span>
            </button>
            <button onClick={() => navigate("/settings/privacy")} className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 ${isActive("/settings/privacy") ? "bg-primary-50" : ""}`}>
              <Shield size={18} className="text-gray-400" /><span className="text-sm text-gray-600">隐私与安全</span>
            </button>
            <button className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50">
              <Info size={18} className="text-gray-400" /><span className="text-sm text-gray-600">关于我们</span>
            </button>
          </div>

          <div className="mt-2 border-t border-gray-50">
            <button onClick={() => { logout(); navigate("/auth/sign-in"); }} className="w-full px-5 py-3.5 text-left text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3">
              <LogOut size={18} /> 退出登录
            </button>
          </div>
        </div>
      </div>
      <Outlet />

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800">{currentUser?.nickname || "我"}</h3>
            <div className="w-48 h-48 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center p-3">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=99chat:user:${currentUser?.userID}`} alt="QR" className="w-full h-full" />
            </div>
            <p className="text-sm text-gray-400">扫描二维码加我好友</p>
            <button onClick={() => setShowQR(false)} className="px-6 py-2 bg-primary-500 text-white rounded-xl text-sm hover:bg-primary-600 transition-colors">关闭</button>
          </div>
        </div>
      )}
    </>
  );
}
