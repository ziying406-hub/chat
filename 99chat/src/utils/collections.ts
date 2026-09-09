import { MessageType } from "@openim/wasm-client-sdk";

export type CollectionKind = "text" | "image" | "voice" | "file" | "video" | "face";

export interface CollectionItem {
  clientMsgID: string;
  sendID: string;
  senderName?: string;
  content: string;
  contentType: number;
  time: number;
  kind?: CollectionKind;
  mediaUrl?: string;
  duration?: number;
  fileName?: string;
}

export function createCollectionItem(message: any, senderName: string): CollectionItem {
  const time = message.sendTime || Date.now();
  if (message.contentType === MessageType.PictureMessage) {
    return { clientMsgID: message.clientMsgID, sendID: message.sendID, senderName, content: "", contentType: message.contentType, time, kind: "image", mediaUrl: message.pictureElem?.sourcePicture?.url || message.pictureElem?.bigPicture?.url || message.pictureElem?.snapshotPicture?.url || message.pictureElem?.sourcePath };
  }
  if (message.contentType === MessageType.VoiceMessage) {
    return { clientMsgID: message.clientMsgID, sendID: message.sendID, senderName, content: "", contentType: message.contentType, time, kind: "voice", mediaUrl: message.soundElem?.sourceUrl, duration: message.soundElem?.duration };
  }
  if (message.contentType === MessageType.FileMessage) {
    return { clientMsgID: message.clientMsgID, sendID: message.sendID, senderName, content: "", contentType: message.contentType, time, kind: "file", mediaUrl: message.fileElem?.sourceUrl || message.fileElem?.filePath, fileName: message.fileElem?.fileName };
  }
  if (message.contentType === MessageType.VideoMessage) {
    return { clientMsgID: message.clientMsgID, sendID: message.sendID, senderName, content: "", contentType: message.contentType, time, kind: "video", mediaUrl: message.videoElem?.videoUrl || message.videoElem?.videoPath };
  }
  if (message.contentType === MessageType.FaceMessage) {
    return { clientMsgID: message.clientMsgID, sendID: message.sendID, senderName, content: message.faceElem?.data || "🙂", contentType: message.contentType, time, kind: "face", mediaUrl: message.faceElem?.data?.startsWith("http") ? message.faceElem.data : undefined };
  }
  return { clientMsgID: message.clientMsgID, sendID: message.sendID, senderName, content: message.textElem?.content || message.atTextElem?.text || message.customElem?.description || "[消息]", contentType: message.contentType, time, kind: "text" };
}

export function formatCollectionTime(time: number): string {
  const date = new Date(time);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const day = sameDay ? "今天" : `${date.getMonth() + 1}月${date.getDate()}日`;
  return `${day} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

export function getCollectionTitle(item: CollectionItem): string {
  if (item.kind === "image") return "图片收藏";
  if (item.kind === "voice") return "语音收藏";
  if (item.kind === "file") return "文件收藏";
  if (item.kind === "video") return "视频收藏";
  if (item.kind === "face") return "表情收藏";
  return "文字收藏";
}
