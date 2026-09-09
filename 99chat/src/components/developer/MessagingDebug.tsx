import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { getIMSDK } from "../../services/openim";
import logger from "../../utils/log";

type MsgType = "text" | "image" | "custom";

export default function MessagingDebug() {
  const navigate = useNavigate();
  const [conversationID, setConversationID] = useState("");
  const [msgType, setMsgType] = useState<MsgType>("text");
  const [content, setContent] = useState("");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const getConvParams = (id: string) => {
    return { recvID: id, groupID: "", message: null as any };
  };

  const handleSend = async () => {
    if (!conversationID || !content) return;
    setLoading(true);
    setResponse("");
    try {
      const im = getIMSDK();
      let message: any = null;
      if (msgType === "text") {
        const res = await im.createTextMessage(content);
        message = res.data;
      } else if (msgType === "image") {
        const res = await im.createImageMessageByFile({
          sourcePath: content,
          sourcePicture: { uuid: "", type: "", size: 0, width: 0, height: 0, url: content },
          bigPicture: { uuid: "", type: "", size: 0, width: 0, height: 0, url: content },
          snapshotPicture: { uuid: "", type: "", size: 0, width: 0, height: 0, url: content },
        } as any);
        message = res.data;
      } else {
        const res = await im.createCustomMessage({ data: content, extension: "", description: "custom" });
        message = res.data;
      }
      if (!message) {
        setResponse(JSON.stringify({ error: "Failed to create message" }, null, 2));
        return;
      }
      const params = { ...getConvParams(conversationID), message };
      const sendRes = await im.sendMessage(params);
      logger.info("Message sent:", sendRes);
      setResponse(JSON.stringify(sendRes, null, 2));
    } catch (e: any) {
      logger.error("Send failed:", e);
      setResponse(JSON.stringify({ error: e.message || String(e) }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleGetConversations = async () => {
    setLoading(true);
    setResponse("");
    try {
      const im = getIMSDK();
      const res = await im.getAllConversationList();
      logger.info("Conversations:", res);
      setResponse(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResponse(JSON.stringify({ error: e.message || String(e) }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleGetMessages = async () => {
    if (!conversationID) return;
    setLoading(true);
    setResponse("");
    try {
      const im = getIMSDK();
      const res = await im.getAdvancedHistoryMessageList({
        conversationID,
        startClientMsgID: "",
        count: 20,
        viewType: 0,
      });
      logger.info("Messages:", res);
      setResponse(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResponse(JSON.stringify({ error: e.message || String(e) }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/developer")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">消息调试</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">会话 ID</label>
            <input
              value={conversationID}
              onChange={(e) => setConversationID(e.target.value)}
              placeholder="输入会话 ID"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">消息类型</label>
            <div className="flex gap-2">
              {(["text", "image", "custom"] as MsgType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setMsgType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs transition-colors ${
                    msgType === t ? "bg-primary-50 text-primary-500" : "bg-gray-50 text-gray-400"
                  }`}
                >
                  {t === "text" ? "文本" : t === "image" ? "图片" : "自定义"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">消息内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={msgType === "image" ? "图片 URL" : "消息内容"}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary-400 resize-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={loading || !conversationID || !content}
            className="w-full py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={16} /> 发送
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex gap-2">
            <button
              onClick={handleGetConversations}
              disabled={loading}
              className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              获取会话列表
            </button>
            <button
              onClick={handleGetMessages}
              disabled={loading || !conversationID}
              className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              获取消息列表
            </button>
          </div>
        </div>

        {response && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">SDK 响应</h3>
            <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
              <code>{response}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
