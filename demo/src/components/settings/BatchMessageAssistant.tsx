import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { listBatchMessageTasks, type BatchMessageTask } from "../../services/batch-message";
import { useAppStore } from "../../store/app-store";

export default function BatchMessageAssistant() {
  const navigate = useNavigate();
  const userID = useAppStore((state) => state.currentUser?.userID);
  const [tasks, setTasks] = useState<BatchMessageTask[]>([]);

  useEffect(() => {
    setTasks(listBatchMessageTasks(userID));
  }, [userID]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      <header className="h-16 px-5 bg-white border-b border-gray-100 flex items-center gap-3">
        <button aria-label="返回聊天设置" onClick={() => navigate("/settings/messaging")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">群发助手</h2>
      </header>
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-300">暂无群发记录</div>
        ) : (
          <div className="mt-2 bg-white border-y border-gray-100">
            {tasks.map((task) => {
              const sent = task.recipients.filter((recipient) => recipient.status === "sent");
              return (
                <button key={task.id} onClick={() => navigate(`/settings/messaging/batch/${task.id}`)} className="w-full px-5 py-4 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <div className="flex gap-3 items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700 truncate">{task.content}</p>
                      <p className="mt-1 text-xs text-gray-400">已发送给 {sent.map((recipient) => recipient.name).join("、") || "无"}</p>
                      <p className="mt-1 text-xs text-gray-300">{new Date(task.createdAt).toLocaleString()}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="bg-white border-t border-gray-100 p-4">
        <button onClick={() => navigate("/settings/messaging/batch/create")} className="w-full py-3 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600">新建群发</button>
      </div>
    </div>
  );
}
