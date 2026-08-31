import { useState, useEffect } from "react";
import { MicOff, Mic, VideoOff, Volume2, PhoneOff, MessageSquare, RotateCcw } from "lucide-react";

interface CallState {
  type: "audio" | "video";
  name: string;
  avatar: string;
  conversationID?: string;
  duration: number;
  status: "calling" | "connected" | "ended" | "failed";
}

let _callState: CallState | null = null;
const listeners = new Set<(s: CallState | null) => void>();

export function startCall(type: "audio" | "video", name: string, avatar: string, conversationID?: string) {
  _callState = { type, name, avatar, conversationID, duration: 0, status: "calling" };
  listeners.forEach((l) => l(_callState));
  setTimeout(() => {
    if (_callState && _callState.status === "calling") {
      _callState.status = "connected";
      listeners.forEach((l) => l({ ..._callState! }));
    }
  }, 2000);
}

export function endCall() {
  if (_callState) {
    _callState.status = "ended";
    listeners.forEach((l) => l({ ..._callState! }));
  }
  setTimeout(() => {
    _callState = null;
    listeners.forEach((l) => l(null));
  }, 1500);
}

export function retryCall() {
  if (_callState) {
    _callState.status = "calling";
    _callState.duration = 0;
    listeners.forEach((l) => l({ ..._callState! }));
    setTimeout(() => {
      if (_callState && _callState.status === "calling") {
        _callState.status = "connected";
        listeners.forEach((l) => l({ ..._callState! }));
      }
    }, 2000);
  }
}

export function minimizeCall() {
  if (_callState) {
    _callState.status = "ended";
    listeners.forEach((l) => l({ ..._callState! }));
    setTimeout(() => {
      _callState = null;
      listeners.forEach((l) => l(null));
    }, 100);
  }
}

export default function CallOverlay() {
  const [call, setCall] = useState<CallState | null>(_callState);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [showDevices, setShowDevices] = useState(false);

  useEffect(() => {
    listeners.add(setCall);
    return () => { listeners.delete(setCall); };
  }, []);

  useEffect(() => {
    if (!call || call.status !== "connected") return;
    const timer = setInterval(() => {
      _callState = { ..._callState!, duration: _callState!.duration + 1 };
      listeners.forEach((l) => l({ ..._callState! }));
    }, 1000);
    return () => clearInterval(timer);
  }, [call?.status]);

  if (!call) return null;

  const fmtDur = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleSendMessage = () => {
    if (call.conversationID) {
      minimizeCall();
      window.location.hash = `#/messages/session/${call.conversationID}`;
    }
  };

  const handleRetry = () => {
    retryCall();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
      {/* Avatar */}
      <div className="relative mb-8">
        <img src={call.avatar} alt="" className="w-32 h-32 rounded-full object-cover border-4 border-white/20" />
        {call.status === "calling" && (
          <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
        )}
      </div>

      {/* Info */}
      <h2 className="text-2xl font-bold text-white mb-2">{call.name}</h2>
      <p className="text-gray-300 text-sm">
        {call.status === "calling" && "正在呼叫..."}
        {call.status === "connected" && fmtDur(call.duration)}
        {call.status === "ended" && "通话已结束"}
        {call.status === "failed" && "通话失败"}
      </p>

      {/* Waiting hint */}
      {call.status === "calling" && (
        <p className="text-gray-400 text-sm mt-2 animate-pulse">等待对方接听...</p>
      )}

      {/* Controls */}
      {call.status !== "failed" ? (
        <div className="flex gap-6 mt-16 items-center">
          <button
            onClick={() => setMuted(!muted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${muted ? "bg-white/30 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            {muted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          {call.type === "video" && (
            <button
              onClick={() => setVideoOff(!videoOff)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${videoOff ? "bg-white/30 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              <VideoOff size={24} />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowDevices(!showDevices)}
              className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Volume2 size={24} />
            </button>
            {showDevices && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-40 text-sm" onClick={(e) => e.stopPropagation()}>
                <div className="px-4 py-2 text-xs text-gray-400 font-medium">音频输出设备</div>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                  <Volume2 size={14} /> 扬声器
                </button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                  <Volume2 size={14} /> 听筒
                </button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                  <Volume2 size={14} /> 蓝牙耳机
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            title="发消息"
          >
            <MessageSquare size={24} />
          </button>
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      ) : (
        <div className="flex gap-6 mt-16">
          <button
            onClick={handleRetry}
            className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            title="重试"
          >
            <RotateCcw size={24} />
          </button>
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
