// public/sw.js - Service Worker for PWA
const CACHE_NAME = "store-app-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg"
];

// ติดตั้ง Service Worker และบันทึกแคชเริ่มต้น
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// เคลียร์แคชเวอร์ชันเก่าเมื่อมีการอัปเดต Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// จัดการการดึงข้อมูล (Fetch Requests)
self.addEventListener("fetch", (event) => {
  // ข้ามการแคชสำหรับ API requests เพื่อให้ได้ข้อมูลเรียลไทม์เสมอ
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // ออฟไลน์ Fallback
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
