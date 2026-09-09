import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { getIMSDK } from "../../services/openim";
import { getUserStorageKey } from "../../utils/storage";

export default function PrivacySettings() {
  const navigate = useNavigate();
  const blackList = useAppStore((s) => s.blackList);
  const loadBlackList = useAppStore((s) => s.loadBlackList);
  const currentUser = useAppStore((s) => s.currentUser);
  const userID = currentUser?.userID;
  const [friendVerification, setFriendVerification] = useState(true);
  const [groupVerification, setGroupVerification] = useState(true);
  const [showOnline, setShowOnline] = useState(true);

  useEffect(() => {
    loadBlackList();
  }, []);

  useEffect(() => {
    if (!userID) return;
    setFriendVerification(localStorage.getItem(getUserStorageKey("99chat_friend_verification", userID)) !== "false");
    setGroupVerification(localStorage.getItem(getUserStorageKey("99chat_group_verification", userID)) !== "false");
    setShowOnline(localStorage.getItem(getUserStorageKey("99chat_show_online", userID)) !== "false");
  }, [userID]);

  const toggleFriendVerification = async () => {
    const next = !friendVerification;
    setFriendVerification(next);
    if (userID) localStorage.setItem(getUserStorageKey("99chat_friend_verification", userID), String(next));
    // Call SDK to update self info with allowAddFriend flag
    try {
      const im = getIMSDK();
      await im.setSelfInfo({
        ...currentUser,
        allowAddFriend: next,
      } as any);
    } catch (e) {
      console.error("setFriendVerification:", e);
    }
  };

  const toggleGroupVerification = () => {
    const next = !groupVerification;
    setGroupVerification(next);
    if (userID) localStorage.setItem(getUserStorageKey("99chat_group_verification", userID), String(next));
  };

  const toggleShowOnline = () => {
    const next = !showOnline;
    setShowOnline(next);
    if (userID) localStorage.setItem(getUserStorageKey("99chat_show_online", userID), String(next));
    // Subscribe/unsubscribe to status based on setting
    if (!next) {
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">隐私</h2>
      </div>

      <div className="bg-white mt-2 border-y border-gray-100">
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-700">加我为好友需验证</span>
          <button
            onClick={toggleFriendVerification}
            className={`w-11 h-6 rounded-full transition-colors ${friendVerification ? "bg-primary-500" : "bg-gray-200"}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${friendVerification ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-700">邀请我加入群聊需验证</span>
          <button
            onClick={toggleGroupVerification}
            className={`w-11 h-6 rounded-full transition-colors ${groupVerification ? "bg-primary-500" : "bg-gray-200"}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${groupVerification ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between">
          <span className="text-sm text-gray-700">展示在线状态</span>
          <button
            onClick={toggleShowOnline}
            className={`w-11 h-6 rounded-full transition-colors ${showOnline ? "bg-primary-500" : "bg-gray-200"}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${showOnline ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      <div className="bg-white mt-2 border-y border-gray-100">
        <button
          onClick={() => navigate("/settings/blacklist")}
          className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm text-gray-700">黑名单</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{blackList.length}</span>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </button>
      </div>
    </div>
  );
}
