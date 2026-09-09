import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Search, UserPlus, Users, Tag, UserSearch } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { useState } from "react";

type SortOption = "按名称" | "按最近聊天" | "按最近加入";

export default function ContactList() {
  const friends = useAppStore((s) => s.friends);
  const friendRequests = useAppStore((s) => s.friendRequests);
  const conversations = useAppStore((s) => s.conversations);
  const onlineStatus = useAppStore((s) => s.onlineStatus);
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("按名称");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);

  const pendingRequests = friendRequests.filter((r: any) => (r as any).handleResult === 0).length;
  const isActive = (path: string) => location.pathname === path;

  const filteredFriends = friends.filter(
    (f) => (f.nickname || "").includes(search) || (f.remark || "").includes(search)
  );

  const visibleFriends = filteredFriends
    .filter((f) => !onlineOnly || onlineStatus[f.userID])
    .sort((a, b) => {
      if (sortBy === "按名称") {
        return (a.remark || a.nickname || a.userID).localeCompare(b.remark || b.nickname || b.userID);
      }
      if (sortBy === "按最近聊天") {
        const convA = conversations.find((c) => c.userID === a.userID);
        const convB = conversations.find((c) => c.userID === b.userID);
        const tsA = convA?.latestMsgSendTime || 0;
        const tsB = convB?.latestMsgSendTime || 0;
        return tsB - tsA;
      }
      // 按最近加入
      return (b.createTime || 0) - (a.createTime || 0);
    });

  const sortOptions: SortOption[] = ["按名称", "按最近聊天", "按最近加入"];

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
          <button
            onClick={() => navigate("/contact/search/user")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors ${isActive("/contact/search/user") ? "bg-primary-50 text-primary-600" : ""}`}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500"><UserSearch size={18} /></div>
            <span className="text-sm font-medium">搜索用户</span>
          </button>
          <button
            onClick={() => navigate("/contact/search/group")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors ${isActive("/contact/search/group") ? "bg-primary-50 text-primary-600" : ""}`}
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500"><Users size={18} /></div>
            <span className="text-sm font-medium">搜索群组</span>
          </button>
          <button
            onClick={() => navigate("/contact/tags")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive("/contact/tags") ? "bg-primary-50 text-primary-600" : "hover:bg-gray-50"}`}
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500"><Tag size={18} /></div>
            <span className="text-sm font-medium">标签</span>
          </button>
        </div>

        <div className="px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-medium">好友（{visibleFriends.length}）</p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary-500"
              />
              <span className="text-xs text-gray-400">仅看在线</span>
            </label>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
              >
                {sortBy}
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-6 z-20 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[100px]" onClick={() => setShowSortMenu(false)}>
                  {sortOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSortBy(opt)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${sortBy === opt ? "text-primary-600 font-medium" : "text-gray-500"}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {visibleFriends.map((f) => {
            const isOnline = onlineStatus[f.userID];
            return (
              <button
                key={f.userID}
                onClick={() => navigate(`/contact/user/${f.userID}`)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 ${isActive(`/contact/user/${f.userID}`) ? "bg-primary-50" : ""}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={f.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.userID}`} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                  {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700">{f.remark || f.nickname || f.userID}</p>
                </div>
              </button>
            );
          })}
          {visibleFriends.length === 0 && (
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
