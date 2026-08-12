// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_APPLE_LOGIN_API_KEY,
    authDomain: import.meta.env.VITE_APPLE_LOGIN_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_APPLE_LOGIN_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APPLE_LOGIN_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

let authInstance = null;
try {
    authInstance = getAuth(app);
} catch (error) {
    console.error("Firebase Auth Error:", error);
}

export const auth = authInstance;

export const getFirebaseMessaging = async () => {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
};

/**
 * Logs route suggestion thumbs feedback (matches mobile analytics event name).
 * Only fires when feedback is set to "good" or "bad" (not when toggled off).
 */
export const logRouteSuggestionFeedback = async (shipmentId, feedback) => {
    if (typeof window === "undefined") return;

    try {
        const { getAnalytics, logEvent, isSupported } = await import("firebase/analytics");

        const supported = await isSupported();
        if (!supported) {
            console.warn("Analytics not supported");
            return;
        }

        const analytics = getAnalytics(app); // ✅ always fresh instance

        logEvent(analytics, "route_suggestion_feedback", {
            shipment_id: String(shipmentId),
            feedback,
        });

        console.log("✅ EVENT SENT:", shipmentId, feedback);

    } catch (e) {
        console.error("❌ Firebase Analytics error:", e);
    }
};