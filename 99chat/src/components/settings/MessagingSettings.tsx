import { useState } from "react";
import MobileBackButton from "../layout/MobileBackButton";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Users, Smile, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { getIMSDK } from "../../services/openim";

export default function MessagingSettings() {
  const navigate = useNavigate();
  const conversations = useAppStore((s) => s.conversations);
  const refreshConversations = useAppStore((s) => s.refreshConversations);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [toast, setToast] = useState("");

  const handleClearMessages = async () => {
    setClearing(true);
    try {
      const im = getIMSDK();
      for (const conv of conversations) {
        try {
          await im.deleteConversationAndDeleteAllMsg(conv.conversationID);
        } catch {}
      }
      await refreshConversations();
      setToast("聊天记录已清除");
      setTimeout(() => setToast(""), 2000);
    } catch (e) {
      setToast("清除失败");
      setTimeout(() => setToast(""), 2000);
    }
    setClearing(false);
    setShowClearConfirm(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="mobile-page-heading bg-white px-6 py-4 border-b border-gray-100">
        <MobileBackButton to="/settings" />
        <h2 className="text-lg font-bold text-gray-800">聊天设置</h2>
      </div>

      <div className="bg-white mt-2 border-y border-gray-100">
        <button
          onClick={() => navigate("/settings/messaging/batch")}
          className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50"
        >
          <Users size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700 flex-1 text-left">群发助手</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <button
          onClick={() => navigate("/settings/messaging/emojis")}
          className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 border-t border-gray-50"
        >
          <Smile size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700 flex-1 text-left">我的表情</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 border-t border-gray-50"
        >
          <Trash2 size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700 flex-1 text-left">清除聊天记录</span>
          <span className="text-sm text-gray-400">{conversations.length} 个会话</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-72 p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-700 text-center mb-4">确定要清除所有聊天记录吗？此操作不可恢复。</p>
            <div className="flex gap-2">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200 transition-colors">取消</button>
              <button onClick={handleClearMessages} disabled={clearing} className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors disabled:opacity-50">
                {clearing ? "清除中..." : "确定"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
