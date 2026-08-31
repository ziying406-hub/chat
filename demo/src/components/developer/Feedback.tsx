import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type Category = "bug" | "suggestion" | "other";

interface FeedbackItem {
  category: Category;
  description: string;
  contact: string;
  time: string;
}

export default function Feedback() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>("bug");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = () => {
    if (!description.trim()) return;
    const stored = JSON.parse(localStorage.getItem("99chat_feedback") || "[]");
    const item: FeedbackItem = {
      category,
      description: description.trim(),
      contact: contact.trim(),
      time: new Date().toISOString(),
    };
    stored.push(item);
    localStorage.setItem("99chat_feedback", JSON.stringify(stored));
    setShowToast(true);
    setDescription("");
    setContact("");
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/developer")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">意见反馈</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">反馈类型</label>
            <div className="flex gap-2">
              {([
                { key: "bug", label: "Bug" },
                { key: "suggestion", label: "建议" },
                { key: "other", label: "其他" },
              ] as { key: Category; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`flex-1 py-2 rounded-lg text-xs transition-colors ${
                    category === key ? "bg-primary-50 text-primary-500" : "bg-gray-50 text-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请描述您遇到的问题或建议..."
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">联系方式（可选）</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="邮箱或手机号"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="w-full py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            提交
          </button>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg">
          <CheckCircle2 size={18} className="text-green-400" />
          <span className="text-sm">提交成功</span>
        </div>
      )}
    </div>
  );
}
