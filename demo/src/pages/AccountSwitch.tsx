import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { useAppStore } from "../store/app-store";
import { sdkLogin } from "../services/openim";

interface StoredAccount {
  userID: string;
  imToken: string;
  nickname: string;
  faceURL: string;
  phoneNumber: string;
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem("99chat_accounts");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function AccountSwitch() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    setAccounts(loadAccounts());
  }, []);

  const handleSwitch = async (account: StoredAccount) => {
    setSwitching(account.userID);
    try {
      await sdkLogin(account.userID, account.imToken);
      const store = useAppStore.getState();
      store.setAuthError(null);
      await store.loadAllData();
      navigate("/messages", { replace: true });
    } catch (e: any) {
      console.error("switch account:", e);
    }
    setSwitching(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="flex items-center gap-3 px-5 py-4">
        <button onClick={() => navigate("/messages")} className="text-white/80 hover:text-white"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-white">切换账号</h2>
      </div>

      <div className="flex-1 flex flex-col items-center px-8 pt-8">
        <div className="w-[400px] bg-white rounded-2xl shadow-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">已登录账号</h3>

          <div className="space-y-2">
            {accounts.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">暂无其他账号</p>
            )}
            {accounts.map((account) => (
              <div key={account.userID} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                <img src={account.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${account.userID}`} alt="" className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{account.nickname || account.userID}</p>
                  <p className="text-xs text-gray-400">{account.phoneNumber || account.userID}</p>
                </div>
                {switching === account.userID ? (
                  <Loader2 size={18} className="animate-spin text-primary-500" />
                ) : (
                  <button
                    onClick={() => handleSwitch(account)}
                    className="px-4 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    切换
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/auth/sign-in")}
            className="w-full mt-4 py-2.5 border border-primary-200 text-primary-500 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} /> 添加账号
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pb-8 text-white/60 text-sm">
        <MessageCircle size={16} />
        <span>99chat</span>
      </div>
    </div>
  );
}
