/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { commonCmsService } from "../api/services/CMSService/CmsService";
import { usePopup } from "../context/PopupContext";
import { createEnquiryService } from "../api/services/CMSService/enquiry";

const ContactUs = () => {
  const navigate = useNavigate();
  const [cmsData, setCmsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showPopup } = usePopup();

  const token = Cookies.get("token");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;

  useEffect(() => {
    if (!recaptchaSiteKey || window.grecaptcha) {
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [recaptchaSiteKey]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const executeRecaptchaV3 = async () => {
    if (!recaptchaSiteKey) {
      throw new Error("reCAPTCHA site key is not configured.");
    }

    if (!window.grecaptcha) {
      throw new Error("reCAPTCHA is not loaded yet.");
    }

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(recaptchaSiteKey, {
            action: "contact_us",
          });
          resolve(token);
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const recaptchaToken = await executeRecaptchaV3();

      const payload = {
        ...formData,
        captchaToken: recaptchaToken,
        recaptchaToken,
      };

      const response = await createEnquiryService(payload);
      alert(response?.data?.message || "Enquiry submitted successfully.");
      setFormData({
        full_name: "",
        email: "",
        phone_number: "",
        message: "",
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit enquiry.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchContactUsData = async () => {
    try {
      setLoading(true);
      const response = await commonCmsService("contact-us");

      if (response.status === 200) {
        setCmsData(response?.data?.data);
        // console.log("CMS Data fetched successfully:", response.data);
      } else {
        throw new Error(
          response.data?.message || "Failed to fetch about us data",
        );
      }
    } catch (err) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (err.response) {
        errorMessage =
          err.response.data.message || "Failed to load about us content.";
      } else if (err.request) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      showPopup(errorMessage, "error");
      console.error("Error fetching CMS data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactUsData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E6F0FF]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#4681F4] mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full bg-white overflow-hidden">
      <div className="containersec relative z-10 flex flex-col lg:pb-[60px] pb-7.5 px-4 sm:px-8 lg:px-16">
        <div className="w-full flex justify-between items-center mt-5">
          <div>
            <Link to={"/"}>
              <img
                src="./logo.svg"
                alt="Logo"
                className="w-[140px] sm:w-32 cursor-pointer md:w-[240px] h-[21px]"
              />
            </Link>
          </div>
          {!token && (
            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  navigate("/login");
                }}
                className="bg-[#4681F4] h-10 w-[70px] sm:w-[98px] sm:h-[50px] cursor-pointer text-white rounded-full font-bold text-base sm:text-lg hover:bg-white hover:text-[#4681F4] border border-[#4681F4] transition-all"
              >
                Login
              </button>
              <button
                onClick={() => {
                  navigate("/sign-up");
                }}
                className="border border-[#4681F4] cursor-pointer w-[90px] h-10 sm:w-[108px] sm:h-[50px] text-[#4681F4] rounded-full font-bold text-base sm:text-lg hover:bg-[#4681F4] hover:text-white transition-all"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col text-center items-center justify-center py-8 md:py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
            {cmsData[0]?.title || "Contact Us"}
          </h2>
          <p className="text-[#5F6C85] text-base md:text-lg max-w-2xl mx-auto">
            {cmsData[0]?.subtitle ||
              "We'd love to hear from you! Whether you have questions, feedback, or just want to say hello, feel free to reach out to us."}
          </p>

          <div className="w-full rounded-[20px] flex flex-col md:flex-row bg-[#E6F0FF] mt-5">
            <form
              onSubmit={handleSubmit}
              className="w-full md:w-1/2 lg:w-[60%] p-8 flex text-left flex-col gap-5"
            >
              <div>
                <label className="block text-black text-base md:text-lg font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full bg-white rounded-[12px] md:h-[50px] px-4 py-2 text-black text-base outline-none border border-[#D6D6D6]"
                />
              </div>
              <div>
                <label className="block text-black text-base md:text-lg font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-white rounded-[12px] md:h-[50px] px-4 py-2 text-black text-base outline-none border border-[#D6D6D6]"
                />
              </div>
              <div>
                <label className="block text-black text-base md:text-lg font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                  className="w-full bg-white rounded-[12px] md:h-[50px] px-4 py-2 text-black text-base outline-none border border-[#D6D6D6]"
                />
              </div>
              <div>
                <label className="block text-black text-base md:text-lg font-medium mb-1">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full bg-white rounded-[12px] px-4 py-2 text-black text-base outline-none border border-[#D6D6D6] resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#4681F4] w-full h-[50px] text-white flex justify-center items-center rounded-[25px] font-bold text-xl hover:bg-[white] hover:text-[#4681F4] border-1 border-[#4681F4] cursor-pointer transition-all"
              >
                {isSubmitting ? "Submitting..." : "Contact Us"}
              </button>
            </form>

            <div className="w-full md:w-1/2 lg:w-[40%] p-6 bg-[#4681F4] flex text-left lg:pl-10 flex-col justify-center gap-6 lg:gap-10 text-white rounded-bl-[12px] md:rounded-bl-[0px] md:rounded-tr-[12px] rounded-br-[12px]">
              <h3 className="text-xl md:text-3xl lg:text-[45px] font-semibold mb-2">
                Get in Touch
              </h3>
              <div className="flex items-center gap-3 md:gap-5  mb-2">
                <div className="w-10 h-10 lg:w-20 lg:h-20 bg-white rounded-full flex justify-center items-center">
                  <img
                    src={cmsData[1]?.image || "./contact-mail.svg"}
                    alt="mail"
                    className="w-6 h-6 lg:w-[38px] lg:h-[38px]"
                  />
                </div>
                <div>
                  <div className="text-base lg:text-xl mb-2 font-medium">
                    {cmsData[1]?.title || "Send Email"}
                  </div>
                  <Link
                    to={"mailto:info@transportr.co.uk"}
                    className="text-base lg:text-xl"
                  >
                    {cmsData[1]?.subtitle || "info@transportr.co.uk"}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-5 mb-2">
                <div className="w-10 h-10 lg:w-20 lg:h-20 bg-white rounded-full flex justify-center items-center">
                  <img
                    src={cmsData[2]?.image || "./contact-call.svg"}
                    alt="call"
                    className="w-6 h-6 lg:w-[38px] lg:h-[38px]"
                  />
                </div>
                <div>
                  <div className="text-base lg:text-xl mb-2 font-medium">
                    {cmsData[2]?.title || "Call Us"}
                  </div>
                  <Link
                    to={`tel:${cmsData?.subtitle || "0123 456 7890"}`}
                    className="text-base lg:text-xl"
                  >
                    {cmsData[2]?.subtitle || "0123 456 7890"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
