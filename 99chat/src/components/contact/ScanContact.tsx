import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import QrScanner from "qr-scanner";
import { getIMSDK } from "../../services/openim";
import { useAppStore } from "../../store/app-store";

interface ScannedUser { userID: string; nickname: string; faceURL: string }

export default function ScanContact({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const scanner = useRef<QrScanner | null>(null);
  const reading = useRef(false);
  const mounted = useRef(true);
  const [user, setUser] = useState<ScannedUser | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const currentUserID = useAppStore((s) => s.currentUser?.userID);
  const isFriend = useAppStore((s) => !!user && s.friends.some((f) => f.userID === user.userID));

  const decoded = useCallback(async (text: string) => {
    if (reading.current || !mounted.current) return;
    const match = /^99chat:user:([a-zA-Z0-9_-]+)$/.exec(text.trim());
    if (!match) { setError("这不是 99chat 个人名片二维码，请扫描对方的名片"); return; }
    reading.current = true;
    void scanner.current?.pause(true);
    setLoading(true);
    setError("");
    try {
      const result = await getIMSDK().getUsersInfo([match[1]]);
      const found = result.data?.find((item) => item.userID === match[1]);
      if (!found) throw new Error("该用户不存在或已注销");
      if (mounted.current) setUser({ userID: found.userID, nickname: found.nickname, faceURL: found.faceURL });
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : "获取用户资料失败，请重新扫描");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    const instance = new QrScanner(video.current!, (result) => { void decoded(result.data); }, {
      preferredCamera: "environment", maxScansPerSecond: 8, returnDetailedScanResult: true,
      onDecodeError: () => {},
    });
    scanner.current = instance;
    void instance.start().catch(() => {
      if (active) setError("无法使用摄像头，请检查摄像头权限，或从相册选择二维码");
    }).finally(() => { if (active) setStarting(false); });
    return () => { active = false; mounted.current = false; instance.destroy(); scanner.current = null; };
  }, [decoded]);

  const restart = async () => {
    reading.current = false;
    setUser(null);
    setError("");
    setStarting(true);
    try { await scanner.current?.start(); }
    catch { if (mounted.current) setError("无法使用摄像头，请检查摄像头权限，或从相册选择二维码"); }
    finally { if (mounted.current) setStarting(false); }
  };

  const scanImage = async (file: File) => {
    void scanner.current?.pause(true);
    reading.current = false;
    setUser(null);
    setError("");
    setLoading(true);
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      await decoded(result.data);
    } catch { if (mounted.current) setError("图片中未识别到二维码，请选择清晰的名片图片"); }
    finally { if (mounted.current) setLoading(false); }
  };

  const sendRequest = async () => {
    if (!user || sending || isFriend || user.userID === currentUserID) return;
    setSending(true);
    setError("");
    try { await useAppStore.getState().addFriend(user.userID, "通过扫一扫添加好友"); onSent(); }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : "好友申请发送失败，请重试"); }
    finally { if (mounted.current) setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label="扫一扫" className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">扫一扫</h3>
          <button aria-label="关闭扫一扫" onClick={onClose} className="p-2 text-gray-400"><X size={20} /></button>
        </div>
        <div className={`relative aspect-square rounded-xl bg-gray-900 overflow-hidden ${user ? "hidden" : ""}`}>
          <video ref={video} muted playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-10 border-2 border-white/80 rounded-xl pointer-events-none" />
          {(starting || loading) && <div className="absolute inset-0 flex items-center justify-center text-white bg-black/40"><Loader2 className="animate-spin" size={28} /></div>}
        </div>
        {!user && <p className="mt-3 text-center text-sm text-gray-500">将对方的 99chat 名片二维码放入框内</p>}
        {user && <div className="flex flex-col items-center gap-3 py-5">
          <img src={user.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userID}`} alt="用户头像" className="w-16 h-16 rounded-2xl bg-gray-100" />
          <p className="font-semibold text-gray-800">{user.nickname || user.userID}</p>
          <p className="text-xs text-gray-500">ID: {user.userID}</p>
          {user.userID === currentUserID ? <p className="text-sm text-gray-500">这是你自己的名片</p> : isFriend ? <p className="text-sm text-gray-500">对方已经是你的好友</p> :
            <button onClick={sendRequest} disabled={sending} className="w-full rounded-xl bg-primary-500 py-2.5 text-sm text-white disabled:opacity-50">{sending ? "发送中..." : "发送申请"}</button>}
        </div>}
        {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button onClick={() => fileInput.current?.click()} disabled={loading || sending} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm text-gray-700 disabled:opacity-50"><ImagePlus size={18} />从相册识别</button>
          <button onClick={() => { void restart(); }} disabled={loading || sending} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm text-gray-700 disabled:opacity-50"><Camera size={18} />重新扫描</button>
        </div>
        <input ref={fileInput} type="file" accept="image/*" aria-label="选择二维码图片" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void scanImage(file); }} />
      </section>
    </div>
  );
}
