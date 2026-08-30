import { MessageSquare } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300 mb-4">
        <MessageSquare size={32} />
      </div>
      <p className="text-gray-300 text-sm">选择一个会话开始聊天</p>
    </div>
  );
}
