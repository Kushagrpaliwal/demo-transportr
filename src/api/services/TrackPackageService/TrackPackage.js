import API from "../..";

export const TrackPackageService = async (packageId) => {
    return API.get(`/package/${packageId}`);
};

export const ShipmentsTrackService = async (trackingNumber) => {
    return API.post(`/shipments/track`, { trackingNumber });
};

export const ConfirmPickupService = async (trackingNumberOrPayload) => {
    const tracking_number =
        typeof trackingNumberOrPayload === "string"
            ? trackingNumberOrPayload
            : trackingNumberOrPayload?.tracking_number;

    return API.post(`/package/confirm-pickup`, { tracking_number });
};

export const ConfirmDeliveryCodeService = async (payload) => {
    return API.post(`/package/confirm-delivery-code`, payload);
};

export const PackagesInTransitService = async () => {
    return API.get('/package/in-transit/status');
};


