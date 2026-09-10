import { useParams, useNavigate } from "react-router-dom";
import UnavailableDetail from "../layout/UnavailableDetail";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Users, Volume2, LogOut, Crown, Shield, QrCode, Settings as SettingsIcon, Edit3, Trash2, X, Camera, ChevronDown } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { GroupMemberRole } from "@openim/wasm-client-sdk";
import { groupPermissions } from "../../utils/group-permissions";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const groups = useAppStore((s) => s.groups);
  const members = useAppStore((s) => (id ? s.groupMembersMap[id] : undefined)) || [];
  const loadMembers = useAppStore((s) => s.loadGroupMembers);
  const currentUser = useAppStore((s) => s.currentUser);
  const deleteConversation = useAppStore((s) => s.deleteConversation);
  const setGroupMemberNickname = useAppStore((s) => s.setGroupMemberNickname);
  const setGroupInfo = useAppStore((s) => s.setGroupInfo);
  const uploadAvatar = useAppStore((s) => s.uploadAvatar);
  const dismissGroup = useAppStore((s) => s.dismissGroup);
  const quitGroup = useAppStore((s) => s.quitGroup);
  const conversations = useAppStore((s) => s.conversations);
  const muteConversation = useAppStore((s) => s.muteConversation);

  const [showQR, setShowQR] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [nickInput, setNickInput] = useState("");
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [showJoinMethod, setShowJoinMethod] = useState(false);
  const [muteError, setMuteError] = useState("");
  const [muting, setMuting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const group = groups.find((g) => g.groupID === id);
  const { canManage } = groupPermissions(group?.ownerUserID, currentUser?.userID, members);

  useEffect(() => {
    if (id) loadMembers(id);
  }, [id, groups]);

  if (!group) return <UnavailableDetail to="/contact/groups" label="返回群组列表">群组不存在</UnavailableDetail>;

  const needVerification = group?.needVerification ?? 0;

  const sorted = [...members].sort((a, b) => (b.roleLevel || 0) - (a.roleLevel || 0));
  const myMember = members.find((m) => m.userID === currentUser?.userID);
  const conversationID = `sg_${group.groupID}`;
  const groupConversation = conversations.find((conversation) => conversation.conversationID === conversationID);
  const isMuted = Number(groupConversation?.recvMsgOpt || 0) !== 0;

  const toggleMute = async () => {
    if (!groupConversation) return;
    setMuting(true);
    setMuteError("");
    try {
      await muteConversation(conversationID, isMuted ? 0 : 2);
    } catch (cause: any) {
      setMuteError(cause?.message || "消息免打扰设置失败");
    } finally {
      setMuting(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!currentUser || !id || !nickInput.trim()) return;
    await setGroupMemberNickname(id, currentUser.userID, nickInput.trim());
    setShowNickname(false);
    setNickInput("");
  };

  const handleClearMessages = async () => {
    try {
      await deleteConversation(conversationID);
      setShowConfirmClear(false);
    } catch (cause: any) {
      setMuteError(cause?.message || "清空聊天记录失败");
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !canManage) return;
    const url = await uploadAvatar(file);
    if (url) await setGroupInfo(id, { faceURL: url });
  };

  const handleJoinMethodChange = async (val: number) => {
    if (!id || !canManage) return;
    await setGroupInfo(id, { needVerification: val } as any);
    setShowJoinMethod(false);
  };

  const handleQuitGroup = async () => {
    try {
      if (group.ownerUserID === currentUser?.userID) {
        await dismissGroup(group.groupID);
      } else {
        await quitGroup(group.groupID);
      }
      setShowConfirmQuit(false);
      navigate("/contact/groups");
    } catch (cause: any) {
      setMuteError(cause?.message || "退出群组失败");
      setShowConfirmQuit(false);
    }
  };


  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/contact/groups")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">群聊信息</h2>
        <button onClick={() => setShowQR(true)} className="ml-auto text-gray-400 hover:text-primary-500"><QrCode size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white px-6 py-6 flex items-center gap-4 border-b border-gray-50">
          <div className="relative">
            <img src={group.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.groupID}`} alt="" className="w-16 h-16 rounded-2xl object-cover bg-gray-100" />
            {canManage && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-sm hover:bg-primary-600 transition-colors"
              >
                <Camera size={12} />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
          </div>
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

        {canManage && (
          <div className="bg-white mt-2 border-y border-gray-50">
            <div className="relative">
              <button
                onClick={() => setShowJoinMethod(!showJoinMethod)}
                className="w-full px-6 py-3.5 flex items-center justify-between text-sm text-gray-500 hover:text-gray-700"
              >
                <span>入群方式</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  {needVerification === 0 ? "申请需审批，邀请直接入群" : needVerification === 1 ? "申请和邀请均需审批" : "无需审批入群"}
                  <ChevronDown size={14} />
                </span>
              </button>
              {showJoinMethod && (
                <div className="absolute right-6 top-full mt-1 z-10 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-40 text-sm" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleJoinMethodChange(0)} className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${needVerification === 0 ? "text-primary-500 font-medium" : "text-gray-600"}`}>申请需审批，邀请直接入群</button>
                  <button onClick={() => handleJoinMethodChange(1)} className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${needVerification === 1 ? "text-primary-500 font-medium" : "text-gray-600"}`}>申请和邀请均需审批</button>
                  <button onClick={() => handleJoinMethodChange(2)} className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${needVerification === 2 ? "text-primary-500 font-medium" : "text-gray-600"}`}>无需审批入群</button>
                </div>
              )}
            </div>
          </div>
        )}

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
          <button onClick={() => { setNickInput(myMember?.nickname || ""); setShowNickname(true); }} className="w-full px-6 py-3.5 text-left text-sm text-gray-500 hover:text-gray-700 flex items-center justify-between">
            <span className="flex items-center gap-2"><Edit3 size={16} /> 我的群昵称</span>
            <span className="text-xs text-gray-400">{myMember?.nickname || currentUser?.nickname || "未设置"}</span>
          </button>
          {groupConversation ? (
            <button disabled={muting} onClick={toggleMute} className="w-full px-6 py-3.5 text-left text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 flex items-center gap-2"><Volume2 size={16} /> {muting ? "设置中..." : isMuted ? "解除免打扰" : "消息免打扰"}</button>
          ) : (
            <div className="w-full px-6 py-3.5 text-sm text-gray-400 flex items-center gap-2"><Volume2 size={16} /> <span>消息免打扰</span><span className="ml-auto text-xs">发送消息后可用</span></div>
          )}
          {groupConversation ? (
            <button onClick={() => setShowConfirmClear(true)} className="w-full px-6 py-3.5 text-left text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"><Trash2 size={16} /> 清空聊天记录</button>
          ) : (
            <div className="w-full px-6 py-3.5 text-sm text-gray-400 flex items-center gap-2"><Trash2 size={16} /> <span>清空聊天记录</span><span className="ml-auto text-xs">暂无本地聊天记录</span></div>
          )}
          {group.ownerUserID === currentUser?.userID ? (
            <button onClick={() => setShowConfirmQuit(true)} className="w-full px-6 py-3.5 text-left text-sm text-red-400 hover:text-red-500 flex items-center gap-2"><LogOut size={16} /> 解散群组</button>
          ) : (
            <button onClick={() => setShowConfirmQuit(true)} className="w-full px-6 py-3.5 text-left text-sm text-red-400 hover:text-red-500 flex items-center gap-2"><LogOut size={16} /> 退出群组</button>
          )}
        </div>
        {muteError && <p role="alert" className="px-6 pt-3 text-sm text-red-500">{muteError}</p>}
      </div>

      {showConfirmClear && <GroupConfirm
        message="确定要清空这个群的本地聊天记录吗？此操作不可恢复。"
        confirmText="清空"
        onCancel={() => setShowConfirmClear(false)}
        onConfirm={handleClearMessages}
      />}
      {showConfirmQuit && <GroupConfirm
        message={group.ownerUserID === currentUser?.userID ? "确定要解散该群吗？此操作不可恢复。" : "确定要退出该群吗？"}
        confirmText={group.ownerUserID === currentUser?.userID ? "解散" : "退出"}
        danger
        onCancel={() => setShowConfirmQuit(false)}
        onConfirm={handleQuitGroup}
      />}

      {/* QR modal */}
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

      {/* Nickname modal */}
      {showNickname && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowNickname(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-80 max-w-[90%] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800">我的群昵称</h3>
              <button onClick={() => setShowNickname(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <input
              value={nickInput}
              onChange={(e) => setNickInput(e.target.value)}
              placeholder="输入群昵称"
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowNickname(false)} className="flex-1 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200 transition-colors">取消</button>
              <button onClick={handleSaveNickname} disabled={!nickInput.trim()} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${nickInput.trim() ? "bg-primary-500 text-white hover:bg-primary-600" : "bg-gray-100 text-gray-300"}`}>保存</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

function GroupConfirm({ message, confirmText, danger = false, onCancel, onConfirm }: { message: string; confirmText: string; danger?: boolean; onCancel: () => void; onConfirm: () => void | Promise<void> }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div className="w-72 rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <p className="mb-4 text-center text-sm text-gray-700">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm text-gray-500">取消</button>
          <button onClick={() => void onConfirm()} className={`flex-1 rounded-lg py-2.5 text-sm text-white ${danger ? "bg-red-500" : "bg-primary-500"}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
