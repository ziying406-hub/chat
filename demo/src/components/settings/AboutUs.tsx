import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/settings/general")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">关于我们</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg shadow-primary-200">
          99
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mt-6">99chat</h1>
        <p className="text-sm text-gray-400 mt-1">v1.0.0</p>
      </div>
    </div>
  );
}
