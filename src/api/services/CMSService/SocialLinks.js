import API from "../..";

export const SocialLinksService = async () => {
  return API.get("/cms/social-links");
};
