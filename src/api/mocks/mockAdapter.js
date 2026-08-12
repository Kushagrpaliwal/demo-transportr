import MockAdapter from "axios-mock-adapter";
import { mockUser, mockShipments, mockNotifications } from "./mockData";

export const initializeMockAdapter = (axiosInstance) => {
  console.log("🛠️ Mock API is ENABLED. Intercepting requests...");
  const mock = new MockAdapter(axiosInstance, { delayResponse: 500 });

  // AUTH
  mock.onPost("/user/login").reply(200, {
    token: "mock_jwt_token_12345",
    user: mockUser
  });
  mock.onPost("/user/register").reply(200, { success: true, user: mockUser });
  mock.onPost("/user/social-login").reply(200, { token: "mock_jwt_token_12345", user: mockUser });
  mock.onPost("/user/logout").reply(200, { success: true });

  // PROFILE
  mock.onGet("/user/profile").reply(200, { data: mockUser });
  mock.onPut("/user/update-profile").reply(200, { success: true, data: mockUser });
  mock.onPost("/user/upload-identity-document").reply(200, { success: true });
  mock.onPost("/user/upload-address-document").reply(200, { success: true });
  mock.onPost("/user/verify").reply(200, { success: true });
  
  // DASHBOARD & SHIPMENTS
  mock.onGet("/shipments").reply(200, { data: mockShipments });
  mock.onGet(/\/shipments\/.+/).reply(200, { data: mockShipments[0] });
  mock.onPost("/shipments").reply(200, { success: true, data: mockShipments[0] });

  // NOTIFICATIONS
  mock.onGet("/notifications").reply(200, { data: mockNotifications });

  // FALLBACK (Catch-all for any other requests)
  mock.onAny().reply((config) => {
    console.warn(`⚠️ Unmocked API call intercepted: ${config.method.toUpperCase()} ${config.url}`);
    // Return a generic success to prevent the app from crashing
    return [200, { success: true, message: "Generic mock success", data: [] }];
  });

  return mock;
};
