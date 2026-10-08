import { getSDK, CbEvents } from "@openim/wasm-client-sdk";
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

const API_ADDR = import.meta.env.VITE_API_ADDR || "http://localhost:10002";
const WS_ADDR = import.meta.env.VITE_WS_ADDR || "ws://localhost:10001";
const CHAT_API = import.meta.env.VITE_CHAT_API || "http://localhost:10008";
const PLATFORM_ID = 5;

let sdk: ReturnType<typeof getSDK> | null = null;

export function getIMSDK(): ReturnType<typeof getSDK> {
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

export async function sendVerifyCode(phoneNumber: string, areaCode = "+86", usedFor: 1 | 2 | 3 = 1): Promise<void> {
  const res = await fetch(`${CHAT_API}/account/code/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", operationID: genOperationID() },
    body: JSON.stringify({ ...(phoneNumber.includes("@") ? { email: phoneNumber } : { phoneNumber, areaCode }), usedFor }),
  });
  const data = await res.json();
  if (data.errCode !== 0) throw new Error(data.errMsg || "发送验证码失败");
}

export async function resetPassword(params: {
  email?: string;
  phoneNumber?: string;
  areaCode?: string;
  verifyCode: string;
  password: string;
}): Promise<void> {
  const res = await fetch(`${CHAT_API}/account/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json", operationID: genOperationID() },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (data.errCode !== 0) throw new Error(data.errMsg || "重置密码失败");
}

export async function registerUser(params: {
  email?: string;
  phoneNumber?: string;
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
      ...(params.email && params.phoneNumber ? { contact: { phoneNumber: params.phoneNumber, areaCode: params.areaCode || "+86" } } : {}),
      user: {
        nickname: params.nickname,
        ...(params.email ? { email: params.email } : { areaCode: params.areaCode || "+86", phoneNumber: params.phoneNumber }),
        password: params.password,
      },
    }),
  });
  const data = await res.json();
  if (data.errCode !== 0) {
    const message = data.errCode === 20014 ? "该邮箱已注册，请直接登录或找回密码"
      : data.errCode === 20003 ? "该手机号已注册" : data.errMsg || "注册失败";
    throw new Error(message);
  }
  return data.data;
}

export async function loginUser(params: {
  email?: string;
  phoneNumber?: string;
  areaCode?: string;
  password?: string;
  verifyCode?: string;
}): Promise<{ imToken: string; chatToken: string; userID: string }> {
  const res = await fetch(`${CHAT_API}/account/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", operationID: genOperationID() },
    body: JSON.stringify({
      ...(params.email ? { email: params.email } : { areaCode: params.areaCode || "+86", phoneNumber: params.phoneNumber }),
      password: params.password,
      verifyCode: params.verifyCode,
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
  const listener = (payload: { data: unknown }) => {
    const data = payload?.data;
    if (typeof data === "string") {
      try {
        handler(JSON.parse(data) as SdkEventDataMap[K]);
        return;
      } catch {
        // Some SDK events use plain string payloads.
      }
    }
    handler(data as SdkEventDataMap[K]);
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

// ---------- Change Password ----------

export async function changePassword(params: {
  token: string;
  userID: string;
  oldPassword: string;
  newPassword: string;
}): Promise<void> {
  const res = await fetch(`${CHAT_API}/account/password/change`, {
    method: "POST",
    headers: { "Content-Type": "application/json", token: params.token, operationID: genOperationID() },
    body: JSON.stringify({
      userID: params.userID,
      currentPassword: params.oldPassword,
      newPassword: params.newPassword,
    }),
  });
  const data = await res.json();
  if (data.errCode !== 0) throw new Error(data.errMsg || "修改密码失败");
}

// ---------- Submit Feedback ----------

export async function submitFeedback(params: {
  contact: string;
  content: string;
  images?: string[];
}): Promise<void> {
  const res = await fetch(`${CHAT_API}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", operationID: genOperationID() },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (data.errCode !== 0) throw new Error(data.errMsg || "提交反馈失败");
}

export async function listFavorites(token: string): Promise<any[]> {
  const res = await fetch(`${CHAT_API}/user/favorites/list`, { method: "POST", headers: { "Content-Type": "application/json", token, operationID: genOperationID() }, body: "{}" });
  const data = await res.json();
  if (data.errCode !== 0) throw new Error(data.errMsg || "获取收藏失败");
  return data.data || [];
}

export async function saveFavorite(token: string, favorite: any): Promise<void> {
  const res = await fetch(`${CHAT_API}/user/favorites/save`, { method: "POST", headers: { "Content-Type": "application/json", token, operationID: genOperationID() }, body: JSON.stringify(favorite) });
  const data = await res.json();
  if (data.errCode !== 0) throw new Error(data.errMsg || "收藏失败");
}

export interface AccountProfile { email: string; phoneNumber: string; areaCode: string }
async function profileRequest(path: string, token: string, body: object) {
  const res = await fetch(`${CHAT_API}/user/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", token, operationID: genOperationID() },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.errCode !== 0) throw new Error(data.errCode === 20003 ? "该手机号已被其他账号使用" : data.errMsg || "保存账号资料失败");
  return data.data;
}
export async function getAccountProfile(token: string): Promise<AccountProfile> {
  return profileRequest("contact/get", token, {});
}
export async function saveContactProfile(token: string, profile: { phoneNumber: string; areaCode: string }): Promise<void> {
  await profileRequest("contact/save", token, profile);
}
export async function bindEmail(token: string, email: string, verifyCode: string): Promise<void> {
  await profileRequest("email/bind", token, { email, verifyCode });
}
