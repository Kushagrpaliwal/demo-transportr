const GetStarted = ({ cmsData }) => {
  // Parse HTML content from API response
  const parseContentFromApi = (content) => {
    if (!content) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const listItems = doc.querySelectorAll("li");

    return Array.from(listItems).map((li) => li.textContent.trim());
  };

  const findSection = (sectionName) => {
    if (!cmsData || !Array.isArray(cmsData)) return null;
    return cmsData.find((item) => item.section_name === sectionName);
  };

  const senderSection = findSection("steps_sender");
  const travelerSection = findSection("steps_traveler");
  const getStartedSection = findSection("steps_title");

  const getSenderSteps = () => {
    if (senderSection?.content) {
      const steps = parseContentFromApi(senderSection.content);
      return steps.map((step, index) => ({
        icon: ["./package.svg", "./profile.svg", "./direction.svg"][index],
        title: step,
        stepNumber: index + 1,
      }));
    }

    return [
      { icon: "./package.svg", title: "List Your Package", stepNumber: 1 },
      { icon: "./profile.svg", title: "Find a Traveller", stepNumber: 2 },
      { icon: "./direction.svg", title: "Send & Track", stepNumber: 3 },
    ];
  };

  const getTravellerSteps = () => {
    if (travelerSection?.content) {
      const steps = parseContentFromApi(travelerSection.content);
      return steps.map((step, index) => ({
        icon: "./trip-route.svg",
        title: step,
        stepNumber: index + 1,
      }));
    }

    return [
      { icon: "./trip-route.svg", title: "List Your Trip", stepNumber: 1 },
      { icon: "./notified.svg", title: "Connect with Senders", stepNumber: 2 },
      { icon: "./earn.svg", title: "Deliver & Earn", stepNumber: 3 },
    ];
  };

  const senderSteps = getSenderSteps();
  const travellerSteps = getTravellerSteps();

  const senderTitle = senderSection?.title || "For Senders";
  const travelerTitle = travelerSection?.title || "For Travellers";
  const mainTitle = getStartedSection?.title || "Getting Started is Easy";
  const mainSubtitle =
    getStartedSection?.subtitle ||
    "Whether you're sending a package or traveling, our platform makes it simple to get started and connect with the right people.";

  return (
    <>
      <section className="w-full bg-white ">
        <div className="containersec flex flex-col items-center">
          <div className="w-full py-8 p-4 md:p-8 lg:p-12">
            <h2 className="text-3xl md:text-4xl lg:text-[45px] font-bold text-center text-black mb-4">
              {mainTitle}
            </h2>
            <p className="text-[#5F6C85] text-[18px] text-center mb-10 max-w-md mx-auto">
              {mainSubtitle}
            </p>
            <div className="flex flex-col-reverse md:flex-row gap-10 md:gap-0 w-full">
              {/* For Senders */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-xl lg:text-[32px] font-bold text-black mb-6">
                  {senderTitle}
                </h3>
                <div className="space-y-6">
                  {senderSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="bg-[#4681F4] mt-2 rounded-full min-w-[80px] w-20 h-20 flex items-center justify-center mr-4">
                        <img
                          src={step.icon}
                          alt="Senders steps"
                          className="w-[34px] h-[34px]"
                        />
                      </div>

                      <div>
                        <span className="text-[#F4B846] text-xs font-semibold">
                          Step {step.stepNumber}
                        </span>
                        <h4 className="font-semibold text-xl text-black mb-1">
                          {step.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Phone image for Senders */}
              <div className="flex flex-1 justify-center items-center relative mt-[100px] mb-10 md:mb-0 lg:mt-20">
                <div className="w-[250px] h-[250px] md:w-[300px] md:h-[300px] lg:w-[415px] lg:h-[415px] rounded-full flex relative items-center justify-center bg-[#4681F4]">
                  <div className="w-[150px] h-[150px] rounded-full bg-[#C7DAFF1A] absolute right-1"></div>
                  <img
                    src={senderSection?.image || "./search-traveller.png"}
                    alt="Transportr App"
                    className="w-[327px] h-auto lg:h-[546px] top-[-45px] relative z-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#E6F0FF]">
        <div className="containersec flex flex-col items-center">
          <div className="w-full py-8 p-4 md:p-8 lg:p-12">
            <div className="flex flex-col md:flex-row gap-10 md:gap-0 w-full">
              {/* For Travellers */}
              <div className="flex flex-1 justify-center items-center relative mt-[100px] mb-10 md:mb-0 lg:mt-20">
                <div className="w-[250px] h-[250px] md:w-[300px] md:h-[300px] lg:w-[415px] lg:h-[415px] relative rounded-full flex items-center justify-center bg-[#4681F4]">
                  <div className="w-[150px] h-[150px] rounded-full bg-[#C7DAFF1A] absolute right-1"></div>
                  <img
                    src={travelerSection?.image || "./listed-traveller.png"}
                    alt="Transportr App"
                    className="w-[327px] h-auto lg:h-[546px] top-[-45px] relative z-10"
                  />
                </div>
              </div>
              {/* Content for Travellers */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-xl lg:text-[32px] font-bold text-black mb-6">
                  {travelerTitle}
                </h3>
                <div className="space-y-6">
                  {travellerSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="bg-[#4681F4] mt-2 rounded-full min-w-[80px] w-20 h-20 flex items-center justify-center mr-4">
                        <img
                          src={step.icon}
                          alt="Travellers steps"
                          className="w-[34px] h-[34px]"
                        />
                      </div>

                      <div>
                        <span className="text-[#F4B846] text-xs font-semibold">
                          Step {step.stepNumber}
                        </span>
                        <h4 className="font-semibold text-xl text-black mb-1">
                          {step.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default GetStarted;
