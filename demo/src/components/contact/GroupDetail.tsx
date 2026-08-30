import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Users, Volume2, LogOut, Crown, Shield, QrCode, Settings as SettingsIcon } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { GroupMemberRole } from "@openim/wasm-client-sdk";
import { useState } from "react";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const groups = useAppStore((s) => s.groups);
  const members = useAppStore((s) => (id ? s.groupMembersMap[id] : undefined)) || [];
  const loadMembers = useAppStore((s) => s.loadGroupMembers);
  const currentUser = useAppStore((s) => s.currentUser);
  const [showQR, setShowQR] = useState(false);

  const group = groups.find((g) => g.groupID === id);

  useEffect(() => {
    if (id) loadMembers(id);
  }, [id]);

  if (!group) return <div className="flex-1 flex items-center justify-center text-gray-300">群组不存在</div>;

  const sorted = [...members].sort((a, b) => (b.roleLevel || 0) - (a.roleLevel || 0));

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/contact/groups")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">群聊信息</h2>
        <button onClick={() => setShowQR(true)} className="ml-auto text-gray-400 hover:text-primary-500"><QrCode size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white px-6 py-6 flex items-center gap-4 border-b border-gray-50">
          <img src={group.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.groupID}`} alt="" className="w-16 h-16 rounded-2xl object-cover bg-gray-100" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{group.groupName}</h3>
            <p className="text-xs text-gray-400 mt-1">{group.memberCount || members.length} 成员</p>
          </div>
        </div>

        <div className="bg-white mt-2 px-6 py-4 border-y border-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">群公告</h4>
          <p className="text-sm text-gray-400">{group.notification || "暂无公告"}</p>
        </div>

        <div className="bg-white mt-2 px-6 py-4 border-y border-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">群简介</h4>
          <p className="text-sm text-gray-400">{group.introduction || "暂无简介"}</p>
        </div>

        <div className="bg-white mt-2 border-y border-gray-50">
          <div className="px-6 py-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">群成员（{members.length}）</h4>
            <Users size={16} className="text-gray-300" />
          </div>
          <div className="px-3 pb-3 grid grid-cols-5 gap-2">
            {sorted.map((m) => (
              <div key={m.userID} className="flex flex-col items-center gap-1 p-2">
                <div className="relative">
                  <img src={m.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userID}`} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
                  {m.roleLevel === GroupMemberRole.Owner && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-white"><Crown size={10} /></div>
                  )}
                  {m.roleLevel === GroupMemberRole.Admin && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center text-white"><Shield size={10} /></div>
                  )}
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[60px]">{m.userID === currentUser?.userID ? "我" : (m.nickname || m.userID)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 bg-white border-y border-gray-50">
          <button onClick={() => navigate(`/messages/groups/admin/${group.groupID}`)} className="w-full px-6 py-3.5 text-left text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"><SettingsIcon size={16} /> 群管理</button>
          <button className="w-full px-6 py-3.5 text-left text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"><Volume2 size={16} /> 消息免打扰</button>
          {group.ownerUserID === currentUser?.userID ? (
            <button className="w-full px-6 py-3.5 text-left text-sm text-red-400 hover:text-red-500 flex items-center gap-2"><LogOut size={16} /> 解散群组</button>
          ) : (
            <button className="w-full px-6 py-3.5 text-left text-sm text-red-400 hover:text-red-500 flex items-center gap-2"><LogOut size={16} /> 退出群组</button>
          )}
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800">{group.groupName}</h3>
            <div className="w-48 h-48 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center p-3">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=99chat:group:${group.groupID}`} alt="QR" className="w-full h-full" />
            </div>
            <p className="text-sm text-gray-400">扫描二维码加入群组</p>
            <button onClick={() => setShowQR(false)} className="px-6 py-2 bg-primary-500 text-white rounded-xl text-sm hover:bg-primary-600 transition-colors">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
