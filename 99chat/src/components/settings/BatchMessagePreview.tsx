import { useState } from "react";
import UnavailableDetail from "../layout/UnavailableDetail";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deleteBatchMessageTask, getBatchMessageTask } from "../../services/batch-message";
import { useAppStore } from "../../store/app-store";

export default function BatchMessagePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userID = useAppStore((state) => state.currentUser?.userID);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const task = id ? getBatchMessageTask(userID, id) : null;

  if (!task) return <UnavailableDetail to="/settings/messaging/batch" label="返回群发助手">群发记录不存在</UnavailableDetail>;

  const deleteTask = () => {
    deleteBatchMessageTask(userID, task.id);
    navigate("/settings/messaging/batch", { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      <header className="h-16 px-5 bg-white border-b border-gray-100 flex items-center gap-3">
        <button aria-label="返回群发助手" onClick={() => navigate("/settings/messaging/batch")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="flex-1 text-base font-semibold text-gray-800">群发详情</h2>
        <button aria-label="删除群发记录" onClick={() => setShowDeleteConfirm(true)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm whitespace-pre-wrap text-gray-700">{task.content}</p>
          <p className="mt-3 text-xs text-gray-400">{new Date(task.createdAt).toLocaleString()}</p>
        </section>
        <section className="bg-white rounded-xl border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-50 text-sm font-medium text-gray-700">发送结果</div>
          {task.recipients.map((recipient) => (
            <div key={recipient.conversationID} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
              <span className="flex-1 text-sm text-gray-700">{recipient.name}</span>
              <span className="text-xs text-gray-400">{recipient.type === "group" ? "群聊" : "好友"}</span>
              <span className={`text-xs ${recipient.status === "sent" ? "text-green-500" : "text-red-500"}`}>{recipient.status === "sent" ? "已发送" : "发送失败"}</span>
            </div>
          ))}
        </section>
      </div>
      <div className="bg-white border-t border-gray-100 p-4">
        <button onClick={() => navigate(`/settings/messaging/batch/create?task=${task.id}`)} className="w-full py-3 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600">再发一条</button>
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-72 rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <p className="mb-4 text-center text-sm text-gray-700">删除这条群发记录吗？</p>
            <div className="flex gap-2"><button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm text-gray-500">取消</button><button onClick={deleteTask} className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm text-white">删除</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
