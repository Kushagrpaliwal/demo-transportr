import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "../firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestFcmToken = async () => {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swRegistration,
  });

  return token || null;
};

export const subscribeForegroundNotifications = async (onReceive) => {
  const messaging = await getFirebaseMessaging();
  const handleServiceWorkerMessage = (event) => {
    if (event?.data?.type !== "FCM_NOTIFICATION") return;
    onReceive?.(event.data.payload || {});
  };

  navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);

  if (!messaging) {
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
    };
  }

  const unsubscribeOnMessage = onMessage(messaging, (payload) => {
    onReceive?.(payload);
  });

  return () => {
    unsubscribeOnMessage?.();
    navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
  };
};