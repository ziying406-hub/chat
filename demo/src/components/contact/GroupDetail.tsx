import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Volume2, LogOut, Crown, Shield } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const group = useAppStore((s) => s.groups.find((g) => g.groupID === id));
  const members = useAppStore((s) => s.groupMembers.filter((m) => m.groupID === id));
  const currentUser = useAppStore((s) => s.currentUser);

  if (!group) return <div className="flex-1 flex items-center justify-center text-gray-300">群组不存在</div>;

  const sorted = [...members].sort((a, b) => b.roleLevel - a.roleLevel);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/contact/groups")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">群聊信息</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Group header */}
        <div className="bg-white px-6 py-6 flex items-center gap-4 border-b border-gray-50">
          <img src={group.faceURL} alt="" className="w-16 h-16 rounded-2xl object-cover bg-gray-100" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{group.groupName}</h3>
            <p className="text-xs text-gray-400 mt-1">{group.memberCount} 成员</p>
          </div>
        </div>

        {/* Announcement */}
        <div className="bg-white mt-2 px-6 py-4 border-y border-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">群公告</h4>
          <p className="text-sm text-gray-400">{group.announcement || "暂无公告"}</p>
        </div>

        {/* Introduction */}
        <div className="bg-white mt-2 px-6 py-4 border-y border-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">群简介</h4>
          <p className="text-sm text-gray-400">{group.introduction || "暂无简介"}</p>
        </div>

        {/* Members */}
        <div className="bg-white mt-2 border-y border-gray-50">
          <div className="px-6 py-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">群成员（{members.length}）</h4>
            <Users size={16} className="text-gray-300" />
          </div>
          <div className="px-3 pb-3 grid grid-cols-5 gap-2">
            {sorted.map((m) => (
              <div key={m.userID} className="flex flex-col items-center gap-1 p-2">
                <div className="relative">
                  <img src={m.faceURL} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
                  {m.roleLevel === 100 && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-white">
                      <Crown size={10} />
                    </div>
                  )}
                  {m.roleLevel === 60 && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center text-white">
                      <Shield size={10} />
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[60px]">
                  {m.userID === currentUser.userID ? "我" : m.nickname}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2 bg-white border-y border-gray-50">
          <button className="w-full px-6 py-3.5 text-left text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <Volume2 size={16} /> 消息免打扰
          </button>
          {group.ownerUserID === currentUser.userID ? (
            <button className="w-full px-6 py-3.5 text-left text-sm text-red-400 hover:text-red-500 flex items-center gap-2">
              <LogOut size={16} /> 解散群组
            </button>
          ) : (
            <button className="w-full px-6 py-3.5 text-left text-sm text-red-400 hover:text-red-500 flex items-center gap-2">
              <LogOut size={16} /> 退出群组
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
