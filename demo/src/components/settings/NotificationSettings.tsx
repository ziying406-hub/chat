import { useEffect, useState } from "react";
import { Bell, Volume2, Vibrate } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { getUserStorageKey } from "../../utils/storage";

export default function NotificationSettings() {
  const userID = useAppStore((state) => state.currentUser?.userID);
  const [muteAll, setMuteAll] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(() => {
    if (!("Notification" in window)) return false;
    return Notification.permission === "granted";
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const storageKey = (key: string) => userID ? getUserStorageKey(key, userID) : null;

  useEffect(() => {
    if (!userID) return;
    setMuteAll(localStorage.getItem(getUserStorageKey("99chat_mute_all", userID)) === "true");
    setSoundEnabled(localStorage.getItem(getUserStorageKey("99chat_sound_enabled", userID)) !== "false");
    setVibrateEnabled(localStorage.getItem(getUserStorageKey("99chat_vibrate_enabled", userID)) !== "false");
  }, [userID]);

  const toggleMuteAll = () => {
    const next = !muteAll;
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
    if (!notifEnabled) {
      // Requesting permission
      if ("Notification" in window) {
        setRequestingPermission(true);
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            setNotifEnabled(true);
            const notificationKey = storageKey("99chat_notif_enabled");
            if (notificationKey) localStorage.setItem(notificationKey, "true");
            // Register FCM for push notifications
            try {
              const { registerFCM } = await import("../../services/openim");
              await registerFCM();
            } catch {}
          }
        } catch {}
        setRequestingPermission(false);
      }
    } else {
      setNotifEnabled(false);
      const notificationKey = storageKey("99chat_notif_enabled");
      if (notificationKey) localStorage.setItem(notificationKey, "false");
    }
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

  const Toggle = ({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-11 h-6 rounded-full transition-colors ${on ? "bg-primary-500" : "bg-gray-200"} ${disabled ? "opacity-50" : ""}`}
    >
      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-6 py-4 border-b border-gray-100">
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
          <Toggle on={notifEnabled} onClick={toggleNotif} disabled={requestingPermission || muteAll} />
        </div>
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
