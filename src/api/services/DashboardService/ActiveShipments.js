import API from "../..";

export const shipmentsActiveService = async () => {
    return API.get("/dashboard/shipments/active");
};
