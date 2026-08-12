import API from "../..";

export const getListOfConversations = async () => {
  return API.get("/messages/conversations");
};

export const getConversationById = async (id) => {
  return API.get(`/messages/conversation?otherUserId=${id}`);
};

export const postMessage = async (payload) => {
  return API.post(`/messages/send`, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getMessageButton = async (id) => {
  return API.get(`/ratings/${id}/review-and-message`);
};