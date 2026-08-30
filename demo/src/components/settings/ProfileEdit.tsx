import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const updateSelfInfo = useAppStore((s) => s.updateSelfInfo);
  const uploadAvatar = useAppStore((s) => s.uploadAvatar);
  const [nickname, setNickname] = useState(currentUser?.nickname || "");
  const [signature, setSignature] = useState((currentUser as any)?.ex || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.faceURL || "");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = () => fileRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      if (url) setAvatarUrl(url);
    } catch (err) { console.error(err); }
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    try {
      await updateSelfInfo({ nickname: nickname.trim(), faceURL: avatarUrl || undefined, ex: signature.trim() || undefined });
      navigate("/settings");
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
          <h2 className="text-base font-semibold text-gray-800">编辑资料</h2>
        </div>
        <button onClick={handleSave} disabled={saving || uploading} className="text-sm text-primary-500 font-medium hover:text-primary-600 disabled:opacity-50">
          {saving || uploading ? "保存中..." : "保存"}
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

      <div className="bg-white px-6 py-6 flex flex-col items-center border-b border-gray-50">
        <div className="relative">
          <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`} alt="" className="w-20 h-20 rounded-2xl object-cover bg-gray-100" />
          <button
            onClick={handleAvatarSelect}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={16} />}
          </button>
        </div>
        <button onClick={handleAvatarSelect} className="mt-3 text-sm text-primary-500 hover:text-primary-600" disabled={uploading}>
          {uploading ? "上传中..." : "更换头像"}
        </button>
      </div>

      <div className="bg-white mt-2 border-y border-gray-50">
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-500">昵称</span>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="text-sm text-gray-800 text-right outline-none w-40" />
        </div>
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-500">个性签名</span>
          <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="设置签名" className="text-sm text-gray-800 text-right outline-none w-40" />
        </div>
        <div className="px-5 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">用户 ID</span>
          <span className="text-sm text-gray-400 font-mono">{currentUser?.userID}</span>
        </div>
      </div>
    </div>
  );
}
