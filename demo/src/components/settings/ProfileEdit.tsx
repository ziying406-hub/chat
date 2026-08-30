import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { getIMSDK } from "../../services/openim";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const [nickname, setNickname] = useState(currentUser?.nickname || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    try {
      const im = getIMSDK();
      await im.setSelfInfo({ nickname: nickname.trim() });
      // Reload
      const res = await im.getSelfUserInfo();
      useAppStore.setState({ currentUser: res.data });
      navigate("/settings");
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
          <h2 className="text-base font-semibold text-gray-800">编辑资料</h2>
        </div>
        <button onClick={handleSave} disabled={saving} className="text-sm text-primary-500 font-medium hover:text-primary-600 disabled:opacity-50">
          {saving ? "保存中..." : "保存"}
        </button>
      </div>

      <div className="bg-white px-6 py-6 flex flex-col items-center border-b border-gray-50">
        <img src={currentUser?.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`} alt="" className="w-20 h-20 rounded-2xl object-cover bg-gray-100" />
        <button className="mt-3 text-sm text-primary-500 hover:text-primary-600">更换头像</button>
      </div>

      <div className="bg-white mt-2 border-y border-gray-50">
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-500">昵称</span>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="text-sm text-gray-800 text-right outline-none w-40" />
        </div>
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-500">用户 ID</span>
          <span className="text-sm text-gray-400 font-mono">{currentUser?.userID}</span>
        </div>
      </div>
    </div>
  );
}
