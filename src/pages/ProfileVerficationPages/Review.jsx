import { SquarePen } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveStep4ReviewService } from "../../api/services/ProfileService/profileServices";
import LoadingButton from "../../components/Common/LoadingButton";
import { usePopup } from "../../context/PopupContext";
import { useProfile } from "../../context/ProfileContext";

const Review = () => {
  const navigate = useNavigate();
  const { profile, fetchProfile, loading, error } = useProfile();
  const [loader, setLoader] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { showPopup } = usePopup();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading profile</p>;

  const handleVerify = async () => {
    try {
      setLoader(true);
      const res = await saveStep4ReviewService();
      //console.log ("Verification Request Successfully Submitted", res);
      showPopup("Verification Request Successfully Submitted", "success");
      await fetchProfile();
      navigate("/dashboard");
    } catch (error) {
      console.error("Error Sending Verification Request", error);
      showPopup("Error Sending Verification Request", error);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="w-full xl:max-w-5xl mx-auto p-4 md:p-8">
      <h5 className="text-[20px] font-semibold text-black">Step 4 of 4</h5>

      <h1 className="text-[26px] font-semibold text-black mb-2">
        Review & Submit
      </h1>

      <p className="text-lg font-normal text-[#5F6C85] mb-8">
        Please review all your information carefully before submitting
      </p>

      <div className="flex flex-col gap-8 md:gap-12 mt-8">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium text-black text-[22px]">
              Personal Details
            </h3>
            <button
              onClick={() =>
                navigate("/dashboard/verification/personal-details", {
                  state: {
                    isVerified: true,
                  },
                })
              }
              className="flex items-center gap-2 bg-[#EEF2F6] px-4 py-2 rounded-full text-base font-bold hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <SquarePen className="w-4 h-4" /> Edit
            </button>
          </div>

          <div className="bg-[#E6F0FF] rounded-[20px] p-6 lg:p-8 flex flex-col gap-6 w-full">
            <div className="flex justify-between items-center border-b border-[#D5E4F9] pb-4">
              <span className="text-[#5F6C85] text-[17px]">Name</span>
              <span className="font-semibold text-black text-right text-[17px]">
                {profile?.data?.full_name}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-[#D5E4F9] pb-4">
              <span className="text-[#5F6C85] text-[17px]">Date of Birth</span>
              <span className="font-semibold text-black text-right text-[17px]">
                {profile?.data?.dob}
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-[#D5E4F9] pb-4 gap-2 md:gap-4">
              <span className="text-[#5F6C85] text-[17px] md:mr-4 md:whitespace-nowrap md:w-1/3">
                Address Line 1
              </span>
              <span className="flex justify-end font-medium px-4 py-3 md:px-4 md:py-3 text-black text-[15px] md:text-[17px]  md:w-2/3 md:text-left">
                {profile?.data?.address} , {profile?.data?.city} ,{" "}
                {profile?.data?.country} , {profile?.data?.postalcode}
              </span>
            </div>
            {/* <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-[#D5E4F9] pb-4 gap-2 md:gap-4">
              <span className="text-[#5F6C85] text-[17px] md:mr-4 md:whitespace-nowrap md:w-1/3">
                Address Line 2 (Optional)
              </span>
              <span className="flex justify-end font-medium px-4 py-3 md:px-4 md:py-3 text-black text-[15px] md:text-[17px]  md:w-2/3 md:text-left">
                {profile?.data?.address_2}
              </span>
            </div> */}
            {/* <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-[#D5E4F9] pb-4 gap-2 md:gap-4">
              <span className="text-[#5F6C85] text-[17px] md:mr-4 md:whitespace-nowrap md:w-1/3">
                Town/ City
              </span>
              <span className="flex justify-end font-medium px-4 py-3 md:px-4 md:py-3 text-black text-[15px] md:text-[17px]  md:w-2/3 md:text-left">
                {profile?.data?.city}
              </span>
            </div> */}
            {/* <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-[#D5E4F9] pb-4 gap-2 md:gap-4">
              <span className="text-[#5F6C85] text-[17px] md:mr-4 md:whitespace-nowrap md:w-1/3">
                Country (Optional)
              </span>
              <span className="flex justify-end font-medium px-4 py-3 md:px-4 md:py-3 text-black text-[15px] md:text-[17px]  md:w-2/3 md:text-left">
                {profile?.data?.country}
              </span>
            </div> */}
            {/* <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-[#D5E4F9] pb-4 gap-2 md:gap-4">
              <span className="text-[#5F6C85] text-[17px] md:mr-4 md:whitespace-nowrap md:w-1/3">
                Postcode
              </span>
              <span className="flex justify-end font-medium px-4 py-3 md:px-4 md:py-3 text-black text-[15px] md:text-[17px]  md:w-2/3 md:text-left">
                {profile?.data?.postalcode}
              </span>
            </div> */}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium text-black text-[22px]">
                Identity Document
              </h3>
              <button
                onClick={() =>
                  navigate("/dashboard/verification/identity-scan", {
                    state: {
                      isVerified: true,
                    },
                  })
                }
                className="flex items-center gap-2 bg-[#EEF2F6] px-4 py-2 rounded-full text-base font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <SquarePen className="w-4 h-4" /> Edit
              </button>
            </div>

            <div className="bg-[#E6F0FF] rounded-[20px] p-4 lg:p-8 flex flex-col gap-6 w-full">
              <div className="flex justify-between items-center border-b border-[#D5E4F9] pb-4">
                <span className="text-[#5F6C85] text-[17px]">
                  Document Type
                </span>
                <span className="font-semibold text-black text-right text-[17px]">
                  {profile?.data?.verification?.document_type}
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-[#D5E4F9] pb-4 gap-2 md:gap-4 relative overflow-hidden">
                <span className="text-[#5F6C85] text-[17px] md:mr-4 md:whitespace-nowrap md:w-1/3">
                  ID Document
                </span>
                <span className="font-semibold text-black md:text-right text-[17px] truncate bg-white md:bg-transparent px-4 py-3 md:p-0 rounded-[10px] md:rounded-none md:w-2/3">
                  {profile?.data?.verification?.document_image?.replace(
                    "https://transportr.blob.core.windows.net/transportr/",
                    "",
                  )}
                </span>
              </div>
              {profile?.data?.verification?.document_type ===
                "DriversLicense" && (
                <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-[#D5E4F9] pb-4 gap-2 md:gap-4 relative overflow-hidden">
                  <span className="text-[#5F6C85] text-[17px] md:mr-4 md:whitespace-nowrap md:w-1/3">
                    ID Document (Back)
                  </span>
                  <span className="font-semibold text-black md:text-right text-[17px] truncate bg-white md:bg-transparent px-4 py-3 md:p-0 rounded-[10px] md:rounded-none md:w-2/3">
                    {profile?.data?.verification?.document_image_2?.replace(
                      "https://transportr.blob.core.windows.net/transportr/",
                      "",
                    ) || "Not Uploaded"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium text-black text-[22px]">
                Address Proof Document
              </h3>
              <button
                onClick={() =>
                  navigate("/dashboard/verification/address-proof", {
                    state: {
                      isVerified: true,
                    },
                  })
                }
                className="flex items-center gap-2 bg-[#EEF2F6] px-4 py-2 rounded-full text-base font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <SquarePen className="w-4 h-4" /> Edit
              </button>
            </div>

            <div className="bg-[#E6F0FF] rounded-[20px] p-4 lg:p-8 flex flex-col gap-6 w-full">
              <div className="flex justify-between items-center border-b border-[#D5E4F9] pb-4">
                <span className="text-[#5F6C85] text-[17px]">
                  Document Type
                </span>
                <span className="font-semibold text-black text-right text-[17px]">
                  {profile?.data?.verification?.address_proof_document_type}
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-[#D5E4F9] pb-4 gap-2 md:gap-4 relative overflow-hidden">
                <span className="text-[#5F6C85] text-[17px] md:mr-4 md:whitespace-nowrap md:w-1/3">
                  ID Document
                </span>
                <span className="font-semibold text-black md:text-right text-[17px] truncate bg-white md:bg-transparent px-4 py-3 md:p-0 rounded-[10px] md:rounded-none md:w-2/3">
                  {profile?.data?.verification?.proof_of_address_image?.replace(
                    "https://transportr.blob.core.windows.net/transportr/",
                    "",
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[20px] p-4 flex flex-col gap-1 border border-[#D6D6D6]">
            <label className="flex items-center gap-3 text-base font-bold text-black cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 accent-blue-500 cursor-pointer"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
              />
              I confirm my details are correct
            </label>
            <span className="text-sm font-normal text-[#5F6C85] ml-8">
              By checking this box, you confirm that the name and address
              provided are accurate. Changes will require contacting support.
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mt-12 mb-8 w-full">
        <button
          type="button"
          onClick={() => navigate("/dashboard/verification/address-proof")}
          className="w-full md:w-auto text-xl font-bold cursor-pointer border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-8 py-3 rounded-full transition-colors"
        >
          Go Back
        </button>

        <LoadingButton
          loading={loader}
          type="button"
          disabled={!isConfirmed}
          onClick={handleVerify}
          className={`w-full md:w-auto text-xl font-bold border px-10 py-3 rounded-full transition-colors ${!isConfirmed ? "bg-gray-400 text-white cursor-not-allowed border-gray-400" : "bg-blue-500 hover:bg-white hover:text-blue-500 border-blue-500 text-white cursor-pointer"}`}
        >
          Verify & Submit
        </LoadingButton>
      </div>
    </div>
  );
};

export default Review;
