self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  if (!event?.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (error) {
    payload = { body: event.data.text() };
  }

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      clients.forEach((client) => {
        client.postMessage({
          type: "FCM_NOTIFICATION",
          payload,
        });
      });
    })(),
  );
});