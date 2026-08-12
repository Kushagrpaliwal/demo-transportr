import React from "react";
import { Link } from "react-router-dom";
import { commonCmsService } from "../../api/services/CMSService/CmsService";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { SocialLinksService } from "../../api/services/CMSService/SocialLinks";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const token = Cookies.get("token");
  const [cmsData, setCmsData] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    fetchHomePageData();
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const response = await SocialLinksService();
      if (response.status === 200) {
        setSocialLinks(response?.data?.data || []);
      }
    } catch (err) {
      console.error("Error fetching social links:", err);
    }
  };

  const fetchHomePageData = async () => {
    try {
      const response = await commonCmsService("home");

      if (response.status === 200) {
        setCmsData(response?.data?.data);
        // console.log("CMS Data fetched successfully:", response.data);
      } else {
        throw new Error(
          response.data?.message || "Failed to fetch homepage data",
        );
      }
    } catch (err) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (err.response) {
        errorMessage =
          err.response.data.message || "Failed to load homepage content.";
      } else if (err.request) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      console.error("Error fetching CMS data:", err);
    } finally {
      //
    }
  };

  return (
    <footer className="w-full bg-[#4681F4] ">
      <div className="text-white containersec ">
        <div className="mx-auto flex flex-col py-8 md:flex-row justify-between items-center text-center md:text-left md:items-start gap-8">
          <div className="flex flex-col items-start gap-2 lg:w-[440px] xl:w-[510px]">
            <div className="">
              <Link to={"/"}>
                <img
                  src={cmsData[14]?.image || "/footer-logo.svg"}
                  alt="Transportr Logo"
                  className="h-[64px] w-[330px] mb-2"
                />
              </Link>
            </div>
            <span className="lg:text-xl text-base font-normal">
              {cmsData[14]?.subtitle ||
                " Connecting Journeys, Delivering Packages"}
            </span>
          </div>

          {/* Center: Navigation */}
          <div className="flex flex-col items-start flex-1">
            <ul className="space-y-2">
              <li>
                <a href="/" className="hover:underline">
                  Home
                </a>
              </li>
              <li>
                <a href="/about-us" className="hover:underline">
                  About Us
                </a>
              </li>
              {token && (
                <>
                  <li>
                    <Link
                      to="/dashboard/my-travels"
                      className="hover:underline"
                    >
                      Travels
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard/send-package"
                      className="hover:underline"
                    >
                      Packages
                    </Link>
                  </li>
                </>
              )}
              <li>
                <a href="/contact-us" className="hover:underline">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/terms-condition" className="hover:underline">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="hover:underline">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-row gap-4 flex-1">
            <div className="flex-col flex gap-3">
              <span className="font-semibold mb-2 block">Follow Us</span>
              <div className="flex flex-col gap-3 items-start">
                {socialLinks
                  .filter((link) => Number(link.downloadLink) === 0)
                  .map((link) => (
                    <a
                      key={link.id}
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-2 items-center group"
                    >
                      <div className="w-9 h-9 flex items-center cursor-pointer bg-white rounded-full justify-center overflow-hidden">
                        <img
                          src={link.icon}
                          alt={link.label}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                      <p className="text-lg text-white group-hover:underline cursor-pointer">
                        {link.label}
                      </p>
                    </a>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex-col flex gap-3">
            <span className="font-semibold mb-2 block">Download the App</span>
            <div className="flex gap-2 flex-col items-center">
              {socialLinks
                .filter((link) => Number(link.downloadLink) === 1)
                .map((link) => (
                  <a
                    key={link.id}
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-black h-[50px] cursor-pointer hover:bg-[#E6F0FF] transition-all rounded-[30px] w-[160px] px-3 py-2 flex justify-center items-center gap-2 shadow hover:opacity-90"
                  >
                    <img
                      src={link.icon}
                      alt={link.label}
                      className="h-6 object-contain"
                    />
                    <div className="flex flex-col items-start flex-1 overflow-hidden">
                      <p className="text-[11px] leading-tight truncate w-full text-left">
                        {link.name.toLowerCase().includes("app")
                          ? "Download on the"
                          : "Get it on"}
                      </p>
                      <p className="text-sm font-semibold leading-tight truncate w-full text-left">
                        {link.label}
                      </p>
                    </div>
                  </a>
                ))}
            </div>
          </div>
        </div>

        <div className="w-full items-center flex-col md:flex-row text-center flex justify-between pt-0 md:pt-5 py-5">
          <p className="text-base">
            Copyright © {currentYear} Transportr. All Rights Reserved.
          </p>
          <p className="text-base">
            Website By:{" "}
            <a
              className="hover:underline cursor-pointer"
              href="https://sdssoftwares.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
            >
              sdssoftwares.co.uk
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
