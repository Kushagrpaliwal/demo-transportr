import Cookies from "js-cookie";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  loginService,
  SocialLoginService,
} from "../api/services/AuthService/auth";
import { saveFcmTokenService } from "../api/services/NotificationsService/Notifications";
import { usePopup } from "../context/PopupContext";
import { requestFcmToken } from "../utils/fcm";

import { signInWithPopup, OAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { forgotPasswordService, verifyotpService, resetpasswordService } from "../api/services/ProfileService/profileServices";

const provider = new OAuthProvider("apple.com");
provider.addScope("email");
provider.addScope("name");

const decodeTokenPayload = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, Seterror] = useState("");
  const { showPopup } = usePopup();

  const getUserIdFromResponse = (res, fallbackProviderId = null) => {
    const data = res?.data || {};
    const token = data?.token;
    const payload = token ? decodeTokenPayload(token) : {};

    return (
      data?.userId ||
      data?.user_id ||
      data?.id ||
      data?.data?.id ||
      data?.user?.id ||
      payload?.userId ||
      payload?.id ||
      payload?.sub ||
      fallbackProviderId
    );
  };

  useEffect(() => {
    setTimeout(() => {
      Seterror("");
    }, 2000);
  }, [error]);

  const saveFcmTokenForUser = async (userId) => {
    if (!userId) return;

    try {
      const fcmToken = await requestFcmToken();
      if (!fcmToken) return;

      await saveFcmTokenService({
        userId,
        token: fcmToken,
        platform: "web",
      });
    } catch (error) {
      console.error("Failed to save FCM token:", error);
    }
  };

  async function appleLogin() {
    try {
      setLoading(true);

      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      const credential = OAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken;

      const socialLoginData = {
        provider: "apple",
        provider_id: user.uid,
        email: user.email,
        name: user.displayName,
        token: idToken,
      };

      const response = await SocialLoginService(socialLoginData);

      if (response.status === 200) {
        showPopup("Apple login successful!", "success", 2000);

        if (response?.data?.token) {
          Cookies.set("token", response?.data?.token, {
            expires: 7,
            secure: true,
            sameSite: "Strict",
          });

          const userId = getUserIdFromResponse(response, user.uid);
          await saveFcmTokenForUser(userId);
          navigate("/dashboard");
        }
      } else {
        throw new Error("Apple login failed");
      }
    } catch (err) {
      console.error(err);
      Seterror(err.message);
      // showPopup("Apple login failed", "error");
    } finally {
      setLoading(false);
    }
  }

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetForm, setResetForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let interval;
    if (showOtpModal && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, timer]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    // Take only the last character if multiple are pasted
    const digit = value.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleScriptLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const decodeJwtResponse = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      throw new Error("Invalid token format");
    }
  };

  const handleGoogleCallback = useCallback(
    async (response) => {
      setLoading(true);

      try {
        const payload = decodeJwtResponse(response.credential);

        const socialLoginData = {
          provider: "google",
          provider_id: payload.sub,
          email: payload.email,
          name: payload.name,
          photo_url: payload.picture,
        };

        const socialLoginResponse = await SocialLoginService(socialLoginData);

        if (socialLoginResponse.status === 200) {
          showPopup("Google login successful!", "success", 2000);
          if (socialLoginResponse?.data?.token) {
            Cookies.set("token", socialLoginResponse?.data?.token, {
              expires: 7,
              secure: true,
              sameSite: "Strict",
            });
            const userId = getUserIdFromResponse(
              socialLoginResponse,
              payload.sub,
            );
            await saveFcmTokenForUser(userId);
            navigate("/dashboard");
          }
        } else {
          throw new Error(
            socialLoginResponse?.data?.message || "Google login failed",
          );
        }
      } catch (err) {
        let errorMessage = "An unexpected error occurred. Please try again.";

        if (err.response) {
          errorMessage =
            err.response.data.message ||
            "Google login failed. Please try again.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        // showPopup(errorMessage, "error");
        Seterror(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [navigate, showPopup],
  );

  useEffect(() => {
    if (googleScriptLoaded && window.google && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (error) {
        console.error("Error initializing Google Sign-In:", error);
      }
    }
  }, [googleScriptLoaded, GOOGLE_CLIENT_ID, handleGoogleCallback]);

  const handleGoogleSignIn = () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.prompt();
    } else {
      showPopup("Google Sign-In is still loading. Please try again.", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginService(formData);

      if (response.status === 200) {
        if (response?.data?.token) {
          Cookies.set("token", response?.data?.token, {
            expires: 7,
            secure: true,
            sameSite: "Strict",
          });
          const userId = getUserIdFromResponse(response);
          await saveFcmTokenForUser(userId);
          navigate("/dashboard");
          showPopup("Login successful!", "success", 2000);
          setFormData({
            email: "",
            password: "",
          });
        }
      }
    } catch (err) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (err.response) {
        errorMessage =
          err.response.data.message ||
          "Login failed. Please check your credentials.";
      } else if (err.request) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      // showPopup(errorMessage, "error");
      Seterror(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E6F0FF] relative">
      <div
        className="hidden lg:block absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/bg-create.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></div>
      <div className="hidden xl:flex w-1/2"></div>
      <div className="flex w-full justify-center xl:w-1/2 items-center z-10">
        <div className="bg-white rounded-[18px] shadow-lg p-8 md:p-12 lg:p-6 w-full max-w-[600px] mx-4">
          <div className="flex flex-col items-center mb-2">
            <Link to={"/"}>
              <img
                src="/logo.svg"
                alt="Transportr Logo"
                className="h-[25px] mb-3 lg:w-[286px]"
              />
            </Link>
            {location.state?.flag ? (
              <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2 text-center">
                Welcome!
              </h2>
            ) : (
              <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2 text-center">
                Welcome Back!
              </h2>
            )}
            <p className="text-[#5F6C85] text-center text-sm md:text-lg">
              Enter your credentials to access your account.
            </p>
          </div>
          <form className="flex flex-col gap-3 mb-2" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="peer w-full bg-[#E6F0FF] rounded-[10px] px-4 pt-6 pb-2 text-[#666666] text-base outline-none focus:ring-2 focus:ring-[#4681F4]"
                placeholder=" "
              />
              <label
                htmlFor="email"
                className="absolute left-4 top-2 text-black text-[10px] pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-[#666666] peer-focus:top-2 peer-focus:text-[8px] peer-focus:text-black"
              >
                Email
              </label>
            </div>

            <div className="flex flex-col">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="peer no-password-reveal w-full bg-[#E6F0FF] rounded-[10px] pl-4 pr-12 pt-6 pb-2 text-[#666666] text-base outline-none focus:ring-2 focus:ring-[#4681F4]"
                  placeholder=" "
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 top-2 text-[#5F6C85] text-[10px] pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-[#666666] peer-focus:top-2 peer-focus:text-[8px] peer-focus:text-black"
                >
                  Password
                </label>
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  <div>
                    {showPassword ? (
                      <svg
                        width="22"
                        height="22"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M1.5 12C3.5 7 7.5 4 12 4C16.5 4 20.5 7 22.5 12C20.5 17 16.5 20 12 20C7.5 20 3.5 17 1.5 12Z"
                          stroke="black"
                          strokeWidth="2"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3.5"
                          stroke="black"
                          strokeWidth="2"
                        />
                      </svg>
                    ) : (
                      <img src="/hide.svg" className="w-6 h-6" alt="hide" />
                    )}
                  </div>
                </span>
              </div>
              <div className="flex flex-row justify-between items-center ">
                <div className="flex items-center gap-1 mt-2 text-base italic">
                  <input type="checkbox" className="w-4 h-4" />
                  Remember me
                </div>
                <div
                  className="text-[#4681F4] cursor-pointer hover:underline"
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot password
                </div>
              </div>
              <div className="mt-2 text-red-400">{error}</div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#4681F4] w-full py-3 mt-6 mb-2 text-white flex justify-center items-center rounded-[25px] font-bold text-xl hover:bg-[white] hover:text-[#4681F4] border-1 border-[#4681F4] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging In..." : "Log In"}
            </button>
          </form>

          <div className="flex items-center my-4">
            <hr className="flex-1 border-gray-200" />
            <span className="text-[#5F6C85] text-sm">OR</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          <div className="flex flex-col gap-4 mb-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={!googleScriptLoaded}
              className="group flex items-center gap-2 h-10  bg-[#E6F0FF] text-sm md:text-base text-black font-medium rounded-[25px] w-full justify-center transition-all cursor-pointer hover:bg-[#4681F4] hover:text-[18px] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src="/Google.svg"
                alt="Google"
                className="w-6 h-6 block group-hover:hidden"
              />
              <img
                src="/Google-white.svg"
                alt="Google"
                className="w-6 h-6 hidden group-hover:block"
              />
              Continue with Google
            </button>

            <button
              onClick={appleLogin}
              className="group flex items-center gap-2 h-10  bg-[#E6F0FF] text-sm md:text-base text-black font-medium rounded-[25px] w-full justify-center transition-all cursor-pointer hover:bg-[#4681F4] hover:text-[18px] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src="/app-store.svg"
                alt="Apple"
                className="w-6 h-6 block group-hover:hidden"
              />
              <img
                src="/Apple-white.svg"
                alt="Apple"
                className="w-7 h-7 hidden group-hover:block"
              />
              Continue with Apple
            </button>
          </div>

          <div className="text-center mt-8 text-black text-[14px] md:text-lg">
            Don't have an account?{" "}
            <Link
              to="/sign-up"
              className="text-[#4681F4] font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-[420px] p-8 mx-4 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-[26px] font-bold text-gray-900 mb-3">
              Forgot Password
            </h3>
            <p className="text-[#5F6C85] text-[15px] mb-6 leading-relaxed pr-2">
              Please enter your email account to send the OTP verification to
              reset your password
            </p>

            <input
              type="email"
              placeholder="Email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full bg-[#E6F0FF] rounded-xl px-5 py-4 mb-6 text-gray-700 placeholder:text-gray-400 placeholder:italic outline-none focus:ring-2 focus:ring-[#4681F4] transition-all"
            />

            <button
              disabled={modalLoading || !forgotEmail}
              onClick={async () => {
                try {
                  setModalLoading(true);
                  const res = await forgotPasswordService({ email: forgotEmail });
                  if (res.status === 200 || res.status === 201) {
                    setShowForgotModal(false);
                    setShowOtpModal(true);
                    setTimer(60);
                    showPopup(res?.data?.message || "OTP sent to your email", "success");
                  }
                } catch (err) {
                  showPopup(err?.response?.data?.message || "Failed to send OTP", "error");
                } finally {
                  setModalLoading(false);
                }
              }}
              className="w-full bg-[#4681F4] text-white font-semibold py-3.5 rounded-[25px] hover:bg-blue-600 transition-colors text-[17px] disabled:opacity-50"
            >
              {modalLoading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-[420px] p-8 mx-4 relative">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-[26px] font-bold text-gray-900 mb-3">
              OTP Verification
            </h3>
            <p className="text-[#5F6C85] text-[15px] mb-8 leading-relaxed pr-2">
              A 6 Digits email OTP was Sent to
              <br />
              <span className="text-gray-700 font-medium">
                {forgotEmail || "your email address"}
              </span>
            </p>

            <div className="flex justify-between gap-2 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 bg-[#E6F0FF] rounded-xl text-center text-xl font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#4681F4] transition-all"
                />
              ))}
            </div>

            <button
              disabled={modalLoading || otp.join("").length < 6}
              onClick={async () => {
                try {
                  setModalLoading(true);
                  const res = await verifyotpService({ email: forgotEmail, otp: otp.join("") });
                  if (res.status === 200 || res.status === 201) {
                    setShowOtpModal(false);
                    setShowResetModal(true);
                    showPopup(res?.data?.message || "OTP verified successfully", "success");
                  }
                } catch (err) {
                  showPopup(err?.response?.data?.message || "Invalid OTP", "error");
                } finally {
                  setModalLoading(false);
                }
              }}
              className="w-full bg-[#4681F4] text-white font-semibold py-4 rounded-[25px] hover:bg-blue-600 transition-colors text-[17px] mb-6 disabled:opacity-50"
            >
              {modalLoading ? "Verifying..." : "Verify Otp"}
            </button>

            <div className="text-center">
              <span className="text-[#5F6C85] text-sm">
                Resend OTP in {formatTime(timer)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-[420px] p-8 mx-4 relative">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-[26px] font-bold text-gray-900 mb-3">
              Reset Password
            </h3>
            <p className="text-[#5F6C85] text-[15px] mb-6 leading-relaxed">
              Please enter your new password
            </p>

            <div className="relative mb-4">
              <input
                type={showResetPassword ? "text" : "password"}
                placeholder="Password"
                value={resetForm.password}
                onChange={(e) =>
                  setResetForm({ ...resetForm, password: e.target.value })
                }
                className="w-full bg-[#E6F0FF] rounded-xl px-5 py-4 text-gray-700 placeholder:text-gray-400 placeholder:italic outline-none focus:ring-2 focus:ring-[#4681F4] transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showResetPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative mb-8">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={resetForm.confirmPassword}
                onChange={(e) =>
                  setResetForm({
                    ...resetForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full bg-[#E6F0FF] rounded-xl px-5 py-4 text-gray-700 placeholder:text-gray-400 placeholder:italic outline-none focus:ring-2 focus:ring-[#4681F4] transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <button
              disabled={modalLoading || !resetForm.password || resetForm.password !== resetForm.confirmPassword}
              onClick={async () => {
                if (resetForm.password !== resetForm.confirmPassword) {
                  showPopup("Passwords do not match", "error");
                  return;
                }
                try {
                  setModalLoading(true);
                  const res = await resetpasswordService({ email: forgotEmail, otp: otp.join(""), password: resetForm.password });
                  if (res.status === 200 || res.status === 201) {
                    setShowResetModal(false);
                    showPopup(res?.data?.message || "Password reset successfully", "success");
                    setForgotEmail("");
                    setOtp(["", "", "", "", "", ""]);
                    setResetForm({ password: "", confirmPassword: "" });
                  }
                } catch (err) {
                  showPopup(err?.response?.data?.message || "Failed to reset password", "error");
                } finally {
                  setModalLoading(false);
                }
              }}
              className="w-full bg-[#4681F4] text-white font-semibold py-4 rounded-[25px] hover:bg-blue-600 transition-colors text-[17px] disabled:opacity-50"
            >
              {modalLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
