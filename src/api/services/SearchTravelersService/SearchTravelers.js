import API from "../..";

export const SearchTravelersService = async ({
    destination,
    date,
    page,
    limit,
} = {}) => {
    const params = {};
    if (destination) params.destination = destination;
    if (date) params.date = date;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return API.get("/travelers/search/v1", { params });
};

export const getTravelerProfileService = async (id) => {
    return API.get(`/user/traveler-profile/${id}`);
};
