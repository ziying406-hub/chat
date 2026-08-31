import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function ChangePassword() {
  const navigate = useNavigate();
  const authData = useAppStore((s) => s.authData);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("请填写所有字段");
      return;
    }
    if (newPassword.length < 6) {
      setError("新密码至少 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:10008/account/change_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          areaCode: "+86",
          phoneNumber: authData?.userID || "",
        }),
      });
      const data = await res.json();
      if (data.errCode !== 0 && data.errCode !== undefined) {
        throw new Error(data.errMsg || "修改密码失败");
      }
      setSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setError(e.message || "修改密码失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/settings/privacy")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">修改密码</h2>
      </div>

      <div className="bg-white mt-2 border-y border-gray-50 px-5 py-2 space-y-1">
        <div className="relative">
          <input
            type={showOld ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="当前密码"
            className="w-full px-4 py-3 pr-10 border-b border-gray-50 text-sm focus:outline-none focus:border-primary-400"
          />
          <button onClick={() => setShowOld(!showOld)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300">
            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="新密码"
            className="w-full px-4 py-3 pr-10 border-b border-gray-50 text-sm focus:outline-none focus:border-primary-400"
          />
          <button onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300">
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="确认新密码"
            className="w-full px-4 py-3 pr-10 text-sm focus:outline-none focus:border-primary-400"
          />
          <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300">
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error && <p className="px-5 py-2 text-sm text-red-500">{error}</p>}
      {success && <p className="px-5 py-2 text-sm text-green-500">密码修改成功</p>}

      <div className="px-5 mt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading ? "修改中..." : "修改密码"}
        </button>
      </div>
    </div>
  );
}
