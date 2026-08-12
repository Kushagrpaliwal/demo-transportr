import API from "../..";

export const createEnquiryService = async (payload) => {
  return API.post("/cms/enquiry", payload);
};
