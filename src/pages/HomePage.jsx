import { useState, useEffect } from "react";
import AIPowered from "../components/Homepage/AIPowered";
import Banner from "../components/Homepage/Banner";
import DownloadApp from "../components/Homepage/DownloadApp";
import GetStarted from "../components/Homepage/GetStarted";
import Testimonial from "../components/Homepage/Testimonial";
import Whychoose from "../components/Homepage/Whychoose";
import { commonCmsService } from "../api/services/CMSService/CmsService";
import { getProFeaturesService } from "../api/services/proFeaturesService/proFeatures";
import { usePopup } from "../context/PopupContext";

const Homepage = () => {
  const [cmsData, setCmsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showPopup } = usePopup();
  const [proFeatures, SetproFeatures] = useState();

  useEffect(() => {
    fetchHomePageData();
    fetchproFeatures();
  }, []);

  const fetchproFeatures = async () => {
    try {
      const res = await getProFeaturesService();
      SetproFeatures(res?.data?.data);
      console.log("hide", res?.data?.data);
    } catch (error) {
      console.error("There is Some error with fetching pro features");
    }
  };

  const fetchHomePageData = async () => {
    try {
      setLoading(true);
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

      showPopup(errorMessage, "error");
      console.error("Error fetching CMS data:", err);
    } finally {
      setLoading(false);
    }
  };

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
    <>
      <Banner cmsData={cmsData} />
      <Whychoose cmsData={cmsData} />
      <GetStarted cmsData={cmsData} />
      {proFeatures?.hide ? null : <AIPowered cmsData={cmsData} />}
      <Testimonial />
      <DownloadApp cmsData={cmsData} />
    </>
  );
};

export default Homepage;
