import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const [nickname, setNickname] = useState(currentUser.nickname);
  const [signature, setSignature] = useState(currentUser.signature);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base font-semibold text-gray-800">编辑资料</h2>
        </div>
        <button
          onClick={() => { updateProfile({ nickname, signature }); navigate("/settings"); }}
          className="text-sm text-primary-500 font-medium hover:text-primary-600"
        >
          保存
        </button>
      </div>

      <div className="bg-white px-6 py-6 flex flex-col items-center border-b border-gray-50">
        <img src={currentUser.faceURL} alt="" className="w-20 h-20 rounded-2xl object-cover bg-gray-100" />
        <button className="mt-3 text-sm text-primary-500 hover:text-primary-600">更换头像</button>
      </div>

      <div className="bg-white mt-2 border-y border-gray-50">
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-500">昵称</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="text-sm text-gray-800 text-right outline-none w-40"
          />
        </div>
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-500">性别</span>
          <span className="text-sm text-gray-400">{currentUser.gender === 1 ? "男" : currentUser.gender === 2 ? "女" : "未知"}</span>
        </div>
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
          <span className="text-sm text-gray-500">个性签名</span>
          <input
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="text-sm text-gray-800 text-right outline-none w-40"
          />
        </div>
        <div className="px-5 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">用户 ID</span>
          <span className="text-sm text-gray-400 font-mono">{currentUser.userID}</span>
        </div>
      </div>
    </div>
  );
}
