import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Search, UserPlus, Users, Tag } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { useState } from "react";

export default function ContactList() {
  const friends = useAppStore((s) => s.friends);
  const friendRequests = useAppStore((s) => s.friendRequests);
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");

  const pendingRequests = friendRequests.filter((r) => (r as any).handleStatus === 0).length;
  const isActive = (path: string) => location.pathname === path;

  const filteredFriends = friends.filter(
    (f) => (f.nickname || "").includes(search) || (f.remark || "").includes(search)
  );

  return (
    <>
      <div className="w-[320px] border-r border-gray-100 flex flex-col bg-white">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">通讯录</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索联系人"
              className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary-200 transition-all"
            />
          </div>
        </div>

        <div className="px-2 py-2 border-b border-gray-50">
          <button
            onClick={() => navigate("/contact/requests")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive("/contact/requests") ? "bg-primary-50 text-primary-600" : "hover:bg-gray-50"}`}
          >
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
              <UserPlus size={18} />
            </div>
            <span className="text-sm font-medium">新的朋友</span>
            {pendingRequests > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center">{pendingRequests}</span>
            )}
          </button>
          <button
            onClick={() => navigate("/contact/groups")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive("/contact/groups") ? "bg-primary-50 text-primary-600" : "hover:bg-gray-50"}`}
          >
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-500"><Users size={18} /></div>
            <span className="text-sm font-medium">群组列表</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500"><Tag size={18} /></div>
            <span className="text-sm font-medium">标签</span>
          </button>
        </div>

        <div className="px-4 py-2">
          <p className="text-xs text-gray-400 font-medium">好友（{filteredFriends.length}）</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredFriends.map((f) => (
            <button
              key={f.userID}
              onClick={() => navigate(`/contact/user/${f.userID}`)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 ${isActive(`/contact/user/${f.userID}`) ? "bg-primary-50" : ""}`}
            >
              <div className="relative flex-shrink-0">
                <img src={f.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.userID}`} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">{f.remark || f.nickname || f.userID}</p>
              </div>
            </button>
          ))}
          {filteredFriends.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300 text-sm gap-2">
              <UserPlus size={28} className="opacity-30" />
              <span>暂无好友</span>
            </div>
          )}
        </div>
      </div>
      <Outlet />
    </>
  );
}
