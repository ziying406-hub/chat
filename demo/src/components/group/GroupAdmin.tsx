import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Crown, Shield, UserPlus, UserMinus, VolumeX, LogOut, Check, X, Bell,
} from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { getIMSDK } from "../../services/openim";
import { GroupMemberRole, GroupStatus } from "@openim/wasm-client-sdk";

type AdminTab = "members" | "admins" | "applications" | "settings";

export default function GroupAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groups = useAppStore((s) => s.groups);
  const members = useAppStore((s) => (id ? s.groupMembersMap[id] : undefined)) || [];
  const loadMembers = useAppStore((s) => s.loadGroupMembers);
  const currentUser = useAppStore((s) => s.currentUser);
  const groupRequests = useAppStore((s) => s.groupRequests);
  const loadGroupApps = useAppStore((s) => s.loadGroupApplications);
  const dismissGroup = useAppStore((s) => s.dismissGroup);
  const setGroupInfo = useAppStore((s) => s.setGroupInfo);
  const muteMember = useAppStore((s) => s.muteGroupMember);
  const muteGroup = useAppStore((s) => s.muteGroup);
  const transferGroupOwner = useAppStore((s) => s.transferGroupOwner);
  const setGroupMemberRole = useAppStore((s) => s.setGroupMemberRole);
  const kickFromGroup = useAppStore((s) => s.kickFromGroup);
  const inviteToGroup = useAppStore((s) => s.inviteToGroup);
  const acceptGroupApp = useAppStore((s) => s.acceptGroupApplication);
  const refuseGroupApp = useAppStore((s) => s.refuseGroupApplication);

  const [tab, setTab] = useState<AdminTab>(() => searchParams.get("tab") === "applications" ? "applications" : "members");
  const [groupName, setGroupName] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [intro, setIntro] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [updatingGroupMute, setUpdatingGroupMute] = useState(false);
  const [memberKeyword, setMemberKeyword] = useState("");
  const [memberResults, setMemberResults] = useState<typeof members | null>(null);
  const [searchingMembers, setSearchingMembers] = useState(false);

  const group = groups.find((g) => g.groupID === id);
  const isOwner = group?.ownerUserID === currentUser?.userID;
  const isAdmin = members.some((m) => m.userID === currentUser?.userID && m.roleLevel >= GroupMemberRole.Admin);

  useEffect(() => {
    if (id) { loadMembers(id); loadGroupApps(); }
  }, [id]);

  useEffect(() => {
    if (group) {
      setGroupName(group.groupName);
      setAnnouncement(group.notification || "");
      setIntro(group.introduction || "");
    }
  }, [group]);

  if (!group) return <div className="flex-1 flex items-center justify-center text-gray-300">群组不存在</div>;

  const sorted = [...members].sort((a, b) => (b.roleLevel || 0) - (a.roleLevel || 0));
  const admins = sorted.filter((m) => m.roleLevel >= GroupMemberRole.Admin);
  const pendingApps = groupRequests.filter((r: any) => r.groupID === id);

  const handleSave = async () => {
    await setGroupInfo(id!, { groupName, notification: announcement, introduction: intro });
  };

  const handleMute = async (member: typeof members[number]) => {
    const muted = Boolean(member.muteEndTime && member.muteEndTime > Date.now() / 1000);
    await muteMember(id!, member.userID, muted ? 0 : 3600);
  };

  const handleKick = async (userID: string) => {
    if (!confirm("确定移出该成员？")) return;
    await kickFromGroup(id!, [userID], "管理员移出");
    await loadMembers(id!);
  };

  const handleGroupMute = async () => {
    if (!id) return;
    setUpdatingGroupMute(true);
    try {
      await muteGroup(id, group.status !== GroupStatus.Muted);
    } finally {
      setUpdatingGroupMute(false);
    }
  };

  const handleTransferOwner = async (member: typeof members[number]) => {
    if (!id || !confirm(`确定将群主转让给 ${member.nickname || member.userID}？`)) return;
    await transferGroupOwner(id, member.userID);
    await loadMembers(id);
  };

  const handleSetAdmin = async (member: typeof members[number]) => {
    if (!id) return;
    const nextRole = member.roleLevel === GroupMemberRole.Admin ? GroupMemberRole.Normal : GroupMemberRole.Admin;
    await setGroupMemberRole(id, member.userID, nextRole);
  };

  const handleMemberSearch = async () => {
    const keyword = memberKeyword.trim();
    if (!keyword) {
      setMemberResults(null);
      return;
    }
    setSearchingMembers(true);
    try {
      const result = await getIMSDK().searchGroupMembers({
        groupID: id!,
        keywordList: [keyword],
        isSearchUserID: true,
        isSearchMemberNickname: true,
        offset: 0,
        count: 50,
      });
      const normalizedKeyword = keyword.toLowerCase();
      setMemberResults((result.data || []).filter((member: any) =>
        [member.userID, member.nickname].some((value) => value?.toLowerCase().includes(normalizedKeyword)),
      ));
    } catch (error) {
      console.error("searchGroupMembers:", error);
      setMemberResults([]);
    } finally {
      setSearchingMembers(false);
    }
  };

  const visibleMembers = memberResults === null ? sorted : [...memberResults].sort((a, b) => (b.roleLevel || 0) - (a.roleLevel || 0));

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate(`/messages/session/sg_${id}`)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">群管理</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white px-4 py-2 border-b border-gray-50">
        {(["members", "admins", "applications", "settings"] as AdminTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${tab === t ? "bg-primary-50 text-primary-600" : "text-gray-400 hover:bg-gray-50"}`}
          >
            {t === "members" ? "成员" : t === "admins" ? "管理员" : t === "applications" ? `入群申请${pendingApps.length > 0 ? ` (${pendingApps.length})` : ""}` : "设置"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Members tab */}
        {tab === "members" && (
          <div className="bg-white">
            <div className="px-5 py-3 border-b border-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">群成员（{members.length}）</span>
                {isAdmin && (
                  <button onClick={() => setShowInvite(true)} className="text-sm text-primary-500 flex items-center gap-1"><UserPlus size={16} /> 邀请</button>
                )}
              </div>
              <div className="flex gap-2">
                <input value={memberKeyword} onChange={(event) => { setMemberKeyword(event.target.value); if (!event.target.value) setMemberResults(null); }} onKeyDown={(event) => event.key === "Enter" && handleMemberSearch()} placeholder="搜索群成员" className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200" />
                <button onClick={handleMemberSearch} disabled={searchingMembers} className="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm disabled:opacity-50">{searchingMembers ? "搜索中" : "搜索"}</button>
              </div>
            </div>
            {visibleMembers.map((m) => (
              <div key={m.userID} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <img src={m.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userID}`} alt="" className="w-10 h-10 rounded-xl object-cover bg-gray-100" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-700">{m.userID === currentUser?.userID ? "我" : (m.nickname || m.userID)}</span>
                    {m.roleLevel === GroupMemberRole.Owner && <Crown size={14} className="text-amber-400" />}
                    {m.roleLevel === GroupMemberRole.Admin && <Shield size={14} className="text-blue-400" />}
                    {(m.muteEndTime && m.muteEndTime > Date.now() / 1000) && <VolumeX size={14} className="text-red-300" />}
                  </div>
                  <span className="text-xs text-gray-400">{m.roleLevel === GroupMemberRole.Owner ? "群主" : m.roleLevel === GroupMemberRole.Admin ? "管理员" : "成员"}</span>
                </div>
                {isAdmin && m.roleLevel < GroupMemberRole.Owner && m.userID !== currentUser?.userID && (
                  <div className="flex gap-1">
                    {isOwner && <button aria-label={`${m.roleLevel === GroupMemberRole.Admin ? "取消管理员" : "设为管理员"} ${m.nickname || m.userID}`} onClick={() => handleSetAdmin(m)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center"><Shield size={14} /></button>}
                    {isOwner && m.roleLevel < GroupMemberRole.Admin && <button aria-label={`转让群主 ${m.nickname || m.userID}`} onClick={() => handleTransferOwner(m)} className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 flex items-center justify-center"><Crown size={14} /></button>}
                    {m.roleLevel < GroupMemberRole.Admin && <button aria-label={`${m.muteEndTime && m.muteEndTime > Date.now() / 1000 ? "解除禁言" : "禁言"} ${m.nickname || m.userID}`} onClick={() => handleMute(m)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 flex items-center justify-center"><VolumeX size={14} /></button>}
                    {m.roleLevel < GroupMemberRole.Admin && <button aria-label={`移除 ${m.nickname || m.userID}`} onClick={() => handleKick(m.userID)} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"><UserMinus size={14} /></button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Admins tab */}
        {tab === "admins" && (
          <div className="bg-white">
            <div className="px-5 py-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">管理员（{admins.length}）</span>
            </div>
            {admins.map((m) => (
              <div key={m.userID} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
                <img src={m.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userID}`} alt="" className="w-10 h-10 rounded-xl object-cover bg-gray-100" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">{m.nickname || m.userID}</span>
                  <span className="text-xs text-gray-400 ml-2">{m.roleLevel === GroupMemberRole.Owner ? "群主" : "管理员"}</span>
                </div>
                {m.roleLevel === GroupMemberRole.Owner && <Crown size={16} className="text-amber-400" />}
                {m.roleLevel === GroupMemberRole.Admin && <Shield size={16} className="text-blue-400" />}
              </div>
            ))}
          </div>
        )}

        {/* Applications tab */}
        {tab === "applications" && (
          <div className="bg-white">
            {pendingApps.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300 text-sm gap-2">
                <Bell size={24} className="opacity-30" /><span>暂无入群申请</span>
              </div>
            )}
            {pendingApps.map((app: any) => (
              <div key={app.userID + app.groupID} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
                <img src={app.fromFaceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.userID}`} alt="" className="w-10 h-10 rounded-xl object-cover bg-gray-100" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{app.fromNickname || app.userID}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{app.reqMsg || "申请加入群组"}</p>
                </div>
                <div className="flex gap-2">
                  <button aria-label={`同意 ${app.fromNickname || app.userID}`} onClick={() => acceptGroupApp(app.groupID, app.userID)} className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 hover:bg-primary-100 flex items-center justify-center"><Check size={16} /></button>
                  <button aria-label={`拒绝 ${app.fromNickname || app.userID}`} onClick={() => refuseGroupApp(app.groupID, app.userID)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 flex items-center justify-center"><X size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settings tab */}
        {tab === "settings" && (
          <div className="bg-white">
            <div className="px-5 py-4 border-b border-gray-50">
              <label className="text-sm text-gray-500 block mb-1">群名称</label>
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200" />
            </div>
            <div className="px-5 py-4 border-b border-gray-50">
              <label className="text-sm text-gray-500 block mb-1">群公告</label>
              <textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} rows={3} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200 resize-none" />
            </div>
            <div className="px-5 py-4 border-b border-gray-50">
              <label className="text-sm text-gray-500 block mb-1">群简介</label>
              <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200 resize-none" />
            </div>
            {isOwner && (
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">全员禁言</p>
                  <p className="text-xs text-gray-400 mt-1">开启后，只有群主和管理员可发言</p>
                </div>
                <button role="switch" aria-label="全员禁言" aria-checked={group.status === GroupStatus.Muted} onClick={handleGroupMute} disabled={updatingGroupMute} className={`w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${group.status === GroupStatus.Muted ? "bg-primary-500" : "bg-gray-200"}`}>
                  <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${group.status === GroupStatus.Muted ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            )}
            <div className="px-5 py-4">
              <button onClick={handleSave} className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">保存</button>
            </div>
            <div className="px-5 py-3 border-t border-gray-50">
              {isOwner ? (
                <button onClick={() => { if (confirm("确定解散群组？")) { dismissGroup(id!); navigate("/contact/groups"); } }} className="w-full text-left text-sm text-red-400 hover:text-red-500 flex items-center gap-2 py-2"><LogOut size={16} /> 解散群组</button>
              ) : (
                <button onClick={async () => { if (confirm("确定退出群组？")) { await getIMSDK().quitGroup(id!); navigate("/contact/groups"); } }} className="w-full text-left text-sm text-red-400 hover:text-red-500 flex items-center gap-2 py-2"><LogOut size={16} /> 退出群组</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-800 mb-3">邀请好友</h3>
            <p className="text-sm text-gray-400 mb-4">从好友列表中选择要邀请的成员</p>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {useAppStore.getState().friends.map((f) => (
                <button
                  key={f.userID}
                  onClick={async () => {
                    if (!id) return;
                    if (!confirm(`邀请 ${f.nickname || f.userID} 加入群组？`)) return;
                    await inviteToGroup(id, [f.userID], "邀请加入群组");
                    setShowInvite(false);
                    await loadMembers(id);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <img src={f.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.userID}`} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                  <span className="text-sm text-gray-700">{f.remark || f.nickname || f.userID}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowInvite(false)} className="w-full mt-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm hover:bg-gray-100">取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
