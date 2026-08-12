import API from "../..";

export const SendRequestsService = async () => {
    return API.get("/package/my-packages");
};

export const createSendPackageService = async (payload) => {
    return API.post("/package/send-package", payload, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
};

export const getSingleSendRequestsService = async (id) => {
    return API.get(`/package/${id}`);
};

export const editSendPackageService = async (payload,id) => {
    return API.put(`package/${id}/update`, payload, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
};

export const deleteSendPackageService = async (id) => {
    return API.delete(`/package/${id}/delete`);
};

export const PackageQuoteService = async (payload) => {
    return API.post("/package/quote", payload);
};

export const packageFeeStatusService = async (type) => {
    return API.get(`/fee/${type}`);
};

export const packageUserListService = async () => {
    return API.get(`/user/users-list?searchName`);
};

export const searchUsersService = async (username) => {
    return API.get("/user/search-users", {
        params: { username },
    });
};

