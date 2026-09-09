import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, QrCode, Tag, Ban, UserMinus } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { getIMSDK } from "../../services/openim";
import { SessionType } from "@openim/wasm-client-sdk";
import { useState, useEffect } from "react";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const friends = useAppStore((s) => s.friends);
  const conversations = useAppStore((s) => s.conversations);
  const setActive = useAppStore((s) => s.setActiveConversation);
  const refreshConversations = useAppStore((s) => s.refreshConversations);
  const currentUser = useAppStore((s) => s.currentUser);
  const setFriendRemark = useAppStore((s) => s.setFriendRemark);
  const deleteFriend = useAppStore((s) => s.deleteFriend);
  const addBlack = useAppStore((s) => s.addBlack);
  const removeBlack = useAppStore((s) => s.removeBlack);
  const blackList = useAppStore((s) => s.blackList);
  const onlineStatus = useAppStore((s) => s.onlineStatus);
  const loadOnlineStatus = useAppStore((s) => s.loadOnlineStatus);

  const [showQR, setShowQR] = useState(false);
  const [showRemark, setShowRemark] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showBlackConfirm, setShowBlackConfirm] = useState(false);

  useEffect(() => {
    if (id) loadOnlineStatus([id]);
  }, [id]);

  const friend = friends.find((f) => f.userID === id);
  const isSelf = id === currentUser?.userID;
  const user = isSelf ? currentUser : friend;

  if (!user) return <div className="flex-1 flex items-center justify-center text-gray-300">用户不存在</div>;

  const isFriend = !!friend;
  const isBlacklisted = blackList.some((b: any) => b.userID === id);
  const conv = conversations.find((c) => c.conversationType === 1 && c.userID === id);

  const handleChat = async () => {
    if (!id) return;
    let conversationID = conv?.conversationID;
    if (!conversationID) {
      const result = await getIMSDK().getOneConversation({ sourceID: id, sessionType: SessionType.Single });
      conversationID = result.data?.conversationID;
      await refreshConversations();
    }
    if (conversationID) {
      setActive(conversationID);
      navigate(`/messages/session/${conversationID}`);
    }
  };

  const handleRemark = async () => {
    if (id) await setFriendRemark(id, remarkText);
    setShowRemark(false);
  };

  const handleDelete = async () => {
    if (id) await deleteFriend(id);
    setShowDelete(false);
    navigate("/contact");
  };

  const handleAddBlack = async () => {
    if (id) await addBlack(id);
    setShowBlackConfirm(false);
  };

  const handleRemoveBlack = async () => {
    if (id) await removeBlack(id);
    setShowBlackConfirm(false);
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
          {friend && (friend as any).remark && (
            <p className="text-sm text-gray-400 mt-0.5">备注: {(friend as any).remark}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            {!isSelf && (
              <span className="flex items-center gap-1 text-xs">
                <span className={`w-2 h-2 rounded-full ${onlineStatus[id!] ? "bg-green-500" : "bg-gray-300"}`} />
                <span className={onlineStatus[id!] ? "text-green-500" : "text-gray-400"}>{onlineStatus[id!] ? "在线" : "离线"}</span>
              </span>
            )}
            <span className="text-xs text-gray-400">ID: {id}</span>
          </div>
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

      {!isSelf && isFriend && (
        <div className="mt-2 bg-white px-6 py-4 flex gap-4 border-b border-gray-50">
          <button onClick={handleChat} className="w-full py-3 bg-primary-50 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors flex items-center justify-center gap-2">
            <MessageSquare size={18} /> 发消息
          </button>
        </div>
      )}

      {!isSelf && (
        <div className="mt-2 bg-white border-y border-gray-50">
          {isFriend && (
            <button onClick={() => { setRemarkText((friend as any).remark || ""); setShowRemark(true); }} className="w-full px-6 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <Tag size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">设置备注和标签</span>
            </button>
          )}
          <button onClick={() => setShowBlackConfirm(true)} className="w-full px-6 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50">
            <Ban size={18} className="text-gray-400" />
            <span className="text-sm text-gray-600">{isBlacklisted ? "移出黑名单" : "加入黑名单"}</span>
          </button>
          {isFriend && (
            <button onClick={() => setShowDelete(true)} className="w-full px-6 py-3.5 flex items-center gap-3 hover:bg-red-50 transition-colors">
              <UserMinus size={18} className="text-red-400" />
              <span className="text-sm text-red-500">删除好友</span>
            </button>
          )}
        </div>
      )}

      {showBlackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowBlackConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-72 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-800">{isBlacklisted ? "移出黑名单" : "加入黑名单"}</h3>
            <p className="text-sm text-gray-500">{isBlacklisted ? "确定将该用户移出黑名单？" : "确定将该用户加入黑名单？"}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowBlackConfirm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
              <button onClick={isBlacklisted ? handleRemoveBlack : handleAddBlack} className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">确定</button>
            </div>
          </div>
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

      {showRemark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowRemark(false)}>
          <div className="bg-white rounded-2xl p-6 w-80 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-800">设置备注</h3>
            <input
              autoFocus
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="输入备注名"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRemark(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
              <button onClick={handleRemark} className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">确定</button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDelete(false)}>
          <div className="bg-white rounded-2xl p-6 w-72 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-800">删除好友</h3>
            <p className="text-sm text-gray-500">确定要删除好友 "{(user as any).nickname || id}" 吗？删除后将无法恢复。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
