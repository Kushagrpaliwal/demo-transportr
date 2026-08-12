import API from "../..";

export const ReviewService = async () => {
  return API.get("/cms/reviews");
};