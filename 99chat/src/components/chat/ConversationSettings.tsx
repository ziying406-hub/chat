import { useEffect, useState } from "react";
import UnavailableDetail from "../layout/UnavailableDetail";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BellOff, ChevronRight, EyeOff, Image as ImageIcon, Pin, Search, ShieldAlert, Trash2, Users } from "lucide-react";
import { SessionType } from "@openim/wasm-client-sdk";
import { useAppStore } from "../../store/app-store";
import { getIMSDK } from "../../services/openim";
import { groupPermissions } from "../../utils/group-permissions";

export default function ConversationSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const conv = useAppStore((s) => s.conversations.find((item) => item.conversationID === id));
  const groups = useAppStore((s) => s.groups);
  const currentUser = useAppStore((s) => s.currentUser);
  const groupMembers = useAppStore((s) => s.groupMembersMap);
  const loadMembers = useAppStore((s) => s.loadGroupMembers);
  const pinConversation = useAppStore((s) => s.pinConversation);
  const muteConversation = useAppStore((s) => s.muteConversation);
  const deleteConversation = useAppStore((s) => s.deleteConversation);
  const hideConversation = useAppStore((s) => s.hideConversation);
  const dismissGroup = useAppStore((s) => s.dismissGroup);
  const quitGroup = useAppStore((s) => s.quitGroup);
  const refreshConversations = useAppStore((s) => s.refreshConversations);
  const [burnEnabled, setBurnEnabled] = useState(Boolean((conv as any)?.isMsgDestruct));
  const [busy, setBusy] = useState<"burn" | "mute" | "pin" | "clear" | "leave" | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBurnEnabled(Boolean((conv as any)?.isMsgDestruct));
  }, [conv]);

  useEffect(() => {
    if (conv?.groupID) loadMembers(conv.groupID);
  }, [conv?.groupID, loadMembers]);

  if (!id || !conv) {
    return <UnavailableDetail to="/messages" label="返回聊天列表">会话不存在</UnavailableDetail>;
  }

  const isGroup = conv.conversationType === SessionType.Group;
  const group = isGroup ? groups.find((item) => item.groupID === conv.groupID) : null;
  const muted = conv.recvMsgOpt !== 0;
  const pinned = Boolean((conv as any).isPinned);
  const { isOwner, canManage } = groupPermissions(group?.ownerUserID, currentUser?.userID, groupMembers[group?.groupID || ""] || []);
  const joinMethod = group?.needVerification === 0 ? "申请需审批，邀请直接入群" : group?.needVerification === 1 ? "申请和邀请均需审批" : "无需审批入群";

  const run = async (kind: "burn" | "mute" | "pin", action: () => Promise<void>) => {
    setBusy(kind);
    setError("");
    try {
      await action();
    } catch (cause: any) {
      setError(cause?.message || "操作失败，请重试");
    } finally {
      setBusy(null);
    }
  };

  const toggleBurn = () => run("burn", async () => {
    const next = !burnEnabled;
    await getIMSDK().setConversation({ conversationID: id, isMsgDestruct: next, burnDuration: next ? 86400 : 0 });
    setBurnEnabled(next);
    await refreshConversations();
  });

  const toggleMute = () => run("mute", async () => {
    await muteConversation(id, muted ? 0 : 2);
  });

  const togglePin = () => run("pin", async () => {
    await pinConversation(id, !pinned);
  });

  const hide = async () => {
    setBusy("clear");
    try {
      await hideConversation(id);
      navigate("/messages", { replace: true });
    } catch (cause: any) {
      setError(cause?.message || "隐藏失败，请重试");
      setBusy(null);
      setShowHideConfirm(false);
    }
  };

  const clearHistory = async () => {
    setBusy("clear");
    setError("");
    try {
      await deleteConversation(id);
      navigate("/messages", { replace: true });
    } catch (cause: any) {
      setError(cause?.message || "清除失败，请重试");
      setBusy(null);
      setShowClearConfirm(false);
    }
  };

  const leaveGroup = async () => {
    if (!group) return;
    setBusy("leave");
    setError("");
    try {
      if (isOwner) await dismissGroup(group.groupID);
      else await quitGroup(group.groupID);
      navigate("/messages", { replace: true });
    } catch (cause: any) {
      setError(cause?.message || "操作失败，请重试");
      setBusy(null);
      setShowLeaveConfirm(false);
    }
  };

  const Toggle = ({ checked, onClick, disabled }: { checked: boolean; onClick: () => void; disabled?: boolean }) => (
    <button type="button" role="switch" aria-checked={checked} onClick={onClick} disabled={disabled} className={`w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-primary-500" : "bg-gray-200"}`}>
      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  const Row = ({ label, onClick, value, icon }: { label: string; onClick: () => void; value?: string; icon?: React.ReactNode }) => (
    <button onClick={onClick} className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0">
      {icon}
      <span className="flex-1 text-sm text-gray-700">{label}</span>
      {value && <span className="text-sm text-gray-400 truncate max-w-48">{value}</span>}
      <ChevronRight size={16} className="text-gray-300" />
    </button>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
      <header className="h-16 px-5 bg-white border-b border-gray-100 flex items-center gap-3">
        <button aria-label="返回聊天" onClick={() => navigate(`/messages/session/${id}`)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">{isGroup ? "群聊设置" : "聊天设置"}</h2>
      </header>

      {isGroup && group && (
        <div className="mt-2 bg-white border-y border-gray-100">
          <Row label="群组管理" icon={<Users size={18} className="text-gray-400" />} onClick={() => navigate(`/messages/groups/admin/${group.groupID}`)} />
          {canManage && <Row label="入群申请" onClick={() => navigate(`/messages/groups/admin/${group.groupID}?tab=applications`)} />}
          <Row label="入群方式" value={joinMethod} onClick={() => navigate(`/contact/group/${group.groupID}`)} />
          <Row label="群公告" onClick={() => navigate(`/contact/group/${group.groupID}`)} />
          <Row label="群二维码" onClick={() => navigate(`/contact/group/${group.groupID}`)} />
          <Row label="我在本群的昵称" onClick={() => navigate(`/contact/group/${group.groupID}`)} />
        </div>
      )}

      <div className="mt-2 bg-white border-y border-gray-100">
        <Row label="图片与视频" icon={<ImageIcon size={18} className="text-gray-400" />} onClick={() => navigate(`/messages/session/${id}/settings/media`)} />
        {!isGroup && (
          <div className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-50">
            <ShieldAlert size={18} className="text-gray-400" />
            <span className="flex-1 text-sm text-gray-700">阅后即焚</span>
            <Toggle checked={burnEnabled} onClick={toggleBurn} disabled={busy === "burn"} />
          </div>
        )}
        <div className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-50">
          <BellOff size={18} className="text-gray-400" />
          <span className="flex-1 text-sm text-gray-700">消息免打扰</span>
          <Toggle checked={muted} onClick={toggleMute} disabled={busy === "mute"} />
        </div>
        <div className="px-5 py-3.5 flex items-center gap-3">
          <Pin size={18} className="text-gray-400" />
          <span className="flex-1 text-sm text-gray-700">置顶聊天</span>
          <Toggle checked={pinned} onClick={togglePin} disabled={busy === "pin"} />
        </div>
      </div>

      <div className="mt-2 bg-white border-y border-gray-100">
        <Row label="搜索聊天记录" icon={<Search size={18} className="text-gray-400" />} onClick={() => navigate(`/messages/session/${id}/settings/search`)} />
        <Row label="隐藏聊天" icon={<EyeOff size={18} className="text-gray-400" />} onClick={() => setShowHideConfirm(true)} />
        <Row label="清除聊天记录" icon={<Trash2 size={18} className="text-gray-400" />} onClick={() => setShowClearConfirm(true)} />
        {isGroup && <button onClick={() => setShowLeaveConfirm(true)} className="w-full px-5 py-3.5 flex items-center gap-3 text-left text-red-500 hover:bg-red-50">{isOwner ? "解散群" : "退出群"}<ChevronRight size={16} className="ml-auto" /></button>}
      </div>

      {error && <p className="px-5 pt-3 text-sm text-red-500">{error}</p>}

      {showHideConfirm && <Confirm text="隐藏聊天不会删除消息，收到新消息后会重新显示。" confirmText={busy === "clear" ? "处理中..." : "隐藏"} disabled={Boolean(busy)} onCancel={() => setShowHideConfirm(false)} onConfirm={hide} />}
      {showClearConfirm && <Confirm text="确定要清除聊天记录吗？此操作不可恢复。" confirmText={busy === "clear" ? "清除中..." : "确定"} disabled={Boolean(busy)} onCancel={() => setShowClearConfirm(false)} onConfirm={clearHistory} />}
      {showLeaveConfirm && <Confirm text={isOwner ? "确定要解散该群吗？此操作不可恢复。" : "确定要退出该群吗？"} confirmText={busy === "leave" ? "处理中..." : "确定"} disabled={Boolean(busy)} onCancel={() => setShowLeaveConfirm(false)} onConfirm={leaveGroup} danger />}
    </div>
  );
}

function Confirm({ text, confirmText, disabled, onCancel, onConfirm, danger = false }: { text: string; confirmText: string; disabled: boolean; onCancel: () => void; onConfirm: () => void; danger?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => !disabled && onCancel()}>
      <div className="w-72 rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <p className="mb-4 text-center text-sm text-gray-700">{text}</p>
        <div className="flex gap-2">
          <button disabled={disabled} onClick={onCancel} className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm text-gray-500 disabled:opacity-50">取消</button>
          <button disabled={disabled} onClick={onConfirm} className={`flex-1 rounded-lg py-2.5 text-sm text-white disabled:opacity-50 ${danger ? "bg-red-500" : "bg-primary-500"}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
