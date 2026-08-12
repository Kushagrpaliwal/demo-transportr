import API from "../..";

export const ShipmentHistoryService = async () => {
    return API.get("/dashboard/shipments/history");
};

export const RatingsService = async (data) => {
    return API.post("/ratings", data);
};

export const AllTravellerReviewsService = async (travelerId, limit, from_profile = false) => {
    const params = new URLSearchParams();
    if (from_profile) params.append("from_profile", "1");
    if (typeof limit === "number") params.append("limit", String(limit));
    const query = params.toString();
    return API.get(`/ratings/${travelerId}/all-reviews${query ? `?${query}` : ""}`);
};

export const ReplyToRatingService = async (reviewId, data) => {
    return API.post(`/ratings/${reviewId}/reply`, data);
};

export const ShipmentsService = async (data) => {
    return API.get(`/shipments/${data}`);
};