import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function DebugInfo() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const [currentTime, setCurrentTime] = useState("");
  const [pingResults, setPingResults] = useState<Record<string, string>>({});
  const [browserInfo, setBrowserInfo] = useState("");
  const [screenSize, setScreenSize] = useState("");
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);
  const [swStatus, setSwStatus] = useState("");
  const [storageUsed, setStorageUsed] = useState("");
  const [privateBrowsing, setPrivateBrowsing] = useState("");
  const [networkStatus, setNetworkStatus] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tz = now.getTimezoneOffset();
      const sign = tz <= 0 ? "+" : "-";
      const tzH = Math.abs(Math.floor(tz / 60)).toString().padStart(2, "0");
      const tzM = Math.abs(tz % 60).toString().padStart(2, "0");
      setCurrentTime(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}${sign}${tzH}:${tzM}`
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Browser info
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let os = "Unknown";
    if (ua.includes("Chrome")) browser = "Chrome " + (ua.match(/Chrome\/([\d.]+)/)?.[1] || "");
    else if (ua.includes("Firefox")) browser = "Firefox " + (ua.match(/Firefox\/([\d.]+)/)?.[1] || "");
    else if (ua.includes("Safari")) browser = "Safari " + (ua.match(/Version\/([\d.]+)/)?.[1] || "");
    if (ua.includes("Mac")) os = "macOS " + (ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, ".") || "");
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Linux")) os = "Linux";
    setBrowserInfo(`${os} ${browser}`);

    // Screen size
    setScreenSize(`${window.innerWidth} × ${window.innerHeight}`);

    // Private browsing detection
    if ("webkitRequestFileSystem" in window) {
      setPrivateBrowsing("否");
    } else {
      setPrivateBrowsing("可能是");
    }

    // Network status
    if ("navigator" in window && "onLine" in navigator) {
      setNetworkStatus(navigator.onLine ? "在线" : "离线");
    }

    // Storage usage
    if ("storage" in navigator && navigator.storage?.estimate) {
      navigator.storage.estimate().then((est) => {
        const usedMB = ((est.usage || 0) / 1024 / 1024).toFixed(1);
        const quotaMB = ((est.quota || 0) / 1024 / 1024 / 1024).toFixed(1);
        setStorageUsed(`${usedMB}MB / ${quotaMB}GB`);
      });
    } else {
      // Fallback: estimate from localStorage
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) total += (localStorage.getItem(key)?.length || 0);
      }
      setStorageUsed(`${(total / 1024).toFixed(1)}KB`);
    }

    // Media types - real detection
    const finalTypes: string[] = [];
    const videoTypes = ["mp4", "webm", "ogg"];
    const audioTypes = ["mp4", "webm", "ogg", "mp3", "mpeg", "wav"];
    const videoCodecs = ["opus", "avc1", "vp9", "vp8", "h264"];
    const audioCodecs = ["opus", "pcm", "mp3", "aac"];

    for (const vt of videoTypes) {
      const canPlayVideo = document.createElement("video").canPlayType(`video/${vt}`);
      if (canPlayVideo) {
        for (const c of videoCodecs) {
          if (document.createElement("video").canPlayType(`video/${vt};codecs="${c}"`)) {
            finalTypes.push(`v/${vt};${c}`);
          }
        }
        finalTypes.push(`v/${vt}`);
      }
    }
    for (const at of audioTypes) {
      const canPlayAudio = document.createElement("audio").canPlayType(`audio/${at}`);
      if (canPlayAudio) {
        for (const c of audioCodecs) {
          if (document.createElement("audio").canPlayType(`audio/${at};codecs="${c}"`)) {
            finalTypes.push(`a/${at};${c}`);
          }
        }
        finalTypes.push(`a/${at}`);
      }
    }
    // Deduplicate
    setMediaTypes([...new Set(finalTypes)]);

    // Service worker status
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        setSwStatus(regs.length > 0 ? "activated" : "none");
      });
    } else {
      setSwStatus("unsupported");
    }

    // Ping tests - real network checks
    const serverTargets: Record<string, string> = {
      "App": "pwa.6cchh6.com",
      "API": "zor.appsix24.com:38405",
      "File": "mo6if.ay79sf.com",
      "File Upload": "6csxdx.mgpwns.com",
      "Dynamic": "4hhh93.6zs6ofa.com",
      "WS": "cdsw.avvz5z.com:38405",
    };
    const results: Record<string, string> = {};
    setPingResults({});
    Object.entries(serverTargets).forEach(([key, url]) => {
      const start = performance.now();
      fetch(`https://${url}`, { mode: "no-cors", signal: AbortSignal.timeout(5000) })
        .then(() => { results[key] = `${Math.round(performance.now() - start)}ms`; setPingResults({ ...results }); })
        .catch(() => { results[key] = "-ms"; setPingResults({ ...results }); });
    });

    // External connectivity tests
    const externalTargets: Record<string, string> = {
      "百度": "baidu.com",
      "腾讯": "qq.com",
      "微信": "wechat.com",
    };
    Object.entries(externalTargets).forEach(([key, url]) => {
      const start = performance.now();
      fetch(`https://${url}`, { mode: "no-cors", signal: AbortSignal.timeout(5000) })
        .then(() => { results[key] = `${Math.round(performance.now() - start)}ms`; setPingResults({ ...results }); })
        .catch(() => { results[key] = "-ms"; setPingResults({ ...results }); });
    });
  }, []);

  const handleSaveImage = async () => {
    try {
      const text = document.body.innerText;
      const blob = new Blob([text], { type: "text/plain" });
      const link = document.createElement("a");
      link.download = `debug-${Date.now()}.txt`;
      link.href = URL.createObjectURL(blob);
      link.click();
    } catch {}
  };

  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex items-baseline gap-2 py-1.5">
      <span className="text-xs font-bold text-gray-700 whitespace-nowrap">{label}</span>
      <span className="text-xs text-gray-500">{value}</span>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/settings/general")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">调试资讯</h2>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <InfoRow label="聊天号" value={currentUser?.userID || ""} />
          <InfoRow label="版本号" value="v1.0.0 D/WEB" />
          <InfoRow label="画面尺寸" value={screenSize} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          {["App", "API", "File", "File Upload", "Dynamic", "WS"].map((key) => (
            <div key={key} className="flex items-center justify-between py-1.5">
              <span className="text-xs font-bold text-gray-700">{key}</span>
              <span className="text-xs text-gray-500">{pingResults[key] || "检测中..."}</span>
            </div>
          ))}
          <div className="border-t border-gray-50 my-2" />
          {["百度", "腾讯", "微信"].map((key) => (
            <div key={key} className="flex items-center justify-between py-1.5">
              <span className="text-xs font-bold text-gray-700">{key}</span>
              <span className="text-xs text-gray-500">{pingResults[key] || "检测中..."}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <InfoRow label="浏览器" value={browserInfo} />
          <div className="py-1.5">
            <span className="text-xs font-bold text-gray-700">私密浏览</span>
            <span className="text-xs text-gray-500 ml-2">{privateBrowsing}</span>
          </div>
          <div className="py-1.5">
            <span className="text-xs font-bold text-gray-700">网络状态</span>
            <span className="text-xs text-gray-500 ml-2">{networkStatus}</span>
          </div>
          <div className="py-1.5">
            <span className="text-xs font-bold text-gray-700">储存空间</span>
            <span className="text-xs text-gray-500 ml-2">{storageUsed}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs font-bold text-gray-700 mb-2">媒体支援</div>
          <div className="flex flex-wrap gap-1">
            {mediaTypes.map((t, i) => (
              <span key={i} className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">{t}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <InfoRow label="sw.js" value={swStatus} />
          <div className="grid grid-cols-4 gap-2 py-1.5">
            {["通知", "相机", "麦克风", "储存", "WS", "IDB", "Worker", "Touch", "Barcode"].map((item) => (
              <span key={item} className="text-xs font-bold text-gray-700">{item}</span>
            ))}
          </div>
          <InfoRow label="现在时间" value={currentTime} />
        </div>

        <div className="sticky bottom-4 flex justify-center">
          <button
            onClick={handleSaveImage}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors shadow-lg"
          >
            以图片保存
          </button>
        </div>
      </div>
    </div>
  );
}
