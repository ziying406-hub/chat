import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Video, MessageSquare, MoreVertical, UserPlus } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.users[id!]);
  const friends = useAppStore((s) => s.friends);
  const conversations = useAppStore((s) => s.conversations);
  const setActive = useAppStore((s) => s.setActiveConversation);

  if (!user) return <div className="flex-1 flex items-center justify-center text-gray-300">用户不存在</div>;

  const isFriend = friends.some((f) => f.userID === user.userID);
  const hasConv = conversations.find((c) => c.type === "single" && c.userID === user.userID);

  const handleChat = () => {
    if (hasConv) {
      setActive(hasConv.chatSessionID);
      navigate(`/messages/session/${hasConv.chatSessionID}`);
    } else {
      navigate("/messages");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/contact")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">用户资料</h2>
      </div>

      {/* Profile card */}
      <div className="bg-white px-6 py-6 flex items-center gap-4 border-b border-gray-50">
        <img src={user.faceURL} alt="" className="w-16 h-16 rounded-2xl object-cover bg-gray-100" />
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800">{user.nickname}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${user.isOnline ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-400"}`}>
              {user.isOnline ? "在线" : "离线"}
            </span>
            <span className="text-xs text-gray-400">
              {user.gender === 1 ? "男" : user.gender === 2 ? "女" : "未知"}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white mt-2 px-6 py-4 space-y-3 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">个性签名</span>
          <span className="text-sm text-gray-600">{user.signature || "暂无"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">用户 ID</span>
          <span className="text-sm text-gray-600 font-mono">{user.userID}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 bg-white px-6 py-4 flex gap-4 border-b border-gray-50">
        <button onClick={handleChat} className="flex-1 py-3 bg-primary-50 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors flex items-center justify-center gap-2">
          <MessageSquare size={18} /> 发消息
        </button>
        <button className="w-12 h-12 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center">
          <Phone size={18} />
        </button>
        <button className="w-12 h-12 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center">
          <Video size={18} />
        </button>
        {!isFriend && (
          <button className="w-12 h-12 rounded-xl bg-primary-50 text-primary-500 hover:bg-primary-100 transition-colors flex items-center justify-center">
            <UserPlus size={18} />
          </button>
        )}
      </div>

      {isFriend && (
        <div className="mt-2 bg-white px-6 py-4 border-b border-gray-50">
          <button className="w-full text-left text-sm text-gray-500 py-2 hover:text-gray-700">设置备注和标签</button>
          <button className="w-full text-left text-sm text-red-400 py-2 hover:text-red-500">删除好友</button>
          <button className="w-full text-left text-sm text-red-400 py-2 hover:text-red-500">加入黑名单</button>
        </div>
      )}
    </div>
  );
}
