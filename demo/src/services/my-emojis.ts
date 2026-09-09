export interface MyEmoji {
  id: string;
  url: string;
  name: string;
}

function storageKey(userID: string) {
  return `99chat_my_emojis_${userID}`;
}

export function getMyEmojis(userID?: string) {
  if (!userID) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userID)) || "[]");
    return Array.isArray(saved) ? saved as MyEmoji[] : [];
  } catch {
    return [];
  }
}

export function saveMyEmojis(userID: string, emojis: MyEmoji[]) {
  localStorage.setItem(storageKey(userID), JSON.stringify(emojis));
}
