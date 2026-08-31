import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Agreement() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <h2 className="text-base font-semibold text-gray-800">用户协议</h2>
      </div>
      <div className="px-5 py-6 space-y-4 text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
        <h3 className="text-base font-semibold text-gray-800">99chat 用户服务协议</h3>
        <p>更新日期：2026-08-31</p>
        <p>欢迎使用 99chat（以下简称"本应用"）。本应用由 OpenIM 开源框架驱动，是一款轻量级即时通讯 PWA 应用。使用本应用即表示您同意以下条款：</p>
        <h4 className="font-medium text-gray-700 mt-4">1. 服务说明</h4>
        <p>本应用提供即时通讯服务，包括单聊、群聊、音视频通话、通讯录管理等功能。服务基于 OpenIM 开源框架实现，可私有化部署。</p>
        <h4 className="font-medium text-gray-700 mt-4">2. 用户注册与账号</h4>
        <p>您需要通过手机号注册账号。您应提供真实信息，并对账号安全负责。账号信息存储在本地 WASM SQLite 加密数据库中。</p>
        <h4 className="font-medium text-gray-700 mt-4">3. 隐私保护</h4>
        <p>本应用采用端到端加密传输，本地 WASM 加密存储。您的消息数据仅存储在您的设备和服务器上，不会向第三方分享。详见《隐私政策》。</p>
        <h4 className="font-medium text-gray-700 mt-4">4. 使用规范</h4>
        <p>您不得利用本应用从事违法、侵权或骚扰他人的行为。我们有权对违规账号采取限制措施。</p>
        <h4 className="font-medium text-gray-700 mt-4">5. 免责声明</h4>
        <p>本应用基于开源软件提供，不保证服务不间断或不出错。对于因使用本应用产生的任何损失，我们不承担责任。</p>
        <h4 className="font-medium text-gray-700 mt-4">6. 条款修改</h4>
        <p>我们可能不时更新本协议。更新后继续使用即视为接受修改后的协议。</p>
      </div>
    </div>
  );
}
