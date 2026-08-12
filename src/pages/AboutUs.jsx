import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { commonCmsService } from "../api/services/CMSService/CmsService";
import { usePopup } from "../context/PopupContext";

const AboutUs = () => {
  const navigate = useNavigate();
  const token = Cookies.get("token");
  const [cmsData, setCmsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showPopup } = usePopup();

  const parseHtmlContent = (htmlContent) => {
    if (!htmlContent) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const listItems = doc.querySelectorAll("li");

    return Array.from(listItems).map((li) => {
      const strongTag = li.querySelector("strong");
      let strongText = "";
      let remainingText = "";

      if (strongTag) {
        strongText = strongTag.textContent || "";

        const tempDiv = document.createElement("div");
        tempDiv.appendChild(strongTag.cloneNode(true));
        const strongContent = tempDiv.innerHTML;

        const fullHtml = li.innerHTML;
        const remainingHtml = fullHtml.replace(strongContent, "");

        const remainingDiv = document.createElement("div");
        remainingDiv.innerHTML = remainingHtml;
        remainingText = remainingDiv.textContent || "";
      } else {
        remainingText = li.textContent || "";
      }

      remainingText = remainingText.replace(/&nbsp;/g, " ").trim();

      return {
        strong: strongText.replace(/:/g, "").trim(),
        text: remainingText,
      };
    });
  };

  const fetchAboutUsData = async () => {
    try {
      setLoading(true);
      const response = await commonCmsService("about-us");

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
    fetchAboutUsData();
  }, []);

  const differentiators = parseHtmlContent(cmsData[4]?.content);

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

        <div className="w-full flex flex-col-reverse md:flex-row text-center md:text-left items-end justify-between py-10 mt-[100px] md:mt-0 lg:mt-[40px]">
          <div className="w-full flex flex-col gap-4 md:w-1/2 mt-10 md:mt-0">
            <h3 className="text-2xl md:text-[32px] font-bold text-black">
              {cmsData[0]?.title || "Our Story"}
            </h3>

            <div
              className="text-black text-base md:text-xl"
              dangerouslySetInnerHTML={{ __html: cmsData[0]?.content }}
            ></div>
            <p className="text-black text-base md:text-xl">
              {cmsData[0]?.subtitle}
            </p>
            <p className="text-black text-base md:text-xl">
              {cmsData[1]?.content}
            </p>
          </div>
          <div className="w-full flex items-center relative justify-center md:w-1/2">
            <div className="w-[250px] h-[250px] md:w-[300px] md:h-[300px] lg:w-[300px] lg:h-[300px] rounded-full flex relative items-center justify-center bg-[#4681F4]">
              <div className="w-[150px] h-[150px] rounded-full bg-[#C7DAFF1A] absolute right-1"></div>
              <img
                src={cmsData[0]?.image || "./search-traveller.png"}
                alt="Transportr App"
                className="w-[327px] lg:w-[270px] h-auto lg:h-[400px] xl:h-auto top-[-45px] xl:top-[-55px] relative z-10"
              />
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4 text-center md:text-left">
          <h3 className="text-2xl md:text-[32px] font-bold text-black">
            {cmsData[2]?.title}
          </h3>
          <p className="text-black text-base md:text-xl">
            {cmsData[2]?.content}
          </p>

          <h3 className="text-2xl md:text-[32px] font-bold text-black">
            {cmsData[4]?.title}
          </h3>

          <ul className="mb-8 space-y-3 text-left">
            {differentiators.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-black text-sm"
              >
                <img
                  src="/star-list.svg"
                  alt="star"
                  className="w-5 h-5 mt-[3px]"
                />
                <p className="text-black text-base md:text-xl">
                  {item.strong && (
                    <span className="text-black text-base md:text-xl font-bold">
                      {item.strong}:{" "}
                    </span>
                  )}
                  {item.text}
                </p>
              </li>
            ))}
          </ul>

          <h3 className="text-2xl md:text-[32px] font-bold text-black">
            {cmsData[3]?.title}
          </h3>

          <p className="text-black text-base md:text-xl">
            {cmsData[3]?.content}
          </p>

          <p className="text-black text-base md:text-xl">
            {cmsData[3]?.subtitle}
          </p>

          <div className="w-full gap-3 justify-between sm:justify-start flex items-center">
            {!token && (
              <button
                onClick={() => {
                  navigate("/sign-up");
                }}
                className="bg-[#4681F4] w-[171px] h-[50px] text-white flex justify-center items-center rounded-[25px] font-bold text-base sm:text-lg hover:bg-[white] hover:text-[#4681F4] border-1 border-[#4681F4] cursor-pointer transition-all"
              >
                Sign Up Now
              </button>
            )}
            <button
              onClick={() => {
                navigate("/dashboard/search-travellers");
              }}
              className="border border-[#4681F4] flex justify-center items-center cursor-pointer h-[50px] w-[186px] text-[#4681F4] rounded-full font-bold text-base sm:text-xl hover:bg-[#4681F4] hover:text-white transition-all"
            >
              Find a Traveller
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
