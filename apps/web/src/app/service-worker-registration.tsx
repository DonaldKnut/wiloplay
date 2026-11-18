"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void (async () => {
        try {
          const workerUrl = new URL("/sw.js", window.location.href).href;
          const appScope = new URL("/", window.location.href).href;
          const registrations = await navigator.serviceWorker.getRegistrations();
          const appRegistrations = registrations.filter((registration) => {
            const workers = [registration.active, registration.waiting, registration.installing];
            return registration.scope === appScope
              && workers.some((worker) => worker?.scriptURL === workerUrl);
          });
          const wasControlled = navigator.serviceWorker.controller?.scriptURL === workerUrl;
          const removed = await Promise.all(appRegistrations.map((registration) => registration.unregister()));
          if (removed.some((success) => !success)) {
            console.error("Wiloplay could not unregister its development service worker.");
          }

          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames
              .filter((cacheName) => cacheName.startsWith("wiloplay-shell-"))
              .map((cacheName) => caches.delete(cacheName)),
          );
          if (wasControlled && removed.some(Boolean)) window.location.reload();
        } catch (error) {
          console.error("Wiloplay could not clear its development service worker.", error);
        }
      })();
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Wiloplay service worker registration failed.", error);
    });
  }, []);

  return null;
}
