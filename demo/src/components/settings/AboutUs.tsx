import { useNavigate } from "react-router-dom";
import { ArrowLeft, GitFork, MessageSquare, FileText, Shield, Code } from "lucide-react";

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/settings")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">关于我们</h2>
      </div>

      <div className="flex flex-col items-center pt-12 pb-8 bg-white">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary-200">
          99
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mt-4">99chat</h1>
        <p className="text-sm text-gray-400 mt-1">Version 1.0.0</p>
        <p className="text-sm text-gray-500 mt-3 text-center px-8">
          Let's talk. — 轻量级即时通讯 PWA
        </p>
      </div>

      <div className="mt-2 bg-white border-y border-gray-50">
        <a
          href="https://github.com/openim-samples"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50"
        >
          <GitFork size={18} className="text-gray-400" />
          <span className="text-sm text-gray-600 flex-1">GitHub</span>
          <span className="text-xs text-gray-300">openim-samples</span>
        </a>
        <a
          href="https://www.openim.online"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50"
        >
          <MessageSquare size={18} className="text-gray-400" />
          <span className="text-sm text-gray-600 flex-1">OpenIM</span>
          <span className="text-xs text-gray-300">openim.online</span>
        </a>
        <button
          onClick={() => navigate("/settings/privacy")}
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 w-full"
        >
          <FileText size={18} className="text-gray-400" />
          <span className="text-sm text-gray-600 flex-1">用户协议</span>
        </button>
        <button
          onClick={() => navigate("/settings/privacy")}
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors w-full"
        >
          <Shield size={18} className="text-gray-400" />
          <span className="text-sm text-gray-600 flex-1">隐私政策</span>
        </button>
      </div>

      <div className="mt-2 bg-white px-5 py-4 flex items-center gap-3 border-y border-gray-50">
        <Code size={18} className="text-gray-400" />
        <div>
          <p className="text-sm text-gray-600">技术栈</p>
          <p className="text-xs text-gray-400 mt-0.5">Built with React + OpenIM + WASM</p>
        </div>
      </div>

      <div className="flex-1" />
      <div className="text-center py-8">
        <p className="text-xs text-gray-300">© 2026 99chat. All rights reserved.</p>
      </div>
    </div>
  );
}
