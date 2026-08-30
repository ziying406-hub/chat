import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, User, Settings as SettingsIcon, Shield, Info, LogOut } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className="w-[320px] border-r border-gray-100 flex flex-col bg-white">
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-800">设置</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Profile card */}
          <button
            onClick={() => navigate("/settings/profile")}
            className={`w-full flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 ${
              isActive("/settings/profile") ? "bg-primary-50" : ""
            }`}
          >
            <img src={currentUser.faceURL} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">{currentUser.nickname}</p>
              <p className="text-xs text-gray-400 mt-0.5">ID: {currentUser.userID}</p>
              <p className="text-xs text-gray-400 mt-0.5">{currentUser.signature}</p>
            </div>
          </button>

          {/* Menu items */}
          <div className="mt-2 border-t border-gray-50">
            <button
              onClick={() => navigate("/settings/general")}
              className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 ${
                isActive("/settings/general") ? "bg-primary-50" : ""
              }`}
            >
              <SettingsIcon size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">通用设置</span>
            </button>
            <button
              onClick={() => navigate("/settings/privacy")}
              className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 ${
                isActive("/settings/privacy") ? "bg-primary-50" : ""
              }`}
            >
              <Shield size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">隐私与安全</span>
            </button>
            <button className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50">
              <Info size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">关于我们</span>
            </button>
          </div>

          <div className="mt-2 border-t border-gray-50">
            <button
              onClick={() => { logout(); navigate("/auth/sign-in"); }}
              className="w-full px-5 py-3.5 text-left text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3"
            >
              <LogOut size={18} /> 退出登录
            </button>
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
}
