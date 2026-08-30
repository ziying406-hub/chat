import { useState, useEffect } from "react";
import { Phone, Video, MicOff, VideoOff, Volume2, PhoneOff, User } from "lucide-react";

interface CallState {
  type: "audio" | "video";
  name: string;
  avatar: string;
  duration: number;
  status: "calling" | "connected" | "ended";
}

let _callState: CallState | null = null;
const listeners = new Set<(s: CallState | null) => void>();

export function startCall(type: "audio" | "video", name: string, avatar: string) {
  _callState = { type, name, avatar, duration: 0, status: "calling" };
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

export default function CallOverlay() {
  const [call, setCall] = useState<CallState | null>(_callState);

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
      </p>

      {/* Controls */}
      <div className="flex gap-6 mt-16">
        <button className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
          <MicOff size={24} />
        </button>
        {call.type === "video" && (
          <button className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
            <VideoOff size={24} />
          </button>
        )}
        <button className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
          <Volume2 size={24} />
        </button>
        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
