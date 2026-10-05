import { useEffect, useState } from "react";
import { useAppStore } from "../../store/app-store";
import { bindEmail, sendVerifyCode } from "../../services/openim";

export default function EmailBinding() {
  const profile = useAppStore((s) => s.accountProfile);
  const authData = useAppStore((s) => s.authData);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (!countdown) return;
    const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);
  const valid = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("请输入有效邮箱"); return false; }
    return true;
  };
  const send = async () => {
    if (!valid() || busy || countdown) return;
    setBusy(true); setError(""); setSuccess("");
    try { await sendVerifyCode(email.trim(), undefined, 1); setCountdown(60); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };
  const bind = async () => {
    if (!valid() || busy) return;
    if (!code.trim()) { setError("请输入邮箱验证码"); return; }
    setBusy(true); setError(""); setSuccess("");
    try {
      await bindEmail(authData!.chatToken, email.trim(), code.trim());
      await useAppStore.getState().loadAllData();
      setSuccess("邮箱绑定成功，可用于登录和找回密码"); setEmail(""); setCode("");
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <div className="bg-white mt-2 border-y border-gray-100 p-5 space-y-3">
    <div className="text-sm font-medium text-gray-700">绑定邮箱</div>
    <p className="text-sm text-gray-500">当前邮箱：{profile?.email || "未绑定"}</p>
    <fieldset disabled={busy} className="space-y-3">
      <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setCode(""); }} placeholder="请输入要绑定的邮箱" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
      <div className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="请输入邮箱验证码" className="min-w-0 flex-1 px-3 py-2.5 border rounded-lg text-sm" />
        <button onClick={send} disabled={countdown > 0} className="text-sm text-primary-500 disabled:opacity-50">{countdown ? `${countdown} 秒后重发` : "获取验证码"}</button>
      </div>
      <button onClick={bind} className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm">{busy ? "处理中..." : "验证并绑定邮箱"}</button>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    {success && <p role="status" className="text-sm text-green-600">{success}</p>}
  </div>;
}
