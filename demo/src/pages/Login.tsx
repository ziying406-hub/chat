import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Eye, EyeOff, Phone, Lock, User, ShieldCheck, Loader2 } from "lucide-react";
import { useAppStore } from "../store/app-store";

type Tab = "login" | "register";

export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const register = useAppStore((s) => s.register);
  const sendCode = useAppStore((s) => s.sendCode);
  const isLoggingIn = useAppStore((s) => s.isLoggingIn);
  const authError = useAppStore((s) => s.authError);
  const setAuthError = useAppStore((s) => s.setAuthError);

  const [tab, setTab] = useState<Tab>("login");
  const [phone, setPhone] = useState("13800138000");
  const [password, setPassword] = useState("test123456");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) return;
    try {
      await login({ phoneNumber: phone.trim(), password });
      navigate("/messages", { replace: true });
    } catch {}
  };

  const handleRegister = async () => {
    if (!phone.trim() || !password.trim() || !nickname.trim() || !code.trim()) return;
    try {
      await register({ phoneNumber: phone.trim(), verifyCode: code.trim(), nickname, password });
      navigate("/messages", { replace: true });
    } catch {}
  };

  const handleSendCode = async () => {
    if (!phone.trim()) return;
    setSendingCode(true);
    try {
      await sendCode(phone.trim());
      setCodeSent(true);
    } catch {}
    setSendingCode(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="w-[400px] bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg">
            <MessageCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">99chat</h1>
          <p className="text-gray-400 text-sm mt-1">Let's talk.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => { setTab("login"); setAuthError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "login" ? "bg-white text-primary-600 shadow-sm" : "text-gray-400"}`}
          >登录</button>
          <button
            onClick={() => { setTab("register"); setAuthError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "register" ? "bg-white text-primary-600 shadow-sm" : "text-gray-400"}`}
          >注册</button>
        </div>

        {authError && (
          <div className="mb-4 px-3 py-2 bg-red-50 text-red-500 text-sm rounded-lg">{authError}</div>
        )}

        <div className="space-y-4">
          {tab === "register" && (
            <div>
              <label className="text-sm text-gray-500 mb-1 block">昵称</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                  placeholder="请输入昵称"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-500 mb-1 block">手机号</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                placeholder="请输入手机号"
              />
            </div>
          </div>

          {tab === "register" && (
            <div>
              <label className="text-sm text-gray-500 mb-1 block">验证码</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                    placeholder="验证码 (666666)"
                  />
                </div>
                <button
                  onClick={handleSendCode}
                  disabled={sendingCode || codeSent}
                  className="px-4 py-2.5 text-sm border border-primary-200 text-primary-500 rounded-xl hover:bg-primary-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {sendingCode ? "发送中..." : codeSent ? "已发送" : "发送验证码"}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-500 mb-1 block">密码</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => tab === "login" && e.key === "Enter" && handleLogin()}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                placeholder="请输入密码"
              />
              <button
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={tab === "login" ? handleLogin : handleRegister}
            disabled={isLoggingIn}
            className="w-full py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoggingIn && <Loader2 size={16} className="animate-spin" />}
            {isLoggingIn ? "处理中..." : tab === "login" ? "登录" : "注册"}
          </button>

          {tab === "login" && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">默认账号: 13800138000 / test123456</span>
              <button className="text-gray-400 hover:underline">忘记密码？</button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-300">登录即代表同意《用户协议》和《隐私政策》</p>
        </div>
      </div>
    </div>
  );
}
