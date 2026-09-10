import { useEffect, useState } from "react";
import UnavailableDetail from "../layout/UnavailableDetail";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { getFavoritesStorageKey } from "../../utils/favorites";
import { type CollectionItem, formatCollectionTime } from "../../utils/collections";
import { listFavorites } from "../../services/openim";

export default function CollectionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userID = useAppStore((state) => state.currentUser?.userID);
  const chatToken = useAppStore((state) => state.authData?.chatToken);
  const [item, setItem] = useState<CollectionItem | null>(null);

  useEffect(() => {
    if (!userID || !id) {
      setItem(null);
      return;
    }
    const load = async () => {
      try {
        if (!chatToken) throw new Error("token unavailable");
        const items = await listFavorites(chatToken) as CollectionItem[];
        setItem(items.find((entry) => entry.clientMsgID === id) || null);
      } catch {
        try {
          const items = JSON.parse(localStorage.getItem(getFavoritesStorageKey(userID)) || "[]") as CollectionItem[];
          setItem(items.find((entry) => entry.clientMsgID === id) || null);
        } catch {
          setItem(null);
        }
      }
    };
    load();
  }, [chatToken, id, userID]);

  if (!item) return <UnavailableDetail to="/settings/collections" label="返回我的收藏">收藏不存在</UnavailableDetail>;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      <header className="h-16 px-5 bg-white border-b border-gray-100 flex items-center gap-3">
        <button aria-label="返回我的收藏" onClick={() => navigate("/settings/collections")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">收藏详情</h2>
      </header>
      <main className="flex-1 overflow-y-auto p-5">
        <section className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="mb-4 text-xs text-gray-400">{item.senderName || item.sendID} · {formatCollectionTime(item.time)}</p>
          {item.kind === "image" && item.mediaUrl ? <img src={item.mediaUrl} alt="收藏图片" className="max-h-[480px] max-w-full rounded-xl object-contain" /> : null}
          {item.kind === "voice" && item.mediaUrl ? <audio controls src={item.mediaUrl} className="w-full" /> : null}
          {item.kind === "file" ? item.mediaUrl ? <a href={item.mediaUrl} download={item.fileName || ""} className="text-sm text-primary-500 hover:underline">{item.fileName || "下载文件"}</a> : <p className="text-sm text-gray-600">{item.fileName || "文件"}</p> : null}
          {item.kind === "video" && item.mediaUrl ? <video controls src={item.mediaUrl} className="max-h-[480px] max-w-full rounded-xl bg-black" /> : null}
          {item.kind === "face" && item.mediaUrl ? <img src={item.mediaUrl} alt="收藏表情" className="h-24 w-24 object-contain" /> : null}
          {item.kind === "face" && !item.mediaUrl ? <p className="text-5xl">{item.content || "🙂"}</p> : null}
          {(!item.kind || item.kind === "text") ? <p className="whitespace-pre-wrap break-words text-sm text-gray-700">{item.content || "[消息]"}</p> : null}
        </section>
      </main>
    </div>
  );
}
