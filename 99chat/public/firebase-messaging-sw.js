// Separate scope from the application's offline-cache service worker.
self.addEventListener("notificationclick", (event) => {
  event.stopImmediatePropagation();
  event.notification.close();
  event.waitUntil(self.clients.openWindow(new URL("/#/messages", self.location.origin).href));
});
importScripts("/firebase-config.js");
importScripts("/firebase-sdk/firebase-app-compat.js");
importScripts("/firebase-sdk/firebase-messaging-compat.js");
firebase.initializeApp(self.CHAT_FIREBASE.config);
// OpenIM sends a notification payload; Firebase displays it once in background.
firebase.messaging();
