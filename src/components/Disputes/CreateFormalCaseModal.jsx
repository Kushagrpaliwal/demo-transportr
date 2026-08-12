import React, { useState, useEffect } from "react";
import { createFormalCaseService } from "../../api/services/DisputeService/disputeService";

const CreateFormalCaseModal = ({
  isOpen,
  onClose,
  packageId,
  trackingNumber,
  userType,
  senderId,
  travelerId,
  onSubmit,
  hasInsurance = false,
}) => {
  const [formData, setFormData] = useState({
    reason: "",
    description: "",
    evidence_image: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const validReasonsSender = [
    "Package arrived damaged",
    "Package was not delivered",
    "Traveller did not show up for pickup",
    "Item was delivered significantly late",
    "Other (Please describe below)",
  ];

  const validReasonsTraveler = [
    "Sender did not show up for pickup",
    "Package was not as described (size, weight, contents)",
    "Recipient was not available for delivery",
    "Other (Please describe below)",
  ];

  const disputeReasons =
    userType === "sender" ? validReasonsSender : validReasonsTraveler;

  useEffect(() => {
    if (isOpen) {
      setFormData({
        reason: "",
        description: "",
        evidence_image: null,
      });
      setErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleReasonChange = (e) => {
    setFormData((prev) => ({ ...prev, reason: e.target.value }));
    if (errors.reason) {
      setErrors((prev) => ({ ...prev, reason: "" }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleDescriptionChange = (e) => {
    setFormData((prev) => ({ ...prev, description: e.target.value }));
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: "" }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          evidence_image:
            "Invalid file type. Please upload an image, PDF, or Word document.",
        }));
        return;
      }

      const minBytes = 10 * 1024; // 10KB
      const maxBytes = 2 * 1024 * 1024; // 2MB
      if (file.size < minBytes) {
        setErrors((prev) => ({
          ...prev,
          evidence_image: "File must be at least 10KB",
        }));
        return;
      }
      if (file.size > maxBytes) {
        setErrors((prev) => ({
          ...prev,
          evidence_image: "File must be no larger than 2MB",
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, evidence_image: file }));
      if (errors.evidence_image) {
        setErrors((prev) => ({ ...prev, evidence_image: "" }));
      }
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reason.trim()) {
      newErrors.reason = "Please select a reason for the dispute";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Please provide a detailed description";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("package_id", packageId);
      formDataToSend.append("reason", formData.reason);
      formDataToSend.append("description", formData.description);

      if (userType == "sender") {
        formDataToSend.append("traveler_id", travelerId);
      } else if (userType === "traveler") {
        formDataToSend.append("sender_id", senderId);
      }

      if (formData.evidence_image) {
        formDataToSend.append("evidence_image", formData.evidence_image);
      }

      const response = await createFormalCaseService(formDataToSend);

      if (response?.data?.success) {
        if (onSubmit) {
          onSubmit(response.data);
        }
        onClose();
      } else {
        throw new Error(response?.data?.message || "Failed to create dispute");
      }
    } catch (error) {
      console.error("Error creating formal case:", error);
      setSubmitError(
        error?.response?.data?.message ||
          "Failed to submit dispute. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-start p-6 md:p-8 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-black">
              Open a Formal Case for
            </h2>
            <h3 className="text-2xl md:text-3xl font-bold text-black">
              #{trackingNumber || packageId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold p-2 cursor-pointer"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <div className="px-6 md:px-8 py-4">
          <p className="text-[#5F6C85] text-sm md:text-base">
            This will open a formal dispute and temporarily hold the payment.
            <br />
            Please provide the details below.
          </p>
        </div>

        {submitError && (
          <div className="px-6 md:px-8 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 md:px-8 pb-8">
          <div className="mb-6">
            <label className="block text-black font-semibold text-base mb-3">
              Reason for Dispute
            </label>
            <select
              value={formData.reason}
              onChange={handleReasonChange}
              disabled={isSubmitting}
              className={`w-full bg-[#E6F0FF] rounded-xl px-4 py-3 md:py-3.5 text-base text-gray-600 outline-none appearance-none cursor-pointer transition-all ${
                errors.reason
                  ? "border-2 border-red-500"
                  : "border border-transparent"
              } hover:bg-blue-100/50 focus:bg-white focus:border-[#4681F4] ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <option value="">Select a reason...</option>
              {disputeReasons.map((reason, index) => (
                <option key={index} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p className="text-red-500 text-sm mt-2">{errors.reason}</p>
            )}
            {!hasInsurance &&
              formData.reason &&
              (formData.reason === "Package arrived damaged" ||
                formData.reason === "Package was not delivered") && (
                <div className="mt-4 bg-[#FFF8EB] border border-[#FDE68A] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#D97706"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <h4 className="text-[#374151] font-bold text-base md:text-lg">
                      Insurance Not Purchased
                    </h4>
                  </div>
                  <p className="text-[#92400E] text-sm md:text-base leading-relaxed">
                    You are opening a case for a lost/damaged item, but
                    insurance was not purchased for this shipment. Please be
                    aware that as per our Terms of Service, this may limit the
                    available resolution options. You may still proceed to
                    communicate with the traveler to find a mutual agreement.
                  </p>
                </div>
              )}
          </div>

          <div className="mb-6">
            <label className="block text-black font-semibold text-base mb-3">
              Detailed Description
            </label>
            <textarea
              value={formData.description}
              onChange={handleDescriptionChange}
              rows={5}
              disabled={isSubmitting}
              placeholder="Please provide as much detail as possible about what happened..."
              className={`w-full bg-[#E6F0FF] rounded-xl px-4 py-3 md:py-3.5 text-base text-gray-700 placeholder-gray-500 resize-none outline-none transition-all ${
                errors.description
                  ? "border-2 border-red-500"
                  : "border border-transparent"
              } hover:bg-blue-100/50 focus:bg-white focus:border-[#4681F4] ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-2">{errors.description}</p>
            )}
          </div>

          <div className="mb-8">
            <label className="block text-black font-semibold text-base mb-3">
              Upload Evidence (Optional but recommended)
            </label>

            <div
              className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 
  bg-[#E6F0FF] border border-dashed border-[#4681F4]/30 rounded-xl 
  px-4 md:px-6 py-4 md:py-5 transition-all 
  hover:bg-blue-100/40 hover:border-[#4681F4]/50 
  ${isSubmitting ? "opacity-50" : ""}`}
            >
              <input
                type="file"
                id="fileUpload"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                disabled={isSubmitting}
              />

              {/* Button */}
              <label
                htmlFor="fileUpload"
                className={`bg-white border border-gray-300 rounded-xl 
    px-4 sm:px-5 md:px-6 py-2 
    text-xs sm:text-sm font-semibold text-gray-700 
    cursor-pointer hover:bg-gray-50 transition shadow-sm 
    whitespace-nowrap text-center
    ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                style={isSubmitting ? { pointerEvents: "none" } : {}}
              >
                {formData.evidence_image ? "Change File" : "Choose File"}
              </label>

              {/* File Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-800 font-medium truncate mb-1">
                  {formData.evidence_image
                    ? formData.evidence_image.name
                    : "No file chosen"}
                </p>

                <p className="text-[11px] sm:text-xs text-[#5F6C85] leading-relaxed">
                  Photos of damage, incorrect items, etc. (10KB–2MB)
                </p>
              </div>
            </div>
            {errors.evidence_image && (
              <p className="text-red-500 text-sm mt-2">
                {errors.evidence_image}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-6 py-2.5 cursor-pointer bg-[#EF4444] hover:bg-[#DC3636] text-white font-bold text-base md:text-lg rounded-full transition-colors duration-200 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Dispute"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`flex-1 px-6 py-2.5 cursor-pointer bg-[#E6F0FF] hover:bg-[#D4E4FF] text-black font-bold text-base md:text-lg rounded-full transition-colors duration-200 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFormalCaseModal;
