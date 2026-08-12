import API from "../..";

export const getProFeaturesService = async () => {
    return API.get("/pro-features");
};
