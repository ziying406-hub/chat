import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "../store/app-store";

export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const [account, setAccount] = useState("13800138000");
  const [password, setPassword] = useState("123456");
  const [showPwd, setShowPwd] = useState(false);

  const handleLogin = () => {
    login();
    navigate("/messages", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="w-[400px] bg-white rounded-2xl shadow-2xl p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-3xl flex items-center justify-center text-white mb-4 shadow-lg">
            <MessageCircle size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">99chat</h1>
          <p className="text-gray-400 text-sm mt-1">Let's talk.</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">账号</label>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-primary-500 transition-colors text-sm"
              placeholder="手机号 / 邮箱"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">密码</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl outline-none focus:border-primary-500 transition-colors text-sm"
                placeholder="请输入密码"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-md"
          >
            登录
          </button>

          <div className="flex justify-between text-sm">
            <button className="text-primary-500 hover:underline">注册新账号</button>
            <button className="text-gray-400 hover:underline">忘记密码？</button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-300">
            登录即代表同意《用户协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
}
