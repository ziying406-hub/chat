import { useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getIMSDK } from "../../services/openim";
import { getMyEmojis, saveMyEmojis, type MyEmoji } from "../../services/my-emojis";
import { useAppStore } from "../../store/app-store";

export default function MyEmojis() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const [emojis, setEmojis] = useState<MyEmoji[]>(() => getMyEmojis(currentUser?.userID));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const updateEmojis = (next: MyEmoji[]) => {
    setEmojis(next);
    if (currentUser?.userID) saveMyEmojis(currentUser.userID, next);
  };

  const addEmoji = async (file: File) => {
    if (!currentUser?.userID || !file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const uploaded = await getIMSDK().uploadFile({
        name: file.name,
        contentType: file.type,
        uuid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
      });
      const url = uploaded.data?.url;
      if (!url) throw new Error("上传未返回图片地址");
      updateEmojis([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, url, name: file.name }, ...emojis]);
    } catch (cause: any) {
      setError(cause?.message || "表情上传失败");
    } finally {
      setUploading(false);
    }
  };

  const removeEmoji = (id: string) => updateEmojis(emojis.filter((emoji) => emoji.id !== id));

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button aria-label="返回聊天设置" onClick={() => navigate("/settings/messaging")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-lg font-bold text-gray-800">我的表情</h2>
      </div>

      <div className="p-5">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) addEmoji(file);
          event.target.value = "";
        }} />
        <button onClick={() => inputRef.current?.click()} disabled={uploading} className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50">
          <ImagePlus size={18} />
          {uploading ? "上传中..." : "添加表情"}
        </button>
        <p className="mt-3 text-xs text-gray-400">上传后可在聊天输入框的表情面板中发送，对方会收到同一张表情。</p>
        {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}

        {emojis.length === 0 ? (
          <div className="mt-5 py-16 text-center text-sm text-gray-400">还没有添加表情</div>
        ) : (
          <div className="mt-5 grid grid-cols-4 sm:grid-cols-6 gap-3">
            {emojis.map((emoji) => (
              <div key={emoji.id} className="relative aspect-square rounded-xl bg-white border border-gray-100 p-2 group">
                <img src={emoji.url} alt={emoji.name} className="w-full h-full object-contain" />
                <button aria-label={`删除 ${emoji.name}`} onClick={() => removeEmoji(emoji.id)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-red-500 focus:bg-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
