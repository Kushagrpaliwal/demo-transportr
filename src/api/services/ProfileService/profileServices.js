import API from "../..";

export const saveStep2IdentityProofService = async (userData) => {
  return API.post("/user/upload-identity-document", userData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const saveStep3AddressProofService = async (userData) => {
  return API.post("/user/upload-address-document", userData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const saveStep4ReviewService = async () => {
  return API.post("/user/verify");
};

export const getProfileDetailsService = async () => {
  return API.get("/user/profile");
};

export const saveProfileInformationService = async (userData) => {
  return API.put("/user/update-profile", userData);
};

export const updateProfileImageService = async (data) => {
  return API.post("/user/update-profile-image",data , {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const saveNotificationPreferencesService = async (preferences) => {
  return API.post("/user/notification-preferences", preferences);
};

export const forgotPasswordService = async (data) => {
  return API.post("/user/forgot-password", data);
};

export const verifyotpService = async (data) => {
  return API.post("/user/verify-otp", data);
};

export const resetpasswordService = async (data) => {
  return API.post("/user/reset-password", data);
};

