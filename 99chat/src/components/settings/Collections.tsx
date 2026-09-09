import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageType } from "@openim/wasm-client-sdk";
import { useAppStore } from "../../store/app-store";
import { getFavoritesStorageKey } from "../../utils/favorites";
import { type CollectionItem, formatCollectionTime, getCollectionTitle } from "../../utils/collections";
import { listFavorites } from "../../services/openim";

type Tab = "all" | "text" | "media" | "file" | "voice";

const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "text", label: "文字" },
  { key: "media", label: "图片与视频" },
  { key: "file", label: "文件" },
  { key: "voice", label: "语音" },
];

function getType(contentType: number): Exclude<Tab, "all"> {
  if ([MessageType.PictureMessage, MessageType.VideoMessage].includes(contentType)) return "media";
  if (contentType === MessageType.FileMessage) return "file";
  if (contentType === MessageType.VoiceMessage) return "voice";
  return "text";
}

export default function Collections() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const chatToken = useAppStore((s) => s.authData?.chatToken);
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<CollectionItem[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setItems([]);
      return;
    }
    const load = async () => {
      try {
        if (!chatToken) throw new Error("token unavailable");
        setItems(await listFavorites(chatToken) as CollectionItem[]);
      } catch {
        try { setItems(JSON.parse(localStorage.getItem(getFavoritesStorageKey(currentUser.userID)) || "[]") as CollectionItem[]); } catch { setItems([]); }
      }
    };
    load();
  }, [currentUser?.userID, chatToken]);

  const filtered = tab === "all" ? items : items.filter((item) => getType(item.contentType) === tab);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">我的收藏</h2>
      </div>

      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-1 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
              tab === item.key ? "bg-primary-50 text-primary-600" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-gray-300">无收藏</p>
          </div>
        ) : (
          <div className="bg-white mt-2 border-y border-gray-100">
            {filtered.map((item) => (
              <div key={item.clientMsgID} className="px-5 py-3.5 border-b border-gray-50 last:border-b-0">
                <p className="mb-2 text-xs text-gray-400">{item.senderName || item.sendID} · {formatCollectionTime(item.time)}</p>
                <button aria-label={`查看收藏 ${getCollectionTitle(item)}`} onClick={() => navigate(`/settings/collections/${item.clientMsgID}`)} className="w-full text-left hover:bg-gray-50 rounded-lg">
                  {item.kind === "image" && item.mediaUrl ? <img src={item.mediaUrl} alt="收藏图片" className="max-h-40 max-w-56 rounded-lg object-cover" /> : null}
                  {item.kind === "voice" ? <p className="text-sm text-primary-500">语音 {item.duration ? `${item.duration}″` : ""}</p> : null}
                  {item.kind === "file" ? <p className="text-sm text-primary-500">{item.fileName || "文件"}</p> : null}
                  {item.kind === "video" ? <p className="text-sm text-primary-500">视频</p> : null}
                  {item.kind === "face" ? <p className="text-3xl">{item.content || "🙂"}</p> : null}
                  {!item.kind || item.kind === "text" ? <p className="text-sm text-gray-700 break-words">{item.content || "[消息]"}</p> : null}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
