import React, { useState } from "react";

const Whychoose = ({ cmsData }) => {
  const [imageErrors, setImageErrors] = useState({});

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    return imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  };

  const defaultIcons = {
    0: "./rocket.svg",
    1: "./profile.svg",
    2: "./route-analysis.svg",
    3: "./secure.svg",
  };

  const features = [
    {
      id: 0,
      icon: getImageUrl(cmsData[3]?.image),
      title: cmsData[3]?.title || "Faster Deliveries",
      desc:
        cmsData[3]?.subtitle ||
        "Connect with travellers for quicker, more flexible shipping options.",
      defaultIcon: defaultIcons[0],
    },
    {
      id: 1,
      icon: getImageUrl(cmsData[4]?.image),
      title: cmsData[4]?.title || "Community Powered",
      desc:
        cmsData[4]?.subtitle ||
        "Leverage a network of trusted travellers heading your way.",
      defaultIcon: defaultIcons[1],
    },
    {
      id: 2,
      icon: getImageUrl(cmsData[5]?.image),
      title: cmsData[5]?.title || "Smart Matching",
      desc:
        cmsData[5]?.subtitle ||
        "AI-powered route analysis to connect senders and travellers efficiently.",
      defaultIcon: defaultIcons[2],
    },
    {
      id: 3,
      icon: getImageUrl(cmsData[6]?.image),
      title: cmsData[6]?.title || "Secure & Tracked",
      desc:
        cmsData[6]?.subtitle ||
        "In-app payments and real-time package tracking for peace of mind.",
      defaultIcon: defaultIcons[3],
    },
  ];

  const handleImageError = (featureId) => {
    if (!imageErrors[featureId]) {
      setImageErrors((prev) => ({ ...prev, [featureId]: true }));
    }
  };

  const getDisplayIcon = (feature) => {
    if (imageErrors[feature.id]) {
      return feature.defaultIcon;
    }
    return feature.icon || feature.defaultIcon;
  };

  return (
    <section className="w-full bg-[#E6F0FF]">
      <div className="w-full containersec flex justify-center items-center">
        <div className="w-full p-8 md:p-12 lg:px-1 flex flex-col items-center">
          <h2 className="text-3xl md:text-[45px] font-bold text-center text-black mb-4">
            {cmsData[2]?.title || "Why Choose Transportr?"}
          </h2>
          <p className="text-[#5F6C85] text-lg text-center sm:mb-10 mb-15 max-w-2xl">
            {cmsData[2]?.subtitle ||
              "Discover why thousands trust Transportr for their delivery needs"}
          </p>
          <div className="w-full lg:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-15 lg:gap-6">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="bg-white rounded-[20px] relative transition-all shadow-[0_6px_14px_0_#6666661A] hover:shadow-2xl p-6 py-7.5 flex flex-col items-center text-center"
              >
                <div className="bg-[#4681F4] absolute rounded-full w-20 h-20 flex items-center justify-center top-[-40px]">
                  <img
                    src={getDisplayIcon(feature)}
                    alt={feature.title}
                    className="w-[34px] h-[34px] object-contain"
                    onError={() => handleImageError(feature.id)}
                  />
                </div>

                <h3 className="font-semibold text-xl mb-2 mt-10 text-black">
                  {feature.title}
                </h3>
                <p className="text-[#000000] text-[16px]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Whychoose;
