import API from "../..";

export const loginService = async (credentials) => {
  return API.post("/user/login", credentials);
};

export const SocialLoginService = async (credentials) => {
  return API.post("/user/social-login", credentials);
};

export const registerService = async (userData) => {
  return API.post("/user/register", userData);
};

export const changePasswordService = async (userData) => {
  return API.post("/user/change-password", userData);
};

export const logoutService = async () => {
  return API.post("/user/logout");
};
