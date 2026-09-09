import { useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store/app-store";
import Login from "./pages/Login";
import AccountSwitch from "./pages/AccountSwitch";
import InitialSetup from "./pages/InitialSetup";
import Home from "./pages/Home";
import MainLayout from "./components/layout/MainLayout";
import { registerWebMCP } from "./webmcp";
import { registerFCM } from "./services/openim";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthed = useAppStore((s) => s.isAuthed);
  if (!isAuthed) return <Navigate to="/auth/sign-in" replace />;
  return <>{children}</>;
}

export default function App() {
  const isAuthed = useAppStore((s) => s.isAuthed);
  const darkMode = useAppStore((s) => s.darkMode);

  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [showNotifDialog, setShowNotifDialog] = useState(false);

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
      if (!localStorage.getItem("99chat_pwa_prompt_dismissed")) {
        setShowPwaBanner(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // PWA update detection
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const controllerChange = () => setShowUpdateToast(true);
    navigator.serviceWorker.addEventListener("controllerchange", controllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", controllerChange);
  }, []);

  // Notification permission check after login
  useEffect(() => {
    if (isAuthed && "Notification" in window && Notification.permission === "default") {
      setShowNotifDialog(true);
    }
  }, [isAuthed]);

  // Register WebMCP tools and FCM after login
  useEffect(() => {
    if (isAuthed) {
      registerWebMCP();
      registerFCM();
    }
  }, [isAuthed]);

  // Toggle dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleInstall = async () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      await pwaPrompt.userChoice;
      setPwaPrompt(null);
    }
    setShowPwaBanner(false);
  };

  const handleDismissPwa = () => {
    localStorage.setItem("99chat_pwa_prompt_dismissed", "1");
    setShowPwaBanner(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleAllowNotif = async () => {
    await Notification.requestPermission();
    setShowNotifDialog(false);
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/auth/sign-in" element={<Login />} />
        <Route path="/auth/switch" element={<AccountSwitch />} />
        <Route path="/auth/setup" element={<InitialSetup />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
      </Routes>

      {/* PWA install banner */}
      {showPwaBanner && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3 max-w-[90%]">
          <span className="text-sm text-gray-700">将 99chat 添加到主屏幕，获得更好体验</span>
          <button onClick={handleInstall} className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors">安装</button>
          <button onClick={handleDismissPwa} className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200 transition-colors">稍后</button>
        </div>
      )}

      {/* PWA update toast */}
      {showUpdateToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-[90%]">
          <span className="text-sm">新版本可用，点击刷新</span>
          <button onClick={handleRefresh} className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors">刷新</button>
        </div>
      )}

      {/* Notification permission dialog */}
      {showNotifDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-72 max-w-[90%] p-5">
            <p className="text-sm text-gray-700 text-center mb-4">开启通知，及时收到消息提醒</p>
            <div className="flex gap-2">
              <button onClick={() => setShowNotifDialog(false)} className="flex-1 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200 transition-colors">拒绝</button>
              <button onClick={handleAllowNotif} className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors">允许</button>
            </div>
          </div>
        </div>
      )}
    </HashRouter>
  );
}
