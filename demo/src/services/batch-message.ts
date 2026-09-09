import { SessionType } from "@openim/wasm-client-sdk";
import type { ConversationItem } from "./openim";
import { getIMSDK } from "./openim";
import { getUserStorageKey } from "../utils/storage";

const STORAGE_KEY = "99chat_batch_messages";

export type BatchRecipientStatus = "sent" | "failed";

export interface BatchMessageRecipient {
  conversationID: string;
  name: string;
  type: "single" | "group";
  status: BatchRecipientStatus;
  error?: string;
}

export interface BatchMessageTask {
  id: string;
  content: string;
  createdAt: string;
  recipients: BatchMessageRecipient[];
}

function readTasks(userID: string): BatchMessageTask[] {
  try {
    const value = JSON.parse(localStorage.getItem(getUserStorageKey(STORAGE_KEY, userID)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeTasks(userID: string, tasks: BatchMessageTask[]) {
  localStorage.setItem(getUserStorageKey(STORAGE_KEY, userID), JSON.stringify(tasks));
}

export function listBatchMessageTasks(userID?: string): BatchMessageTask[] {
  return userID ? readTasks(userID).sort((left, right) => right.createdAt.localeCompare(left.createdAt)) : [];
}

export function getBatchMessageTask(userID: string | undefined, id: string): BatchMessageTask | null {
  return userID ? readTasks(userID).find((task) => task.id === id) || null : null;
}

export function deleteBatchMessageTask(userID: string | undefined, id: string) {
  if (userID) writeTasks(userID, readTasks(userID).filter((task) => task.id !== id));
}

export async function createBatchMessageTask(userID: string | undefined, content: string, selectedConversationIDs: string[], conversations: ConversationItem[]): Promise<BatchMessageTask> {
  if (!userID) throw new Error("当前账号不可用");
  const trimmedContent = content.trim();
  if (!trimmedContent) throw new Error("请输入群发内容");
  if (selectedConversationIDs.length === 0) throw new Error("请至少选择一位收件人");

  const selected = selectedConversationIDs
    .map((conversationID) => conversations.find((conversation) => conversation.conversationID === conversationID))
    .filter((conversation): conversation is ConversationItem => Boolean(conversation));

  if (selected.length !== selectedConversationIDs.length) throw new Error("部分收件人已不可用，请重新选择");

  const im = getIMSDK();
  const recipients: BatchMessageRecipient[] = [];

  for (const conversation of selected) {
    const recipient: BatchMessageRecipient = {
      conversationID: conversation.conversationID,
      name: conversation.showName || "未知",
      type: conversation.conversationType === SessionType.Group ? "group" : "single",
      status: "failed",
    };

    try {
      const created = await im.createTextMessage(trimmedContent);
      if (created.errCode !== 0 || !created.data) throw new Error(created.errMsg || "创建消息失败");
      const sent = await im.sendMessage({
        recvID: conversation.conversationType === SessionType.Single ? conversation.userID || "" : "",
        groupID: conversation.conversationType === SessionType.Group ? conversation.groupID || "" : "",
        message: created.data,
      });
      if (sent.errCode !== 0 || !sent.data) throw new Error(sent.errMsg || "发送失败");
      recipient.status = "sent";
    } catch (cause: any) {
      recipient.error = cause?.message || "发送失败";
    }

    recipients.push(recipient);
  }

  const task: BatchMessageTask = {
    id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    content: trimmedContent,
    createdAt: new Date().toISOString(),
    recipients,
  };

  writeTasks(userID, [task, ...readTasks(userID)]);
  return task;
}
