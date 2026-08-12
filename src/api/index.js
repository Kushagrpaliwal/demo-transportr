import axios from "axios";
import Cookies from "js-cookie";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// API.interceptors.request.use(
//   (config) => {
//     const token = Cookies.get("token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error),
// );

// Response Interceptor: Redirect on Unauthorized (401)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // if (error.response && error.response.status === 401) {
    //   Cookies.remove("token");
    //   if (window.location.pathname !== "/login") {
    //     window.location.href = "/login";
    //   }
    // }
    return Promise.reject(error);
  },
);

if (import.meta.env.VITE_USE_MOCK_API === "true") {
  import("./mocks/mockAdapter").then(({ initializeMockAdapter }) => {
    initializeMockAdapter(API);
  });
}

export default API;
