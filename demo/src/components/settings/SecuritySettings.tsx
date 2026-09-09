import { useState } from "react";
import { Phone } from "lucide-react";
import { useAppStore } from "../../store/app-store";
import { changePassword } from "../../services/openim";

export default function SecuritySettings() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const phone = (currentUser as any)?.phoneNumber || "未绑定";

  const handleNext = () => {
    setError("");
    if (!oldPassword) {
      setError("请输入旧密码");
      return;
    }
    setStep(2);
  };

  const handleChangePassword = async () => {
    setError("");
    if (!newPassword) {
      setError("请输入新密码");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次密码不一致");
      return;
    }
    if (newPassword.length < 6) {
      setError("新密码至少6位");
      return;
    }
    setLoading(true);
    try {
      await changePassword({
        userID: currentUser?.userID || "",
        oldPassword,
        newPassword,
      });
      setSuccess("密码修改成功");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStep(1);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e?.message || "修改失败");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">安全</h2>
      </div>

      <div className="bg-white mt-2 border-y border-gray-100">
        <div className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-50">
          <Phone size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700">手机号码</span>
          <span className="ml-auto text-sm text-gray-400">{phone}</span>
        </div>
      </div>

      <div className="bg-white mt-2 border-y border-gray-100 p-5 space-y-3">
        <div className="text-sm font-medium text-gray-700">修改密码</div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">旧密码</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="请输入旧密码"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
          />
        </div>
        {step >= 2 && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
          </>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-500">{success}</p>}
        <button
          onClick={step === 1 ? handleNext : handleChangePassword}
          disabled={loading}
          className="w-full py-3 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading ? "修改中..." : step === 1 ? "下一步" : "确认修改"}
        </button>
      </div>
    </div>
  );
}
