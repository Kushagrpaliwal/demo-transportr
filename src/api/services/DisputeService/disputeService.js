import API from "../..";

export const getDisputeService = async () => {
    return API.get("/dispute/list");
}

export const getDisputeSingleService = async (id) => {
    return API.get(`/dispute/get/${id}`);
}


export const createFormalCaseService = async (userData) => {
    return API.post("/dispute/report", userData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export const getDisputeMessagesService = async (issue_id) => {
    return API.get(`/dispute/get-message/${issue_id}`)
}

export const sendDisputeMessagesService = async (issue_id, payload) => {
    return API.post(`/dispute/send-message/${issue_id}`, payload);
}

export const askTransportrToStepInService = async (issue_id, payload) => {
    return API.post(`/dispute/ask-transportr-to-step-in/${issue_id}`, payload);
}

export const getRefundOffersService = async (issue_id) => {
    return API.get(`/dispute/refund-offer/${issue_id}`);
}

export const createRefundOfferService = async (payload) => {
    return API.post(`/dispute/offer-refund`, payload);
}

export const acceptRefundOfferService = async (offer_id) => {
    return API.post(`/dispute/accept-refund/${offer_id}`);
}

export const rejectRefundOfferService = async (offer_id) => {
    return API.post(`/dispute/reject-refund/${offer_id}`);
}

export const closeDisputeService = async (issue_id) => {
    return API.post(`/dispute/close/${issue_id}`);
}

export const acceptResponsibilityService = async (issue_id) => {
    return API.post(`/dispute/accept-responsibility/${issue_id}`);
}

export const getInsuranceDetailsService = async (issue_id) => {
    return API.get(`/dispute/insurance-details/${issue_id}`);
}

export const downloadEvidenceService = async (issue_id) => {
    return API.get(`/dispute/download-evidence/${issue_id}`, {
        responseType: "blob",
    });
}