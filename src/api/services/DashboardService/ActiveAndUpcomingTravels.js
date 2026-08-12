import API from "../..";

export const ActiveAndUpcomingTravels = async () => {
    return API.get("/dashboard/travels/active")
}