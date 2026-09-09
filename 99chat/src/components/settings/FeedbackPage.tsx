import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Image as ImageIcon, X } from "lucide-react";
import { submitFeedback } from "../../services/openim";

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [contact, setContact] = useState("");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await submitFeedback({
        contact: contact.trim(),
        content: content.trim(),
        images: imagePreviews,
      });
      setShowToast(true);
      setContact("");
      setContent("");
      setImageFiles([]);
      setImagePreviews([]);
      setTimeout(() => setShowToast(false), 2000);
    } catch (e: any) {
      setError(e?.message || "提交失败");
    }
    setSubmitting(false);
  };

  const handleAddImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImageFiles([...imageFiles, file]);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews([...imagePreviews, reader.result as string]);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/settings/general")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">意见反馈</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">联系方式</label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="邮箱或手机号（选填）"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">反馈内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请描述您遇到的问题或建议..."
            rows={6}
            maxLength={200}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary-400 resize-none"
          />
          <div className="text-right text-xs text-gray-400 mt-1">{content.length}/200</div>

          <div className="mt-3">
            <button
              onClick={handleAddImage}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-500"
            >
              <ImageIcon size={18} />
              <span>添加图片</span>
            </button>
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {imagePreviews.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-0 right-0 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-500 px-1">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="w-full py-3 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {submitting ? "提交中..." : "送出"}
        </button>
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
