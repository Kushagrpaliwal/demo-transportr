import { Link, useNavigate } from "react-router-dom";
import { commonCmsService } from "../api/services/CMSService/CmsService";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import DOMPurify from "dompurify";

const TermCondition = () => {
  const [tnc, setTnc] = useState();

  useEffect(() => {
    const getTerms = async () => {
      try {
        const res = await commonCmsService("terms-and-conditions");
        // console.log(res?.data?.data[0].content)
        setTnc(res?.data?.data[0].content || []);
      } catch (err) {
        console.log(err);
      }
    };

    getTerms();
  }, []);

  const navigate = useNavigate();
  const token = Cookies.get("token");
  return (
    <section className="w-full bg-white overflow-hidden">
      <div className="containersec relative z-10 flex flex-col pb-7.5 px-4 sm:px-8 lg:px-16">
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
          <div className="flex gap-2 items-center">
            {!token && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-[150px] md:h-[200px] flex justify-center items-center  bg-[#4681F4] text-white relative overflow-hidden">
        <div className="md:w-[155px] md:h-[155px] w-[100px] h-[100px]  rounded-full bg-[#C7DAFF1A] absolute left-[-10px] top-0 md:-left-[30px] md:-top-[10px]"></div>
        <div className="md:w-[114px] md:h-[114px] w-[80px] h-[80px] rounded-full bg-[#C7DAFF1A] absolute left-[30px] md:left-[60px] bottom-0 md:-bottom-[10px]"></div>
        <h3 className="text-2xl md:text-[32px] font-bold">Terms & Condition</h3>
        <div className="md:w-[155px] md:h-[155px] w-[100px] h-[100px] rounded-full bg-[#C7DAFF1A] absolute right-[30px] top-0 md:right-[35px] md:-top-[10px]"></div>
        <div className="md:w-[114px] md:h-[114px] w-[80px] h-[80px] rounded-full bg-[#C7DAFF1A] absolute right-0 bottom-0 md:-right-[10px] md:-bottom-[10px]"></div>
      </div>

      <div className="containersec relative z-10 flex flex-col lg:py-[40px] py-7.5 pl-5 px-4 sm:px-8 lg:px-16">
        <div className="w-full flex flex-col gap-3 text-left">
          <div
            className="
    prose 
    lg:prose-lg 
    max-w-none

    prose-ul:my-2

    prose-li:my-1

    prose-ul+*:mt-1

    /* layout */
    prose-ul:list-none
    prose-ul:pl-0

    prose-li:flex
    prose-li:items-start
    prose-li:gap-2

    prose-img:w-5
    prose-img:h-5
    prose-img:mt-1
    prose-img:shrink-0

    prose-strong:font-bold
    prose-strong:text-black
  "
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(tnc),
            }}
          />

          {/* <h3 className="text-2xl md:text-[32px] font-bold text-[#4681F4]">Final Notes</h3>
          <p className="text-black text-base font-bold md:text-xl">Contact Transportr Ltd</p>
          <p className="text-black font-normal text-base md:text-xl">Email: <Link to={"mailto:admin@transportr.co.uk"} className="hover:text-[#4681F4] cursor-pointer transition-all">admin@transportr.co.uk</Link></p>
          <p className="text-black font-normal text-base md:text-xl">Phone: [Insert UK Phone Number]</p>
          <p className="text-black font-normal text-base md:text-xl">Registered Office: 3rd Floor, 207 Regent Street, London, United Kingdom, W1B 3HH</p>
 */}
        </div>
      </div>
    </section>
  );
};

export default TermCondition;
