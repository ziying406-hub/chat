import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">隐私政策</h2>
      </div>
      <div className="px-5 py-6 space-y-4 text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
        <h3 className="text-base font-semibold text-gray-800">99chat 隐私政策</h3>
        <p>更新日期：2026-08-31</p>
        <p>本隐私政策说明 99chat 如何收集、使用和保护您的个人信息。</p>
        <h4 className="font-medium text-gray-700 mt-4">1. 信息收集</h4>
        <p>本应用收集以下信息：手机号（用于注册）、昵称、头像、个性签名。消息内容在传输时加密，在本地 WASM SQLite 中加密存储。</p>
        <h4 className="font-medium text-gray-700 mt-4">2. 信息使用</h4>
        <p>您的信息仅用于提供即时通讯服务。我们不会将您的个人信息出售或分享给第三方。</p>
        <h4 className="font-medium text-gray-700 mt-4">3. 数据安全</h4>
        <p>传输层：HTTPS + WSS 加密。消息层：CryptoJS AES 加密。本地存储：WASM SQLite 加密。Token：JWT + 自动续期。</p>
        <h4 className="font-medium text-gray-700 mt-4">4. 数据存储</h4>
        <p>消息数据存储在 MongoDB 数据库中。媒体文件存储在 MinIO/S3 对象存储中。缓存数据存储在 Redis 中。所有数据可私有化部署。</p>
        <h4 className="font-medium text-gray-700 mt-4">5. 在线状态</h4>
        <p>您可以在设置中控制是否向他人显示在线状态。默认开启。</p>
        <h4 className="font-medium text-gray-700 mt-4">6. 推送通知</h4>
        <p>当您离线时，我们通过 FCM/APNS 发送推送通知。您可以在设置中关闭通知。</p>
        <h4 className="font-medium text-gray-700 mt-4">7. 数据删除</h4>
        <p>您可以删除会话、好友、退出群组。注销账号后，您的数据将在 30 天内删除。</p>
        <h4 className="font-medium text-gray-700 mt-4">8. 联系我们</h4>
        <p>如有隐私问题，请通过开发者工具 &gt; 用户反馈提交。</p>
      </div>
    </div>
  );
}
