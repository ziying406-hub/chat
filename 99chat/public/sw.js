const CACHE_NAME = "99chat-pwa-v1";
const CORE_ASSETS = [
  "/", "/manifest.json", "/wasm_exec.js", "/openIM.wasm", "/sql-wasm.wasm",
  "/favicon.svg", "/app-icon.svg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    // The initial page loads before this worker controls it; cache its built JS/CSS too.
    const html = await (await cache.match("/")).text();
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1]);
    await cache.addAll(assets);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(key => key.startsWith("99chat-") && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || /^\/(chat|im|api|account|user)(\/|$)/.test(url.pathname)) return;
  const navigation = request.mode === "navigate";
  const config = url.pathname === "/manifest.json" || url.pathname === "/firebase-config.js";
  if (navigation || config) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const key = navigation ? "/" : request;
      try {
        const response = await fetch(request, { cache: "no-cache" });
        if (response.ok) await cache.put(key, response.clone());
        return response;
      } catch {
        return (await cache.match(key)) || Response.error();
      }
    })());
    return;
  }
  if (!/\.(js|css|wasm|png|svg|woff2?)$/.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
