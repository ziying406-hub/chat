export function getUserStorageKey(key: string, userID: string): string {
  return `${key}_${userID}`;
}
