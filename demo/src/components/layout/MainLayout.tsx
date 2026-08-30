import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, Users, Settings as SettingsIcon } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import ConversationList from "../chat/ConversationList";
import ChatView from "../chat/ChatView";
import ContactList from "../contact/ContactList";
import UserProfile from "../contact/UserProfile";
import GroupList from "../contact/GroupList";
import GroupDetail from "../contact/GroupDetail";
import FriendRequests from "../contact/FriendRequests";
import CreateGroup from "../contact/CreateGroup";
import GroupAdmin from "../group/GroupAdmin";
import Settings from "../settings/Settings";
import ProfileEdit from "../settings/ProfileEdit";
import GeneralSettings from "../settings/GeneralSettings";
import PrivacySettings from "../settings/PrivacySettings";
import CallOverlay from "../call/CallOverlay";
import EmptyState from "../chat/EmptyState";

function NavButton({ icon, label, path, active, badge }: {
  icon: React.ReactNode; label: string; path: string; active: boolean; badge?: number;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
        active ? "bg-primary-50 text-primary-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

export default function MainLayout() {
  const location = useLocation();
  const currentUser = useAppStore((s) => s.currentUser);
  const totalUnread = useAppStore((s) => s.totalUnread);
  const pendingRequests = useAppStore((s) => s.friendRequests.filter((r: any) => r.handleStatus === 0).length);
  const isActive = (prefix: string) => location.pathname.startsWith(prefix);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <div className="w-[72px] bg-gray-50 border-r border-gray-100 flex flex-col items-center py-4 gap-2">
        <NavButton icon={<MessageSquare size={22} />} label="消息" path="/messages" active={isActive("/messages")} badge={totalUnread} />
        <NavButton icon={<Users size={22} />} label="通讯录" path="/contact" active={isActive("/contact")} badge={pendingRequests} />
        <div className="flex-1" />
        <NavButton icon={<SettingsIcon size={22} />} label="设置" path="/settings" active={isActive("/settings")} />
        {currentUser && (
          <img src={currentUser.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.userID}`} alt="me" className="w-10 h-10 rounded-full object-cover border-2 border-transparent hover:border-primary-300 transition-colors" />
        )}
      </div>

      <Routes>
        <Route path="/messages" element={<ConversationList />}>
          <Route index element={<EmptyState />} />
          <Route path="session/:id" element={<ChatView />} />
          <Route path="groups/admin/:id" element={<GroupAdmin />} />
        </Route>
        <Route path="/contact" element={<ContactList />}>
          <Route index element={<div className="flex-1 flex items-center justify-center text-gray-300 text-sm">选择一个联系人</div>} />
          <Route path="user/:id" element={<UserProfile />} />
          <Route path="groups" element={<GroupList />} />
          <Route path="group/:id" element={<GroupDetail />} />
          <Route path="requests" element={<FriendRequests />} />
          <Route path="create-group" element={<CreateGroup />} />
        </Route>
        <Route path="/settings" element={<Settings />}>
          <Route index element={<div className="flex-1 flex items-center justify-center text-gray-300 text-sm">选择一个设置项</div>} />
          <Route path="profile" element={<ProfileEdit />} />
          <Route path="general" element={<GeneralSettings />} />
          <Route path="privacy" element={<PrivacySettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/messages" replace />} />
      </Routes>

      <CallOverlay />
    </div>
  );
}
