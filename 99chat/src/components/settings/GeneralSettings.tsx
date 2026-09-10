import { useState } from "react";
import MobileBackButton from "../layout/MobileBackButton";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, Globe, Monitor, MessageSquare, Info, Trash2, RefreshCw, Bug } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { sdkLogin, sdkLogout } from "../../services/openim";

export default function GeneralSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const authData = useAppStore((s) => s.authData);

  const [showLangModal, setShowLangModal] = useState(false);
  const [showDisplayModal, setShowDisplayModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [reconnectState, setReconnectState] = useState<"idle" | "reconnecting" | "success" | "failed">("idle");

  const currentLang = localStorage.getItem("99chat_lang") || "zh-CN";
  const langLabel = currentLang === "zh-CN" ? "简体中文" : currentLang === "en-US" ? "English" : currentLang === "zh-TW" ? "繁體中文" : "Tiếng Việt";
  const displayMode = localStorage.getItem("99chat_display_mode") || "desktop";
  const displayLabel = displayMode === "desktop" ? "桌面版" : "行动版";
  const [selectedLang, setSelectedLang] = useState(currentLang);
  const [selectedDisplay, setSelectedDisplay] = useState(displayMode);

  const handleClearCache = () => {
    if ("caches" in window) {
      caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
    }
    localStorage.removeItem("99chat_conversations_cache");
    // Clear all service worker caches
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.update());
      });
    }
    setShowClearConfirm(false);
    // Reload to refresh data
    setTimeout(() => window.location.reload(), 500);
  };

  const handleReconnect = async () => {
    if (!authData) return;
    setReconnectState("reconnecting");
    try {
      await sdkLogout();
      await new Promise((r) => setTimeout(r, 1000));
      await sdkLogin(authData.userID, authData.imToken);
      setReconnectState("success");
      setTimeout(() => setReconnectState("idle"), 2000);
    } catch (e) {
      setReconnectState("failed");
      setTimeout(() => setReconnectState("idle"), 2000);
    }
  };

  const handleLangConfirm = () => {
    localStorage.setItem("99chat_lang", selectedLang);
    setShowLangModal(false);
    window.location.reload();
  };

  const handleDisplayConfirm = () => {
    localStorage.setItem("99chat_display_mode", selectedDisplay);
    // Apply display mode
    if (selectedDisplay === "mobile") {
      document.body.classList.add("mobile-mode");
    } else {
      document.body.classList.remove("mobile-mode");
    }
    setShowDisplayModal(false);
  };

  const languages = [
    { code: "zh-CN", label: "简体中文" },
    { code: "zh-TW", label: "繁體中文" },
    { code: "en-US", label: "English" },
    { code: "vi-VN", label: "Tiếng Việt" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="mobile-page-heading bg-white px-6 py-4 border-b border-gray-100">
        <MobileBackButton to="/settings" />
        <h2 className="text-lg font-bold text-gray-800">通用</h2>
      </div>

      <div className="bg-white mt-2 border-y border-gray-100">
        <button
          onClick={() => { setSelectedLang(currentLang); setShowLangModal(true); }}
          className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50"
        >
          <Globe size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700 flex-1 text-left">切换语言</span>
          <span className="text-sm text-gray-400">{langLabel}</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <button
          onClick={() => { setSelectedDisplay(displayMode); setShowDisplayModal(true); }}
          className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 border-t border-gray-50"
        >
          <Monitor size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700 flex-1 text-left">显示模式</span>
          <span className="text-sm text-gray-400">{displayLabel}</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <button
          onClick={() => navigate("/settings/feedback")}
          className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 border-t border-gray-50 ${
            location.pathname === "/settings/feedback" ? "bg-primary-50" : ""
          }`}
        >
          <MessageSquare size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700 flex-1 text-left">意见反馈</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <button
          onClick={() => navigate("/settings/about")}
          className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 border-t border-gray-50 ${
            location.pathname === "/settings/about" ? "bg-primary-50" : ""
          }`}
        >
          <Info size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700 flex-1 text-left">关于我们</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 border-t border-gray-50"
        >
          <Trash2 size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700 flex-1 text-left">清除缓存数据</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <button
          onClick={handleReconnect}
          disabled={reconnectState === "reconnecting"}
          className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 border-t border-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={18} className={`text-gray-400 ${reconnectState === "reconnecting" ? "animate-spin" : ""}`} />
          <span className="text-sm text-gray-700 flex-1 text-left">重新选线</span>
          {reconnectState === "reconnecting" && <span className="text-sm text-gray-400">连接中...</span>}
          {reconnectState === "success" && <span className="text-sm text-green-500">已连接</span>}
          {reconnectState === "failed" && <span className="text-sm text-red-500">连接失败</span>}
          {reconnectState === "idle" && <ChevronRight size={16} className="text-gray-300" />}
        </button>

        <button
          onClick={() => navigate("/settings/debug")}
          className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 border-t border-gray-50 ${
            location.pathname === "/settings/debug" ? "bg-primary-50" : ""
          }`}
        >
          <Bug size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700 flex-1 text-left">调试资讯</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      {/* Language selection modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowLangModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-72 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 text-center">切换语言</h3>
            <div className="space-y-1 mb-4">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`w-full py-2.5 rounded-lg text-sm transition-colors ${
                    selectedLang === lang.code ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowLangModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200 transition-colors">取消</button>
              <button onClick={handleLangConfirm} className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors">確認</button>
            </div>
          </div>
        </div>
      )}

      {/* Display mode modal */}
      {showDisplayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDisplayModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-72 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 text-center">显示模式</h3>
            <div className="space-y-1 mb-4">
              <button
                onClick={() => setSelectedDisplay("desktop")}
                className={`w-full py-2.5 rounded-lg text-sm transition-colors ${
                  selectedDisplay === "desktop" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                桌面版
              </button>
              <button
                onClick={() => setSelectedDisplay("mobile")}
                className={`w-full py-2.5 rounded-lg text-sm transition-colors ${
                  selectedDisplay === "mobile" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                行动版
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDisplayModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200 transition-colors">取消</button>
              <button onClick={handleDisplayConfirm} className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors">確認</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear cache confirm */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-72 p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-700 text-center mb-4">确定要清除缓存数据吗？</p>
            <div className="flex gap-2">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200 transition-colors">取消</button>
              <button onClick={handleClearCache} className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors">确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
