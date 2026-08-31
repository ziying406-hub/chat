import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Camera, Loader2, Check } from "lucide-react";
import { useAppStore } from "../store/app-store";

export default function InitialSetup() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const updateSelfInfo = useAppStore((s) => s.updateSelfInfo);
  const uploadAvatar = useAppStore((s) => s.uploadAvatar);

  const [nickname, setNickname] = useState(currentUser?.nickname || "");
  const [signature, setSignature] = useState((currentUser as any)?.ex || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.faceURL || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = () => fileRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadAvatar(file);
    if (url) setAvatarUrl(url);
    setUploading(false);
    e.target.value = "";
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const info: any = {};
      if (nickname.trim()) info.nickname = nickname.trim();
      if (avatarUrl) info.faceURL = avatarUrl;
      if (signature.trim()) info.ex = signature.trim();
      if (Object.keys(info).length > 0) {
        await updateSelfInfo(info);
      }
      navigate("/messages", { replace: true });
    } catch (e) {
      console.error("setup:", e);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="w-[400px] bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg">
            <MessageCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">完善资料</h1>
          <p className="text-gray-400 text-sm mt-1">设置你的个人信息</p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.userID || "new"}`}
              alt=""
              className="w-24 h-24 rounded-full object-cover bg-gray-100 border-2 border-gray-100"
            />
            <button
              onClick={handleAvatarSelect}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-primary-600 transition-colors"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>

        {/* Nickname */}
        <div className="mb-4">
          <label className="text-sm text-gray-500 mb-1 block">昵称</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="请输入昵称"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Signature */}
        <div className="mb-6">
          <label className="text-sm text-gray-500 mb-1 block">个性签名</label>
          <input
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="设置个性签名"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        <button
          onClick={handleFinish}
          disabled={saving || uploading}
          className="w-full py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? "保存中..." : "完成"}
        </button>
      </div>
    </div>
  );
}
