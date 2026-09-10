import { useEffect, useState } from "react";
import MobileBackButton from "../layout/MobileBackButton";
import { Bell, Volume2, Vibrate } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { getUserStorageKey } from "../../utils/storage";
import { registerWebPush, unregisterWebPush } from "../../services/push";

export default function NotificationSettings() {
  const userID = useAppStore((state) => state.currentUser?.userID);
  const [muteAll, setMuteAll] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [pushStatus, setPushStatus] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const storageKey = (key: string) => userID ? getUserStorageKey(key, userID) : null;

  useEffect(() => {
    if (!userID) return;
    setNotifEnabled(localStorage.getItem(getUserStorageKey("99chat_notif_enabled", userID)) === "true" && "Notification" in window && Notification.permission === "granted");
    setMuteAll(localStorage.getItem(getUserStorageKey("99chat_mute_all", userID)) === "true");
    setSoundEnabled(localStorage.getItem(getUserStorageKey("99chat_sound_enabled", userID)) !== "false");
    setVibrateEnabled(localStorage.getItem(getUserStorageKey("99chat_vibrate_enabled", userID)) !== "false");
  }, [userID]);

  const toggleMuteAll = async () => {
    const next = !muteAll;
    if (next && notifEnabled) {
      try { await unregisterWebPush(); } catch { setPushStatus("关闭推送失败，请重试"); return; }
    }
    setMuteAll(next);
    const muteKey = storageKey("99chat_mute_all");
    if (muteKey) localStorage.setItem(muteKey, String(next));
    // When mute all is on, disable all other notifications
    if (next) {
      setNotifEnabled(false);
      setSoundEnabled(false);
      setVibrateEnabled(false);
      const notificationKey = storageKey("99chat_notif_enabled");
      const soundKey = storageKey("99chat_sound_enabled");
      const vibrateKey = storageKey("99chat_vibrate_enabled");
      if (notificationKey) localStorage.setItem(notificationKey, "false");
      if (soundKey) localStorage.setItem(soundKey, "false");
      if (vibrateKey) localStorage.setItem(vibrateKey, "false");
    }
  };

  const toggleNotif = async () => {
    setRequestingPermission(true);
    setPushStatus("");
    try {
      if (!notifEnabled) {
        if (!("Notification" in window)) throw new Error("此浏览器不支持通知");
        if (await Notification.requestPermission() !== "granted") throw new Error("请在浏览器设置中允许通知");
        await registerWebPush();
      } else {
        await unregisterWebPush();
      }
      const next = !notifEnabled;
      setNotifEnabled(next);
      const notificationKey = storageKey("99chat_notif_enabled");
      if (notificationKey) localStorage.setItem(notificationKey, String(next));
      setPushStatus(next ? "离线推送已启用" : "离线推送已关闭");
    } catch (error) {
      setPushStatus(error instanceof Error ? error.message : "推送设置失败，请重试");
    } finally { setRequestingPermission(false); }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    const soundKey = storageKey("99chat_sound_enabled");
    if (soundKey) localStorage.setItem(soundKey, String(next));
  };

  const toggleVibrate = () => {
    const next = !vibrateEnabled;
    setVibrateEnabled(next);
    const vibrateKey = storageKey("99chat_vibrate_enabled");
    if (vibrateKey) localStorage.setItem(vibrateKey, String(next));
    // Test vibration if enabling
    if (next && "vibrate" in navigator) {
      navigator.vibrate(200);
    }
  };

  const Toggle = ({ on, onClick, disabled, label }: { on: boolean; onClick: () => void; disabled?: boolean; label?: string }) => (
    <button
      aria-label={label}
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
      className={`w-11 h-6 rounded-full transition-colors ${on ? "bg-primary-500" : "bg-gray-200"} ${disabled ? "opacity-50" : ""}`}
    >
      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="mobile-page-heading bg-white px-6 py-4 border-b border-gray-100">
        <MobileBackButton to="/settings" />
        <h2 className="text-lg font-bold text-gray-800">通知设置</h2>
      </div>

      <div className="bg-white mt-2 border-y border-gray-100">
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-700">消息免打扰</span>
          <Toggle on={muteAll} onClick={toggleMuteAll} />
        </div>
      </div>

      <div className="px-5 pt-4 pb-1 text-xs font-medium text-gray-400">应用未打开时</div>
      <div className="bg-white border-y border-gray-100">
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-gray-400" />
            <span className="text-sm text-gray-700">新消息通知</span>
          </div>
          <Toggle label="新消息通知" on={notifEnabled} onClick={toggleNotif} disabled={requestingPermission || muteAll} />
        </div>
        {pushStatus && <p role="status" className="px-5 py-2 text-sm text-gray-500">{pushStatus}</p>}
      </div>

      <div className="px-5 pt-4 pb-1 text-xs font-medium text-gray-400">应用打开时</div>
      <div className="bg-white border-y border-gray-100">
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-3">
            <Volume2 size={18} className="text-gray-400" />
            <span className="text-sm text-gray-700">声音</span>
          </div>
          <Toggle on={soundEnabled} onClick={toggleSound} disabled={muteAll} />
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Vibrate size={18} className="text-gray-400" />
            <span className="text-sm text-gray-700">震动</span>
          </div>
          <Toggle on={vibrateEnabled} onClick={toggleVibrate} disabled={muteAll} />
        </div>
      </div>
    </div>
  );
}
