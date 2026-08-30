import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Video, MessageSquare, QrCode, UserPlus } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { useState } from "react";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const friends = useAppStore((s) => s.friends);
  const conversations = useAppStore((s) => s.conversations);
  const setActive = useAppStore((s) => s.setActiveConversation);
  const currentUser = useAppStore((s) => s.currentUser);
  const [showQR, setShowQR] = useState(false);

  const friend = friends.find((f) => f.userID === id);
  const isSelf = id === currentUser?.userID;
  const user = isSelf ? currentUser : friend;

  if (!user) return <div className="flex-1 flex items-center justify-center text-gray-300">用户不存在</div>;

  const isFriend = !!friend;
  const conv = conversations.find((c) => c.conversationType === 1 && c.userID === id);

  const handleChat = () => {
    if (conv) {
      setActive(conv.conversationID);
      navigate(`/messages/session/${conv.conversationID}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/contact")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">{isSelf ? "我的资料" : "用户资料"}</h2>
      </div>

      <div className="bg-white px-6 py-6 flex items-center gap-4 border-b border-gray-50">
        <img src={(user as any).faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} alt="" className="w-16 h-16 rounded-2xl object-cover bg-gray-100" />
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800">{(user as any).nickname || id}</h3>
          <span className="text-xs text-gray-400">ID: {id}</span>
        </div>
        <button onClick={() => setShowQR(true)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
          <QrCode size={20} />
        </button>
      </div>

      <div className="bg-white mt-2 px-6 py-4 space-y-3 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">用户 ID</span>
          <span className="text-sm text-gray-600 font-mono">{id}</span>
        </div>
        {isSelf && (
          <button onClick={() => navigate("/settings/profile")} className="w-full text-left text-sm text-primary-500 hover:text-primary-600">编辑资料</button>
        )}
      </div>

      {!isSelf && (
        <div className="mt-2 bg-white px-6 py-4 flex gap-4 border-b border-gray-50">
          {isFriend && (
            <>
              <button onClick={handleChat} className="flex-1 py-3 bg-primary-50 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors flex items-center justify-center gap-2">
                <MessageSquare size={18} /> 发消息
              </button>
              <button onClick={() => navigate(`/messages`)} className="w-12 h-12 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center"><Phone size={18} /></button>
              <button onClick={() => navigate(`/messages`)} className="w-12 h-12 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center"><Video size={18} /></button>
            </>
          )}
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800">{(user as any).nickname || id}</h3>
            <div className="w-48 h-48 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center p-3">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=99chat:user:${id}`} alt="QR" className="w-full h-full" />
            </div>
            <p className="text-sm text-gray-400">扫描二维码添加好友</p>
            <button onClick={() => setShowQR(false)} className="px-6 py-2 bg-primary-500 text-white rounded-xl text-sm hover:bg-primary-600 transition-colors">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
