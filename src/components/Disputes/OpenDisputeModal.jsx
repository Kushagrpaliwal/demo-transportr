import React from "react";
import { useNavigate } from "react-router-dom";

const OpenDisputeModal = ({
  isOpen,
  onClose,
  travelerName,
  travelerId,
  onOpenFormalCase,
}) => {
  const navigate = useNavigate();

  const handleMessageClick = () => {
    onClose();
    navigate(`/dashboard/messages/${travelerId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] px-4">
      <div className="bg-white rounded-[20px] p-6 w-full text-center max-w-[400px] shadow-lg flex flex-col items-center">
        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-black mb-4">
          Start with a Conversation
        </h3>
        <p className="text-[#5F6C85] text-sm md:text-base lg:text-lg text-center mb-6">
          The fastest way to resolve most issues is by talking directly.{" "}
          {travelerName} may not be aware of the problem yet, and a friendly
          message is the best first step to finding a solution together.
        </p>
        <div className="flex w-full flex-col items-center gap-4">
          <button
            onClick={handleMessageClick}
            className="w-full h-10 lg:h-[50px] bg-[#4681F4] md:gap-2 hover:bg-[#4681F4] cursor-pointer text-base flex items-center justify-center gap-1 font-bold hover:text-white text-white rounded-full duration-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <img src="/dashboard/message.svg" alt="message" />
            Message {travelerName}
          </button>
          <p className="text-[#5F6C85] text-sm md:text-base">
            If you've already tried this or the issue is serious, you can open a
            formal case with Transportr.
          </p>
          <button
            onClick={onOpenFormalCase}
            className="text-[#4681F4] hover:underline cursor-pointer font-semibold text-sm md:text-base lg:text-xl mt-2"
          >
            Open a Formal Case
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpenDisputeModal;
