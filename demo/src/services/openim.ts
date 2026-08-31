import { getSDK, CbEvents, type WasmSdk } from "@openim/wasm-client-sdk";
import type {
  ConversationItem,
  MessageItem,
  FriendUserItem,
  GroupItem,
  GroupMemberItem,
  FriendApplicationItem,
  SelfUserInfo,
  SdkEventDataMap,
} from "@openim/wasm-client-sdk";

const API_ADDR = "http://localhost:10002";
const WS_ADDR = "ws://localhost:10001";
const CHAT_API = "http://localhost:10008";
const PLATFORM_ID = 5;

let sdk: WasmSdk | null = null;

export function getIMSDK(): WasmSdk {
  if (!sdk) {
    sdk = getSDK({
      coreWasmPath: "/openIM.wasm",
      sqlWasmPath: "/sql-wasm.wasm",
      debug: false,
    });
  }
  return sdk;
}

function genOperationID() {
  return `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Chat API ----------

export async function sendVerifyCode(phoneNumber: string, areaCode = "+86"): Promise<void> {
  const res = await fetch(`${CHAT_API}/account/code/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", operationID: genOperationID() },
    body: JSON.stringify({ phoneNumber, areaCode, usedFor: 1 }),
  });
  const data = await res.json();
  if (data.errCode !== 0) throw new Error(data.errMsg || "发送验证码失败");
}

export async function registerUser(params: {
  phoneNumber: string;
  areaCode?: string;
  verifyCode: string;
  nickname: string;
  password: string;
}): Promise<{ imToken: string; chatToken: string; userID: string }> {
  const res = await fetch(`${CHAT_API}/account/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", operationID: genOperationID() },
    body: JSON.stringify({
      verifyCode: params.verifyCode,
      platform: PLATFORM_ID,
      autoLogin: true,
      user: {
        nickname: params.nickname,
        areaCode: params.areaCode || "+86",
        phoneNumber: params.phoneNumber,
        password: params.password,
      },
    }),
  });
  const data = await res.json();
  if (data.errCode !== 0) throw new Error(data.errMsg || "注册失败");
  return data.data;
}

export async function loginUser(params: {
  phoneNumber: string;
  areaCode?: string;
  password: string;
}): Promise<{ imToken: string; chatToken: string; userID: string }> {
  const res = await fetch(`${CHAT_API}/account/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", operationID: genOperationID() },
    body: JSON.stringify({
      areaCode: params.areaCode || "+86",
      phoneNumber: params.phoneNumber,
      password: params.password,
      platform: PLATFORM_ID,
      autoLogin: true,
    }),
  });
  const data = await res.json();
  if (data.errCode !== 0) throw new Error(data.errMsg || "登录失败");
  return data.data;
}

// ---------- SDK login/logout ----------

export async function sdkLogin(userID: string, token: string): Promise<void> {
  const im = getIMSDK();
  await im.login({ userID, token, platformID: PLATFORM_ID, apiAddr: API_ADDR, wsAddr: WS_ADDR });
}

export async function sdkLogout(): Promise<void> {
  const im = getIMSDK();
  await im.logout();
}

// ---------- Event listener helper ----------

export function on<K extends keyof SdkEventDataMap>(event: K, handler: (data: SdkEventDataMap[K]) => void): () => void {
  const im = getIMSDK();
  const listener = (data: { data: string }) => {
    try {
      const parsed = JSON.parse(data.data);
      handler(parsed as SdkEventDataMap[K]);
    } catch {
      handler({} as SdkEventDataMap[K]);
    }
  };
  im.on(event, listener);
  return () => im.off(event, listener);
}

export { CbEvents };
export type {
  ConversationItem,
  MessageItem,
  FriendUserItem,
  GroupItem,
  GroupMemberItem,
  FriendApplicationItem,
  SelfUserInfo,
};

// ---------- FCM Push ----------

export async function registerFCM(): Promise<void> {
  try {
    const mod = "firebase" + "/messaging";
    const firebase: any = await import(/* @vite-ignore */ mod);
    const messaging = firebase.getMessaging();
    const token = await firebase.getToken(messaging, {
      vapidKey: (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY,
    });
    if (!token) return;
    const expireTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    const im = getIMSDK();
    await im.updateFcmToken(token, expireTime);
  } catch (e: any) {
    console.warn("FCM registration skipped:", e?.message || e);
  }
}
