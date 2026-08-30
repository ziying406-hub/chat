import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { formatTime } from "../../utils/format";

export default function FriendRequests() {
  const navigate = useNavigate();
  const requests = useAppStore((s) => s.friendRequests);
  const accept = useAppStore((s) => s.acceptFriendRequest);
  const reject = useAppStore((s) => s.rejectFriendRequest);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/contact")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">好友申请</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {requests.length === 0 && (
          <div className="flex items-center justify-center py-20 text-gray-300 text-sm">暂无好友申请</div>
        )}
        {requests.map((r) => (
          <div key={r.id} className="bg-white px-5 py-4 border-b border-gray-50 flex items-center gap-3">
            <img src={r.fromFaceURL} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{r.fromNickname}</p>
              <p className="text-xs text-gray-400 mt-0.5">"{r.reqMsg}"</p>
              <p className="text-xs text-gray-300 mt-0.5">{formatTime(r.createTime)}</p>
            </div>
            {r.handleStatus === "pending" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => accept(r.id)}
                  className="w-9 h-9 rounded-lg bg-primary-50 text-primary-500 hover:bg-primary-100 transition-colors flex items-center justify-center"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => reject(r.id)}
                  className="w-9 h-9 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <span className={`text-xs px-3 py-1 rounded-full ${r.handleStatus === "accepted" ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-400"}`}>
                {r.handleStatus === "accepted" ? "已通过" : "已拒绝"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
