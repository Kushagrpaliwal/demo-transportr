const DownloadApp = ({ cmsData }) => {
  return (
    <section className="w-full  bg-[#E6F0FF] py-8 lg:pt-10">
      <div className="containersec flex flex-col lg:h-[600px] justify-center items-center">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-20 lg:gap-10">
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:gap-5 justify-center mb-0">
            <h2 className="text-3xl md:text-4xl lg:text-[45px] font-bold text-black mb-4">
              {cmsData[12]?.title || "Download the Transportr App"}
            </h2>
            <p className="text-[#5F6C85] mb-6 text-lg">
              {cmsData[12]?.subtitle}"
            </p>

            <div className="flex gap-4">
              <div className="bg-white text-black h-[55px] cursor-pointer hover:bg-[#4681F4] transition-all hover:text-white rounded-[30px] w-[160px] px-3 py-2  flex justify-center items-center gap-2 shadow hover:opacity-90">
                <img src="/google-play.svg" alt="Google Play" className="h-6" />
                <div className="flex flex-col items-start ">
                  <p className="text-[12px]">Get it on</p>
                  <p className=" text-base">Google play</p>
                </div>
              </div>
              <div className="bg-white text-black  h-[55px] cursor-pointer hover:bg-[#4681F4] transition-all hover:text-white rounded-[30px] w-[160px] px-3 py-2 flex justify-center items-center gap-2 shadow hover:opacity-90">
                <img src="/app-store.svg" alt="Google Play" className="h-6" />
                <div className="flex flex-col items-start">
                  <p className="text-[12px] ">Download on the</p>
                  <p className=" text-base">App Store</p>
                </div>
              </div>
            </div>
          </div>
          {/* Right: Phone Images */}
          <div className="flex-1 flex justify-center items-center relative min-h-[320px] mt-10 lg:mt-0">
            <div className="w-[300px] h-[300px] md:w-[415px] md:h-[415px] rounded-full flex items-center justify-center bg-[#4681F4]">
              <div className="md:w-[227px] md:h-[227px] rounded-full bg-[#C7DAFF1A] absolute bottom-[25px] left-[28%]"></div>
              <img
                src="./search-traveller.png"
                alt="Transportr App"
                className="md:w-[248px] w-[170px] h-auto lg:h-[414px] right-0 lg:right-[30px] absolute rotate-[10deg]"
              />
              <img
                src="./splash-screen.png"
                alt="Transportr App"
                className="md:w-[248px] w-[170px] h-auto lg:h-[473px] bottom-[30px] absolute z-10"
              />
              <img
                src="./identitiy-verification.png"
                alt="Transportr App"
                className="md:w-[248px] w-[170px] h-auto lg:h-[414px] rotate-[-33.13deg] left-0 lg:left-[30px] absolute"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadApp;
