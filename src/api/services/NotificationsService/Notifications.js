import API from "../..";

export const notificationsService = async () => {
    return API.get("/notifications")
}

export const saveFcmTokenService = async (payload) => {
    return API.post("/user/save-fcm-token", payload);
};

export const readAllNotificationsService = async () => {
    return API.post("/notifications/read-all");
};