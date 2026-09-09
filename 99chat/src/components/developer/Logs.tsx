import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function Logs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<{ time: string; level: string; message: string }[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setLogs([...(window.__99chatLogs || [])]);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const handleClear = () => {
    window.__99chatLogs = [];
    setLogs([]);
  };

  const filtered = logs.filter(
    (l) =>
      !filter ||
      l.message.toLowerCase().includes(filter.toLowerCase()) ||
      l.level.toLowerCase().includes(filter.toLowerCase())
  );

  const levelColor = (level: string) => {
    switch (level) {
      case "error": return "text-red-500";
      case "warn": return "text-yellow-500";
      case "info": return "text-blue-500";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/developer")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">实时日志</h2>
        <span className="ml-auto text-xs text-gray-400">{logs.length}/200</span>
      </div>

      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="过滤日志..."
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
        />
        <button
          onClick={handleClear}
          className="px-3 py-2 bg-red-50 text-red-500 rounded-lg text-sm hover:bg-red-100 transition-colors flex items-center gap-1.5"
        >
          <Trash2 size={16} /> 清空
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-900 p-4">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">暂无日志</p>
        ) : (
          <div className="space-y-1 font-mono text-xs">
            {filtered.map((log, i) => (
              <div key={i} className="flex gap-2 text-gray-300">
                <span className="text-gray-600 shrink-0">{log.time.slice(11, 19)}</span>
                <span className={`shrink-0 w-12 ${levelColor(log.level)}`}>{log.level}</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
