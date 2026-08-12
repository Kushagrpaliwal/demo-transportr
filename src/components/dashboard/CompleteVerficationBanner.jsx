import { useState } from "react";
import { useNavigate } from "react-router-dom";
import reviewIcon from "../../../public/dashboard/file-text.svg";
import addressProofIcon from "../../../public/dashboard/home.svg";
import identityScanIcon from "../../../public/dashboard/maximize.svg";
import userProfileIcon from "../../../public/dashboard/user-check.svg";
import { useProfile } from "../../context/ProfileContext";
import VerificationModal from "./VerificationModal";

const CompleteVerficationBanner = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const profileContext = useProfile() || {};
  const { loading, error, profile } = profileContext;
  const data = profile?.data || {};
  const verification = data?.verification || {};

  if (loading) {
    return (
      <p className="bg-[#E6F0FF] w-full py-6 px-4 rounded-[20px] text-xl font-bold text-left md:text-center">
        Loading Profile Details...
      </p>
    );
  }

  if (error) {
    return (
      <p className="bg-[#E6F0FF] w-full py-6 px-4 rounded-[20px] text-left md:text-center text-xl font-bold text-red-700">
        Something went wrong
      </p>
    );
  }

  const status = verification?.status;
  const rejectedReason = verification?.rejected_reason;

  if (status === "Approved") {
    return null;
  }

  const handleStartVerification = () => {
    if (verification?.proof_of_address_image) {
      navigate("/dashboard/verification/review");
    } else if (verification?.document_image) {
      navigate("/dashboard/verification/address-proof");
    } else if (data?.country) {
      navigate("/dashboard/verification/identity-scan");
    } else {
      navigate("/dashboard/verification/personal-details");
    }
  };

  const steps = [
    {
      label: "Personal Details",
      icon: userProfileIcon,
      active: !data?.country,
      completed: !!data?.country,
    },
    {
      label: "Identity Scan",
      icon: identityScanIcon,
      active: !!data?.country && !verification?.document_image,
      completed: !!verification?.document_image,
    },
    {
      label: "Address Proof",
      icon: addressProofIcon,
      active: !!verification?.document_image && !verification?.proof_of_address_image,
      completed: !!verification?.proof_of_address_image,
    },
    {
      label: "Review",
      icon: reviewIcon,
      active: !!verification?.proof_of_address_image && status === "Pending",
      completed: status !== "Pending" && !!status,
    },
  ];

  const renderBannerContent = () => {
    if (status === "PendingVerification") {
      return (
        <div className="bg-[#FFD47D] w-full py-6 px-4 rounded-[20px] text-left md:text-center">
          <p className="font-semibold text-[18px]">Verification in Review</p>
          <p className="text-sm font-normal my-2">
            Thanks, we've got it! To ensure community safety and trust, our team
            is carefully reviewing your documents. We'll notify you soon.
          </p>
        </div>
      );
    }

    if (status === "Rejected" || rejectedReason) {
      return (
        <div className="border border-red-600 w-full py-6 px-4 rounded-[20px] text-left md:text-center">
          <p className="font-semibold text-[18px]">
            Action Required: Please Update Your Verification
          </p>
          <p className="text-sm font-normal my-2">
            We couldn't quite match the details from your documents. This can
            happen if a photo is blurry or information doesn't match. Please
            review your submission.
          </p>
          <div className="w-full mt-6 flex justify-center">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-red-600 py-2 px-8 text-white rounded-[25px] font-bold text-xl cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review & Resubmit
            </button>
          </div>
        </div>
      );
    }

    // Default to Pending / Not Started
    return (
      <div className="bg-[#E6F0FF] w-full py-6 px-4 rounded-[20px] text-left md:text-center">
        <p className="font-semibold text-[18px]">
          Become a Trusted Transportr Member
        </p>
        <p className="text-sm font-normal my-2">
          To ensure the safety and trust of our community, we need to verify
          all members. It only takes a few moments and unlocks all features.
        </p>
        <div className="w-full mt-6 flex justify-center md:justify-center">
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#4681F4] py-2 px-8 text-white rounded-[25px] font-bold text-xl hover:bg-[white] hover:text-[#4681F4] border-1 border-[#4681F4] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Verification
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderBannerContent()}

      <VerificationModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Become a Trusted Transportr Member"
        description="To ensure the safety and trust of our community..."
        steps={steps}
        primaryAction={{
          label: "Start Verification",
          onClick: handleStartVerification,
        }}
        secondaryAction={{
          label: "Maybe Later",
          onClick: () => setModalOpen(false),
        }}
      />
    </div>
  );
};

export default CompleteVerficationBanner;
