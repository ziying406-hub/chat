import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface MediaViewerProps {
  images: { url: string; name?: string }[];
  index: number;
  onClose: () => void;
}

export default function MediaViewer({ images, index, onClose }: MediaViewerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const current = images[index];

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <span className="text-sm">{current.name || `图片 ${index + 1}/${images.length}`}</span>
        <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center"><X size={22} /></button>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center relative" onClick={onClose}>
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="absolute left-5 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
            style={{ visibility: index > 0 ? "visible" : "hidden" }}
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <img src={current.url} alt={current.name || ""} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="absolute right-5 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
            style={{ visibility: index < images.length - 1 ? "visible" : "hidden" }}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-center gap-4 py-4">
        {current.url && (
          <a href={current.url} download={current.name || "image"} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
            <Download size={18} />
          </a>
        )}
      </div>
    </div>
  );
}
