import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const AIPowered = ({ cmsData }) => {
  const navigate = useNavigate();
  const token = Cookies.get("token");
  return (
    <section className="w-full">
      <div className="w-full bg-[#4681F4] py-16 px-4 flex flex-col items-center justify-center text-center">
        <span className=" text-[#05B71A] bg-[#BCFFC4] text-[10px] font-semibold px-3 py-1 rounded-[12.5px] mb-4 border-[0.4px] border-[#05B71A]">
          Pro Feature
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-[45px] font-bold text-white mb-4">
          {cmsData[10]?.title || "AI-Powered Tools"}
        </h2>
        <p className="text-white text-base md:text-lg lg:text-xl max-w-2xl">
          {cmsData[10]?.subtitle ||
            "Experience the future of shipping with our AI-powered tools that optimize routes, predict delivery times, and enhance your overall experience."}
        </p>
      </div>

      <div className="w-full bg-[#E6F0FF] py-16 px-4 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl md:text-4xl lg:text-[45px] font-bold text-black mb-4">
          {cmsData[11]?.title || "Ready to bridge the distance?"}
        </h2>
        <p className="text-black text-base md:text-lg lg:text-xl mb-8">
          {cmsData[11]?.subtitle ||
            "Join our growing community of senders and travellers today."}
        </p>
        <button
          onClick={() => {
            if (token) {
              navigate("/dashboard");
            } else {
              navigate("/sign-up");
            }
          }}
          className="bg-[#4681F4] w-[171px] h-[50px] text-white flex justify-center items-center rounded-[25px] font-bold text-xl hover:bg-[white] hover:text-[#4681F4] border-1 border-[#4681F4] cursor-pointer transition-all"
        >
          {token ? "Get Started" : "Sign Up Now"}
        </button>
      </div>
    </section>
  );
};

export default AIPowered;
