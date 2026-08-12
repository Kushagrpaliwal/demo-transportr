import Cookies from "js-cookie";
import { Link, useNavigate } from "react-router-dom";
import headerImage from "../../../public/headerImage.png";

const Banner = ({ cmsData }) => {
  const navigate = useNavigate();
  const token = Cookies.get("token");

  return (
    <section className="w-full relative bg-white overflow-hidden">
      <div className="containersec relative z-10 flex flex-col lg:pb-[60px] px-4 sm:px-8 lg:px-16">
        <div className="absolute top-0 right-0 flex">
          <img
            src={headerImage}
            alt="Transportr App"
            className="w-[325px] h-[380px]  sm:w-[400px] md:w-[580px] lg:w-[500px] xl:w-[650px] sm:h-auto"
          />
        </div>
        {/* Header */}
        <div className="w-full flex justify-between z-10 items-center mt-5">
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
                className="bg-white text-[#4681F4] cursor-pointer text-sm sm:text-base font-bold sm:w-[98px] w-[70px] h-10 sm:h-[50px] flex justify-center items-center rounded-[25px] transition-all hover:bg-[#4681F4] hover:text-white"
              >
                Login
              </button>
              <button
                onClick={() => {
                  navigate("/sign-up");
                }}
                className="bg-[#4681F4] text-white cursor-pointer text-sm sm:text-base font-bold sm:h-[50px] w-[90px] h-10 sm:w-[108px] flex justify-center items-center rounded-full border border-white transition-all hover:text-[#4681F4] hover:bg-white"
              >
                Sign up
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between py-10 md:py-16">
          {/* Text Section */}
          <div className="flex-1 z-10 flex flex-col justify-center gap-5 w-full items-center lg:items-start lg:max-w-xl text-center lg:text-left mt-[220px] md:mt-[380px] lg:mt-0 lg:pr-10 xl:pr-0 lg:pt-0 xl:pt-[100px] pt-10 md:pt-16">
            <h1 className="text-3xl sm:text-4xl md:text-[50px] font-bold text-black leading-tight">
              {cmsData[0]?.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-500">
              {cmsData[0]?.subtitle}
            </p>

            <div className="flex  sm:flex-row gap-4 justify-center lg:justify-start w-full">
              <button
                onClick={() => {
                  navigate("/dashboard");
                }}
                className="bg-[#4681F4] flex justify-center items-center w-[158px] h-[50px]  cursor-pointer text-white rounded-full font-bold text-base sm:text-lg hover:bg-white hover:text-[#4681F4] border border-[#4681F4] transition-all"
              >
              Get Started
              </button>
              <button
                    onClick={() => {
                  if (token) {
                    navigate("/dashboard/search-travellers");
                  } else {
                    navigate("/login");
                  }
                }}
              className="border border-[#4681F4] flex justify-center items-center cursor-pointer h-[50px] w-[186px] text-[#4681F4] rounded-full font-bold text-base sm:text-lg hover:bg-[#4681F4] hover:text-white transition-all">
                Find a Traveller
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
