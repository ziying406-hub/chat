import { initializeApp, getApps } from "firebase/app";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { getIMSDK } from "./openim";

async function messagingClient() {
  if (!await isSupported()) throw new Error("此浏览器不支持离线推送");
  const settings = (window as any).CHAT_FIREBASE;
  if (!settings?.config || !settings.vapidKey) throw new Error("离线推送尚未配置");
  const app = getApps()[0] || initializeApp(settings.config);
  return getMessaging(app);
}

export async function registerWebPush(): Promise<void> {
  if (Notification.permission !== "granted") throw new Error("请允许浏览器通知权限");
  const messaging = await messagingClient();
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js?v=2", {
    scope: "/firebase-cloud-messaging-push-scope", updateViaCache: "none",
  });
  if (!registration.active) {
    const worker = registration.installing || registration.waiting;
    if (!worker) throw new Error("推送服务未就绪，请重试");
    await new Promise<void>((resolve, reject) => {
      const checkState = () => {
        if (worker.state === "activated" || worker.state === "redundant") {
          worker.removeEventListener("statechange", checkState);
          if (worker.state === "activated") resolve();
          else reject(new Error("推送服务安装失败，请重试"));
        }
      };
      worker.addEventListener("statechange", checkState);
      checkState();
    });
  }
  const token = await getToken(messaging, {
    vapidKey: (window as any).CHAT_FIREBASE.vapidKey, serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("未获取到推送令牌，请重试");
  const result = await getIMSDK().updateFcmToken(token, Math.floor(Date.now() / 1000) + 7 * 86400);
  if (result.errCode !== 0) {
    await deleteToken(messaging);
    throw new Error(result.errMsg || "绑定推送失败");
  }
}

export async function unregisterWebPush(): Promise<void> {
  if (!await isSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration("/firebase-cloud-messaging-push-scope");
  if (!await registration?.pushManager.getSubscription()) return;
  await deleteToken(await messagingClient());
}
