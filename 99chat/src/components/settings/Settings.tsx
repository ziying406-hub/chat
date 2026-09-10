import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAppStore } from "../../store/app-store";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { label: "我的收藏", path: "/settings/collections" },
    { label: "通知设置", path: "/settings/notifications" },
    { label: "聊天设置", path: "/settings/messaging" },
    { label: "隐私", path: "/settings/privacy" },
    { label: "安全", path: "/settings/security" },
    { label: "通用", path: "/settings/general" },
  ];

  return (
    <>
      <div className="w-[320px] border-r border-gray-100 flex flex-col bg-white">
        <div className="bg-primary-500 px-6 py-3.5">
          <h2 className="text-base font-semibold text-white">个人中心</h2>
        </div>

        <div className="flex flex-col items-center pt-6 pb-4 relative">
          <img
            src={currentUser?.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.userID || "default"}`}
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover ring-2 ring-white shadow"
          />
          <h3 className="text-lg font-bold text-gray-800 mt-3 text-center">
            {currentUser?.nickname || "未设置"}
          </h3>
          <div className="absolute right-4 top-8">
            <button
              onClick={() => navigate("/settings/profile")}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mx-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-lg transition-colors hover:bg-gray-50 ${
                isActive(item.path) ? "bg-primary-50 text-primary-600" : "text-gray-700"
              }`}
            >
              <span className="text-sm">{item.label}</span>
            </button>
          ))}

          <div className="h-3" />

          <button
            onClick={() => navigate("/auth/switch")}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-lg transition-colors hover:bg-gray-50 text-gray-700"
          >
            <span className="text-sm">切换使用者</span>
          </button>

          <button
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true);
              setLogoutError("");
              try { await logout(); navigate("/auth/sign-in"); }
              catch { setLogoutError("退出失败，未能撤销推送订阅，请重试"); }
              finally { setLoggingOut(false); }
            }}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-lg transition-colors hover:bg-red-50 text-red-500"
          >
            <span className="text-sm">{loggingOut ? "正在退出…" : "退出"}</span>
          </button>
          {logoutError && <p role="alert" className="px-5 py-2 text-sm text-red-500">{logoutError}</p>}
        </div>
      </div>
      <Outlet />
    </>
  );
}
