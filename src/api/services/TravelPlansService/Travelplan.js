import API from "../..";

export const TravelPlansService = async () => {
    return API.get("/travelers");
};

export const TravelPlanCancelService = async (data) => {
    return API.post("/travelers/cancel-package", data);
};

export const TravelPlanDeleteService = async (id) => {
    return API.delete(`/travelers/${id}/delete`);
};

export const createNewTravelPlanService = async (data) =>{
    return API.post("/travelers/add",data);
}

export const viewTravelPlansService = async (id) => {
    return API.get(`/travelers/${id}`);
};

export const editTravelPlansService = async (id,data) => {
    return API.put(`/travelers/${id}/edit`,data);
};
