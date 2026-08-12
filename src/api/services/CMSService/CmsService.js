import API from "../..";

export const commonCmsService = async (slug) => {
  return API.get(`/cms/page/${slug}`);
};