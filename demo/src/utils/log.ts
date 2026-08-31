declare global {
  interface Window {
    __99chatLogs?: { time: string; level: string; message: string }[];
  }
}

const MAX_LOGS = 200;

function getBuffer() {
  if (!window.__99chatLogs) window.__99chatLogs = [];
  return window.__99chatLogs;
}

export function log(level: string, ...args: any[]) {
  const buf = getBuffer();
  const message = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
    .join(" ");
  buf.push({ time: new Date().toISOString(), level, message });
  if (buf.length > MAX_LOGS) buf.shift();
  // eslint-disable-next-line no-console
  console.log(`[${level}]`, ...args);
}

export const logger = {
  info: (...args: any[]) => log("info", ...args),
  warn: (...args: any[]) => log("warn", ...args),
  error: (...args: any[]) => log("error", ...args),
  debug: (...args: any[]) => log("debug", ...args),
};

export default logger;
