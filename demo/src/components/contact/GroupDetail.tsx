import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Users, Volume2, LogOut, Crown, Shield, QrCode, Settings as SettingsIcon, Edit3, Trash2, Flag, X, Camera, ChevronDown } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { getIMSDK } from "../../services/openim";
import { GroupMemberRole } from "@openim/wasm-client-sdk";

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

  const [showQR, setShowQR] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [nickInput, setNickInput] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [showJoinMethod, setShowJoinMethod] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const group = groups.find((g) => g.groupID === id);

  useEffect(() => {
    if (id) loadMembers(id);
  }, [id]);

  if (!group) return <div className="flex-1 flex items-center justify-center text-gray-300">群组不存在</div>;

  const groupEx = (() => { try { return JSON.parse(group?.ex || "{}"); } catch { return {}; } })();
  const isPublic = groupEx.isPublic ?? false;
  const needVerification = group?.needVerification ?? 0;

  const sorted = [...members].sort((a, b) => (b.roleLevel || 0) - (a.roleLevel || 0));
  const myMember = members.find((m) => m.userID === currentUser?.userID);
  const conversationID = `sg_${group.groupID}`;

  const handleSaveNickname = async () => {
    if (!currentUser || !id || !nickInput.trim()) return;
    await setGroupMemberNickname(id, currentUser.userID, nickInput.trim());
    setShowNickname(false);
    setNickInput("");
  };

  const handleClearMessages = async () => {
    await deleteConversation(conversationID);
    setShowConfirmClear(false);
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    const url = await uploadAvatar(file);
    if (url) await setGroupInfo(id, { faceURL: url });
  };

  const handleTogglePublic = async (val: boolean) => {
    if (!id) return;
    await setGroupInfo(id, { ex: JSON.stringify({ ...groupEx, isPublic: val }) });
  };

  const handleJoinMethodChange = async (val: number) => {
    if (!id) return;
    await setGroupInfo(id, { needVerification: val } as any);
    setShowJoinMethod(false);
  };

  const handleQuitGroup = async () => {
    if (group.ownerUserID === currentUser?.userID) {
      await dismissGroup(group.groupID);
    } else {
      const im = getIMSDK();
      await im.quitGroup(group.groupID);
    }
    setShowConfirmQuit(false);
    navigate("/contact/groups");
  };

  const handleReport = () => {
    if (!reportReason.trim()) return;
    try {
      const raw = localStorage.getItem("99chat_reports");
      const reports = raw ? JSON.parse(raw) : [];
      reports.push({ groupID: group.groupID, reason: reportReason.trim(), time: Date.now() });
      localStorage.setItem("99chat_reports", JSON.stringify(reports));
    } catch {}
    setShowReport(false);
    setReportReason("");
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
            {group.ownerUserID === currentUser?.userID && (
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

        {group.ownerUserID === currentUser?.userID && (
          <div className="bg-white mt-2 border-y border-gray-50">
            <div className="px-6 py-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-500">公开群</span>
              <button
                onClick={() => handleTogglePublic(!isPublic)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isPublic ? "bg-primary-500" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPublic ? "translate-x-5" : ""}`} />
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowJoinMethod(!showJoinMethod)}
                className="w-full px-6 py-3.5 flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 border-t border-gray-50"
              >
                <span>入群方式</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  {needVerification === 0 ? "无需审批入群" : needVerification === 1 ? "需要审批入群" : "禁止入群"}
                  <ChevronDown size={14} />
                </span>
              </button>
              {showJoinMethod && (
                <div className="absolute right-6 top-full mt-1 z-10 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-40 text-sm" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleJoinMethodChange(0)} className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${needVerification === 0 ? "text-primary-500 font-medium" : "text-gray-600"}`}>无需审批入群</button>
                  <button onClick={() => handleJoinMethodChange(1)} className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${needVerification === 1 ? "text-primary-500 font-medium" : "text-gray-600"}`}>需要审批入群</button>
                  <button onClick={() => handleJoinMethodChange(2)} className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${needVerification === 2 ? "text-primary-500 font-medium" : "text-gray-600"}`}>禁止入群</button>
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
          <button className="w-full px-6 py-3.5 text-left text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"><Volume2 size={16} /> 消息免打扰</button>
          <button onClick={() => setShowConfirmClear(true)} className="w-full px-6 py-3.5 text-left text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"><Trash2 size={16} /> 清空聊天记录</button>
          <button onClick={() => setShowReport(true)} className="w-full px-6 py-3.5 text-left text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"><Flag size={16} /> 举报</button>
          {group.ownerUserID === currentUser?.userID ? (
            <button onClick={() => setShowConfirmQuit(true)} className="w-full px-6 py-3.5 text-left text-sm text-red-400 hover:text-red-500 flex items-center gap-2"><LogOut size={16} /> 解散群组</button>
          ) : (
            <button onClick={() => setShowConfirmQuit(true)} className="w-full px-6 py-3.5 text-left text-sm text-red-400 hover:text-red-500 flex items-center gap-2"><LogOut size={16} /> 退出群组</button>
          )}
        </div>
      </div>

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

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-80 max-w-[90%] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800">举报群组</h3>
              <button onClick={() => setShowReport(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="请输入举报原因"
              rows={4}
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200 resize-none"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowReport(false)} className="flex-1 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200 transition-colors">取消</button>
              <button onClick={handleReport} disabled={!reportReason.trim()} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${reportReason.trim() ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-100 text-gray-300"}`}>提交举报</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
