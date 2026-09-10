import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MobileBackButton({ to, label = "返回个人中心" }: { to: string; label?: string }) {
  const navigate = useNavigate();
  return <button aria-label={label} onClick={() => navigate(to)} className="mobile-back text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>;
}
