import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  registerService,
  SocialLoginService,
} from "../api/services/AuthService/auth";
import { usePopup } from "../context/PopupContext";
import Cookies from "js-cookie";

const SignUp = () => {
  const navigate = useNavigate();
  const { showPopup } = usePopup();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    referral_source: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // console.log("Google script loaded successfully");
      setGoogleScriptLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Google script");
      showPopup(
        "Failed to load Google Sign-In. Please refresh the page.",
        "error",
      );
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (googleScriptLoaded && window.google && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: "popup",
        });

        // console.log("Google Sign-In initialized successfully");
      } catch (error) {
        console.error("Error initializing Google Sign-In:", error);
      }
    }
  }, [googleScriptLoaded, GOOGLE_CLIENT_ID]);

  const handleGoogleCallback = async (response) => {
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
        showPopup("Google sign up successful!", "success", 2000);
        if (socialLoginResponse?.data?.token) {
          Cookies.set("token", socialLoginResponse?.data?.token, {
            expires: 7,
            secure: true,
            sameSite: "Strict",
          });
          navigate("/dashboard");
        }
      } else {
        throw new Error(
          socialLoginResponse?.data?.message || "Google sign up failed",
        );
      }
    } catch (err) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (err.response) {
        errorMessage =
          err.response.data.message ||
          "Google sign up failed. Please try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      showPopup(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

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

  const handleGoogleSignIn = () => {
    if (window.google && window.google.accounts) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            // console.log(
            //   "Prompt not displayed:",
            //   notification.getNotDisplayedReason(),
            // );
            showPopup(
              "Google Sign-In prompt couldn't be displayed. Please try again.",
              "error",
            );
          }
        });
      } catch (error) {
        console.error("Error showing Google prompt:", error);
        showPopup("Failed to show Google Sign-In. Please try again.", "error");
      }
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

    const confirmPassword = document.getElementById("confirmPassword").value;
    if (formData.password !== confirmPassword) {
      showPopup("Passwords do not match", "error");
      setLoading(false);
      return;
    }

    try {
      const response = await registerService(formData);

      if (response.status === 200 || response.status === 201) {
        showPopup("Account created successfully!", "success");
        navigate("/login", {
          state: {
            flag: true
          }
        });
        setFormData({
          username: "",
          email: "",
          password: "",
          referral_source: "",
        });

        document.getElementById("confirmPassword").value = "";
      }
    } catch (err) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (err.response) {
        errorMessage =
          err.response.data.message || "Registration failed. Please try again.";
      } else if (err.request) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      showPopup(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E6F0FF] relative overflow-hidden py-10">
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
                className="h-[25px] cursor-pointer mb-3 lg:w-[286px]"
              />
            </Link>
            <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2 text-center">
              Create Your Account
            </h2>
            <p className="text-[#5F6C85] text-center text-sm md:text-lg mb-2">
              Join Transportr and start sending or carrying packages.
            </p>
          </div>

          <form className="flex flex-col gap-3 mb-2" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="relative">
              <label htmlFor="username" className="text-lg font-normal">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="customInputCSS"
                placeholder="JohnnyD"
              />
              <p className="block text-xs text-black mt-1 ml-1">
                This will be displayed on your public profile.
              </p>
            </div>
            {/* Email */}
            <div className="relative">
              <label htmlFor="email" className="text-lg font-normal">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="customInputCSS"
                placeholder="John123@gmail.com"
              />
            </div>
            {/* Password */}
            <div className="relative">
              <label htmlFor="password" className="text-lg font-normal">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="customInputCSS"
                placeholder="Password"
              />

              <span
                className="absolute right-3 top-2/3  -translate-y-1/2 cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Toggle password visibility"
              >
                <div>
                  {showPassword ? (
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
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
            {/* Confirm Password */}
            <div className="relative">
              <label htmlFor="confirmPassword" className="text-lg font-normal">
                Confirm Password
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                required
                className="customInputCSS"
                placeholder="Confirm Password"
              />

              <span
                className="absolute right-3 top-2/3 -translate-y-1/2 cursor-pointer"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label="Toggle confirm password visibility"
              >
                <div>
                  {showConfirmPassword ? (
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
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

            {/* How did you find us? */}
            <div className="relative">
              <label htmlFor="referral_source" className="text-lg font-normal">
                How did you find us?
              </label>
              <select
                id="referral_source"
                name="referral_source"
                required
                value={formData.referral_source}
                onChange={handleInputChange}
                className="customInputCSS placeholder:!italic italic"
                style={{
                  paddingRight: 40,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option
                  value=""
                  disabled
                  className="placeholder:!italic italic"
                >
                  Select an option
                </option>
                <option value="search_engine">Search engine</option>
                <option value="social_media">Social media</option>
                <option value="friend">Friend / Referral</option>
                <option value="advertisement">Advertisement</option>
                <option value="other">Other</option>
              </select>
              <span
                className="absolute -translate-y-1/2 pointer-events-none"
                style={{ right: "16px", bottom: "17px" }}
                aria-hidden="true"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="#666666"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#4681F4] w-full my-2 h-[50px] text-white flex justify-center items-center rounded-[25px] font-bold text-xl hover:bg-[white] hover:text-[#4681F4] border-1 border-[#4681F4] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create An Account"}
            </button>
          </form>

          <div className="flex items-center my-4">
            <hr className="flex-1 border-gray-200" />
            <span className="text-[#5F6C85] text-sm px-4">OR</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={!googleScriptLoaded || loading}
              className="group flex items-center gap-2 h-10 bg-[#E6F0FF] text-sm md:text-base text-black font-medium rounded-[25px] w-full justify-center transition-all cursor-pointer hover:bg-[#4681F4] hover:text-[18px] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src="./Google.svg"
                alt="Google"
                className="w-6 h-6 block group-hover:hidden"
              />
              <img
                src="./Google-white.svg"
                alt="Google"
                className="w-6 h-6 hidden group-hover:block"
              />
              Continue with Google
            </button>

            {/* Apple Sign In Button */}
            <button
              disabled={loading}
              className="group flex items-center gap-2 h-10 bg-[#E6F0FF] text-sm md:text-base text-black font-medium rounded-[25px] w-full justify-center transition-all cursor-pointer hover:bg-[#4681F4] hover:text-[18px] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src="./app-store.svg"
                alt="Apple"
                className="w-6 h-6 block group-hover:hidden"
              />
              <img
                src="./Apple-white.svg"
                alt="Apple"
                className="w-7 h-7 hidden group-hover:block"
              />
              Continue with Apple
            </button>
          </div>

          <p className="text-lg md:text-base text-black text-center mt-4">
            By continuing, you agree to Transportr's <br />
            <Link
              to="/terms-condition"
              className="text-[#4681F4] font-semibold hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy-policy"
              className="text-[#4681F4] font-semibold hover:underline"
            >
              Privacy Policy
            </Link>
          </p>

          <div className="text-center mt-6 text-black text-[14px] md:text-lg">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#4681F4] font-semibold hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
