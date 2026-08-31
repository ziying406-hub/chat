import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, QrCode, ScanLine, Share2 } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { ApplicationHandleResult } from "@openim/wasm-client-sdk";
import { useState } from "react";

export default function FriendRequests() {
  const navigate = useNavigate();
  const requests = useAppStore((s) => s.friendRequests);
  const accept = useAppStore((s) => s.acceptFriendRequest);
  const reject = useAppStore((s) => s.rejectFriendRequest);
  const currentUser = useAppStore((s) => s.currentUser);
  const friends = useAppStore((s) => s.friends);
  const [showQR, setShowQR] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareUserID, setShareUserID] = useState("");
  const [addUserID, setAddUserID] = useState("");

  const addFriend = useAppStore((s) => s.addFriend);

  const handleAdd = async () => {
    if (!addUserID.trim()) return;
    try {
      await addFriend(addUserID.trim(), "请求添加好友");
      setAddUserID("");
      setShowScan(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/contact")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">新的朋友</h2>
      </div>

      {/* Quick actions */}
      <div className="bg-white mt-2 px-5 py-4 border-y border-gray-50 flex gap-4">
        <button onClick={() => setShowQR(true)} className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500"><QrCode size={24} /></div>
          <span className="text-xs text-gray-500">我的名片</span>
        </button>
        <button onClick={() => setShowScan(true)} className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500"><ScanLine size={24} /></div>
          <span className="text-xs text-gray-500">扫一扫</span>
        </button>
        <button onClick={() => setShowShareCard(true)} className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500"><Share2 size={24} /></div>
          <span className="text-xs text-gray-500">分享名片</span>
        </button>
      </div>

      {/* Requests list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3">
          <p className="text-xs text-gray-400 font-medium">好友申请</p>
        </div>
        {requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300 text-sm gap-2">
            <Check size={28} className="opacity-30" />
            <span>暂无好友申请</span>
          </div>
        )}
        {requests.map((r: any) => (
          <div key={`${r.fromUserID}-${r.createTime}`} className="bg-white px-5 py-4 border-b border-gray-50 flex items-center gap-3">
            <img src={r.fromFaceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.fromUserID}`} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{r.fromNickname || r.fromUserID}</p>
              <p className="text-xs text-gray-400 mt-0.5">"{r.reqMsg || "请求添加好友"}"</p>
            </div>
            {r.handleStatus === ApplicationHandleResult.Unprocessed ? (
              <div className="flex gap-2">
                <button onClick={() => accept(r.fromUserID)} className="w-9 h-9 rounded-lg bg-primary-50 text-primary-500 hover:bg-primary-100 transition-colors flex items-center justify-center"><Check size={18} /></button>
                <button onClick={() => reject(r.fromUserID)} className="w-9 h-9 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors flex items-center justify-center"><X size={18} /></button>
              </div>
            ) : (
              <span className={`text-xs px-3 py-1 rounded-full ${r.handleStatus === ApplicationHandleResult.Accepted ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-400"}`}>
                {r.handleStatus === ApplicationHandleResult.Accepted ? "已通过" : "已拒绝"}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* My QR Code modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800">{currentUser?.nickname || "我"}</h3>
            <div className="w-48 h-48 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center p-3">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=99chat:user:${currentUser?.userID}`} alt="QR" className="w-full h-full" />
            </div>
            <p className="text-sm text-gray-400">扫描二维码加我好友</p>
            <button onClick={() => setShowQR(false)} className="px-6 py-2 bg-primary-500 text-white rounded-xl text-sm hover:bg-primary-600 transition-colors">关闭</button>
          </div>
        </div>
      )}

      {/* Scan/Add modal */}
      {showScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowScan(false)}>
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800">添加好友</h3>
            <input
              value={addUserID}
              onChange={(e) => setAddUserID(e.target.value)}
              placeholder="输入用户 ID"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button onClick={handleAdd} className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">发送申请</button>
            <button onClick={() => setShowScan(false)} className="text-sm text-gray-400 hover:text-gray-600">取消</button>
          </div>
        </div>
      )}

      {/* Share contact card modal */}
      {showShareCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setShowShareCard(false); setShareUserID(''); }}>
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800">分享名片</h3>
            {!shareUserID ? (
              <>
                <p className="text-sm text-gray-400">选择要分享的好友</p>
                <div className="w-full max-h-60 overflow-y-auto">
                  {friends.length === 0 && <p className="text-center text-sm text-gray-300 py-4">暂无好友</p>}
                  {friends.map((f) => (
                    <button
                      key={f.userID}
                      onClick={() => setShareUserID(f.userID)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <img src={f.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.userID}`} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                      <span className="text-sm font-medium text-gray-700">{f.remark || f.nickname || f.userID}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowShareCard(false); setShareUserID(''); }} className="text-sm text-gray-400 hover:text-gray-600">取消</button>
              </>
            ) : (
              (() => {
                const f = friends.find((fr) => fr.userID === shareUserID);
                const nickname = f?.nickname || shareUserID;
                const faceURL = f?.faceURL || '';
                return (
                  <>
                    <p className="text-sm text-gray-400">{nickname} 的名片</p>
                    <div className="w-48 h-48 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center p-3">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=99chat:user:${shareUserID}`} alt="QR" className="w-full h-full" />
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${shareUserID}`} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{nickname}</p>
                        <p className="text-xs text-gray-400">ID: {shareUserID}</p>
                      </div>
                    </div>
                    <button onClick={() => { setShowShareCard(false); setShareUserID(''); }} className="px-6 py-2 bg-primary-500 text-white rounded-xl text-sm hover:bg-primary-600 transition-colors">关闭</button>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}