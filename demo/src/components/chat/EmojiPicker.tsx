import { useState } from "react";
import { X } from "lucide-react";

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: "表情",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖"],
  },
  {
    name: "手势",
    emojis: ["👋", "🤚", "🖐️", "✋", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋"],
  },
  {
    name: "爱心",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", "💣", "💬", "🗯️", "💭", "💤"],
  },
  {
    name: "符号",
    emojis: ["✅", "❌", "⭕", "🚫", "💎", "🔥", "⭐", "🌟", "✨", "⚡", "☀️", "🌈", "☁️", "⛅", "🌙", "🌞", "🌈", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "🎵", "🎶", "✏️", "📌", "📍", "🔔", "🎵"],
  },
];

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  onClose: () => void;
  onSend?: (emoji: string) => void;
}

export default function EmojiPicker({ onPick, onClose, onSend }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const category = EMOJI_CATEGORIES[activeCategory];

  return (
    <div className="absolute bottom-14 left-0 right-0 z-50 bg-white rounded-t-xl shadow-xl border border-gray-100 max-h-64 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex gap-1">
          {EMOJI_CATEGORIES.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setActiveCategory(i)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeCategory === i ? "bg-primary-50 text-primary-600" : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {onSend && (
            <span className="text-xs text-gray-300">点击插入，长按或点发送大表情</span>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="grid grid-cols-8 gap-0.5">
          {category.emojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => onPick(emoji)}
              className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-gray-50 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
