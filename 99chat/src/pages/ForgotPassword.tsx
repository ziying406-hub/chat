import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Phone, Lock, ShieldCheck, Loader2, ChevronDown, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "../store/app-store";
import { resetPassword } from "../services/openim";

const AREA_CODES = [
  { code: "+86", label: "+86 中国" },
  { code: "+852", label: "+852 香港" },
  { code: "+886", label: "+886 台湾" },
  { code: "+65", label: "+65 新加坡" },
  { code: "+60", label: "+60 马来西亚" },
  { code: "+84", label: "+84 越南" },
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const sendCode = useAppStore((s) => s.sendCode);
  const authError = useAppStore((s) => s.authError);
  const setAuthError = useAppStore((s) => s.setAuthError);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [areaCode, setAreaCode] = useState("+86");
  const [areaOpen, setAreaOpen] = useState(false);

  useEffect(() => { setAuthError(null); }, [setAuthError]);

  useEffect(() => {
    if (countdown === 0) return;
    const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (sendingCode || resetting || countdown > 0) return;
    if (!phone.trim()) { setAuthError("请输入手机号"); return; }
    setSendingCode(true);
    try {
      await sendCode(phone.trim(), areaCode, 2);
      setCountdown(60);
    } catch {}
    setSendingCode(false);
  };

  const handleReset = async () => {
    if (resetting || sendingCode) return;
    setAuthError(null);
    if (!phone.trim() || !code.trim() || !password || !confirmPassword) {
      setAuthError("请填写所有字段"); return;
    }
    if (password.length < 6) { setAuthError("新密码至少 6 位"); return; }
    if (password !== confirmPassword) { setAuthError("两次输入的新密码不一致"); return; }
    setResetting(true);
    try {
      await resetPassword({ phoneNumber: phone.trim(), verifyCode: code.trim(), password, areaCode });
      setSuccess(true);
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="w-[400px] max-w-[calc(100%-2rem)] bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg">
            <MessageCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">重置密码</h1>
          <p className="text-gray-400 text-sm mt-1">验证手机号并设置新密码</p>
        </div>

        <button
          onClick={() => { setAuthError(null); navigate("/auth/sign-in"); }}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
        >
          <ArrowLeft size={16} /> 返回登录
        </button>

        {authError && (
          <div role="alert" className="mb-4 px-3 py-2 bg-red-50 text-red-500 text-sm rounded-lg">{authError}</div>
        )}

        {success ? (
          <p role="status" className="text-sm text-green-600">密码重置成功，请使用新密码登录</p>
        ) : <fieldset disabled={resetting || sendingCode} className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">手机号</label>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setAreaOpen(!areaOpen)}
                  className="h-full pl-3 pr-2 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  {areaCode}
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {areaOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setAreaOpen(false)} />
                    <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto w-40">
                      {AREA_CODES.map((ac) => (
                        <button
                          key={ac.code}
                          onClick={() => { setAreaCode(ac.code); setAreaOpen(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors"
                        >
                          {ac.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="relative flex-1">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                  placeholder="请输入手机号"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">验证码</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                  placeholder="请输入验证码"
                />
              </div>
              <button
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="px-4 py-2.5 text-sm border border-primary-200 text-primary-500 rounded-xl hover:bg-primary-50 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {sendingCode ? "发送中..." : countdown > 0 ? `${countdown} 秒后重发` : "获取验证码"}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">新密码</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                placeholder="请输入新密码"
              />
              <button
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">确认新密码</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type={showPwd ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-colors"
                placeholder="请再次输入新密码"
              />
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={resetting || sendingCode}
            className="w-full py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {resetting && <Loader2 size={16} className="animate-spin" />}
            {resetting ? "处理中..." : "重置密码"}
          </button>
        </fieldset>}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-300">重置密码即代表同意《用户协议》和《隐私政策》</p>
        </div>
      </div>
    </div>
  );
}
