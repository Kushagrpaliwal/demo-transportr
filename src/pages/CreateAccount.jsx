import { Link } from "react-router-dom";

const CreateAccount = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E6F0FF] relative overflow-hidden">
      <div
        className="hidden lg:block absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/bg-create.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></div>
      <div className="hidden lg:flex w-1/2"></div>
      <div className="flex w-full justify-center lg:w-1/2 items-center z-10">
        <div className="bg-white rounded-[18px] shadow-lg p-8 md:p-12 lg:px-6 lg:py-8 xl:p-12 w-full max-w-[600px] mx-4">
          <div className="flex flex-col items-center mb-6">
            <Link to={"/"}>
              <img
                src="/logo.svg"
                alt="Transportr Logo"
                className="h-[25px] mb-3 lg:w-[286px]"
              />
            </Link>
            <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2 text-center">
              Create An Account
            </h2>
            <p className="text-[#5F6C85] text-center text-sm md:text-lg">
              Become part of a community that's changing how things{" "}
              <br className="hidden lg:block" /> get from A to B. Your journey
              starts here.
            </p>
          </div>
          <div className="flex flex-col gap-3 mb-6">
            <button className="group flex items-center gap-2 h-10 md:h-[50px] bg-[#E6F0FF] text-sm md:text-base text-black font-medium rounded-[25px] w-full justify-center transition-all cursor-pointer hover:bg-[#4681F4] hover:text-[18px] hover:text-white">
              <img
                src="./Google.svg"
                alt="Google"
                className="w-6 h-6 block group-hover:hidden"
              />
              <img
                src="./Google-white.svg"
                alt="Google"
                className="w-6 h-6 hidden group-hover:block"
              />
              Continue with Google
            </button>
            <button className="group flex items-center gap-2 h-10 md:h-[50px] bg-[#E6F0FF] text-sm md:text-base text-black font-medium rounded-[25px] w-full justify-center transition-all cursor-pointer hover:bg-[#4681F4] hover:text-[18px] hover:text-white">
              <img
                src="./facebook.svg"
                alt="Facebook"
                className="w-6 h-6 block group-hover:hidden"
              />
              <img
                src="./facebook-white.svg"
                alt="Facebook"
                className="w-7 h-7 hidden group-hover:block"
              />
              Continue with Facebook
            </button>
            <button className="group flex items-center gap-2 h-10 md:h-[50px] bg-[#E6F0FF] text-sm md:text-base text-black font-medium rounded-[25px] w-full justify-center transition-all cursor-pointer hover:bg-[#4681F4] hover:text-[18px] hover:text-white">
              <img
                src="./app-store.svg"
                alt="Apple"
                className="w-6 h-6 block group-hover:hidden"
              />
              <img
                src="./Apple-white.svg"
                alt="Apple"
                className="w-7 h-7 hidden group-hover:block"
              />
              Continue with Apple
            </button>
            <button className="group flex items-center gap-2 h-10 md:h-[50px] bg-[#E6F0FF] text-sm md:text-base text-black font-medium rounded-[25px] w-full justify-center transition-all cursor-pointer hover:bg-[#4681F4] hover:text-[18px] hover:text-white">
              <img
                src="./Email-black.svg"
                alt="Email"
                className="w-6 h-6 block group-hover:hidden"
              />
              <img
                src="./Email-white.svg"
                alt="Email"
                className="w-7 h-7 hidden group-hover:block"
              />
              Continue with Email
            </button>
          </div>
          <div className="text-center text-black text-[14px] md:text-lg mb-2">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#4681F4] font-semibold hover:underline"
            >
              Log In
            </Link>
          </div>
          <p className="text-xs md:text-base text-black text-center">
            By Continuing, You Agree to Transportr's <br />
            <Link
              to="/terms-condition"
              className="text-[#4681F4] font-semibold hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy-policy"
              className="text-[#4681F4] font-semibold hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
