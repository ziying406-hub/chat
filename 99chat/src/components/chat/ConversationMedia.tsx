import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Play } from "lucide-react";
import { MessageType } from "@openim/wasm-client-sdk";
import { useAppStore } from "../../store/app-store";
import MediaViewer from "./media/MediaViewer";

type Filter = "all" | "image" | "video" | "file";

export default function ConversationMedia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messages = useAppStore((s) => (id ? s.messagesMap[id] : undefined) || []);
  const loadMessages = useAppStore((s) => s.loadMessages);
  const [filter, setFilter] = useState<Filter>("all");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (id) loadMessages(id);
  }, [id, loadMessages]);

  const items = useMemo(() => messages.filter((message: any) => {
    const type = message.contentType;
    if (filter === "image") return type === MessageType.PictureMessage;
    if (filter === "video") return type === MessageType.VideoMessage;
    if (filter === "file") return type === MessageType.FileMessage;
    return [MessageType.PictureMessage, MessageType.VideoMessage, MessageType.FileMessage].includes(type);
  }), [filter, messages]);

  const images = useMemo(() => messages
    .filter((message: any) => message.contentType === MessageType.PictureMessage)
    .map((message: any) => ({ url: message.pictureElem?.sourcePath || message.pictureElem?.snapshotPath || message.pictureElem?.bigPicture?.url || "", name: message.clientMsgID }))
    .filter((item: any) => item.url), [messages]);

  if (!id) return null;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
      <header className="h-16 px-5 bg-white border-b border-gray-100 flex items-center gap-3">
        <button aria-label="返回聊天设置" onClick={() => navigate(`/messages/session/${id}/settings`)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">图片与视频</h2>
      </header>
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-1">
        {[
          ["all", "全部"], ["image", "图片"], ["video", "视频"], ["file", "档案"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key as Filter)} className={`px-4 py-2 text-sm rounded-lg ${filter === key ? "bg-primary-50 text-primary-600" : "text-gray-500 hover:bg-gray-50"}`}>{label}</button>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-300">暂无媒体内容</div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3 content-start">
          {items.map((message: any) => {
            if (message.contentType === MessageType.PictureMessage) {
              const src = message.pictureElem?.sourcePath || message.pictureElem?.snapshotPath || message.pictureElem?.bigPicture?.url || "";
              const imageIndex = images.findIndex((item: any) => item.url === src);
              return <button key={message.clientMsgID} onClick={() => setViewerIndex(imageIndex)} className="aspect-square rounded-lg overflow-hidden bg-gray-100"><img src={src} alt="" className="w-full h-full object-cover" /></button>;
            }
            if (message.contentType === MessageType.VideoMessage) {
              return <a key={message.clientMsgID} href={message.videoElem?.videoUrl || message.videoElem?.videoPath || "#"} target="_blank" rel="noreferrer" className="relative aspect-square rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center"><img src={message.videoElem?.snapshotUrl || ""} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" /><Play className="relative text-white" /></a>;
            }
            const file = message.fileElem;
            return <a key={message.clientMsgID} href={file?.sourceUrl || "#"} target="_blank" rel="noreferrer" className="aspect-square rounded-lg bg-white border border-gray-100 p-3 flex flex-col items-center justify-center gap-2 text-center"><FileText size={26} className="text-gray-400" /><span className="text-xs text-gray-500 break-all line-clamp-2">{file?.fileName || "文件"}</span></a>;
          })}
        </div>
      )}
      {viewerIndex !== null && <MediaViewer images={images} index={viewerIndex} onClose={() => setViewerIndex(null)} />}
    </div>
  );
}
