import { useState, useEffect } from "react";
import {
  SavePayoutService,
  editPayoutService,
} from "../../api/services/PaymentsService/Payments";
import Popup from "./Popup";

const CreatePayouMethod = ({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  payoutMethod = null,
}) => {
  const [formData, setFormData] = useState({
    bankId: "",
    accountNumber: "",
    name: "",
    bank: "",
  });

  const [errors, setErrors] = useState({
    bankId: "",
    accountNumber: "",
    name: "",
    bank: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [popupTimeout, setPopupTimeout] = useState(null);

  useEffect(() => {
    if (editMode && payoutMethod) {
      setFormData({
        bankId: payoutMethod.bank_id || "",

        accountNumber: "",
        name: payoutMethod.name || "",
        bank: payoutMethod.bank || "",
      });
    } else {
      setFormData({
        bankId: "",
        accountNumber: "",
        name: "",
        bank: "",
      });
    }
  }, [editMode, payoutMethod, isOpen]);

  useEffect(() => {
    if (isOpen && !editMode) {
      setFormData({
        bankId: "",
        accountNumber: "",
        name: "",
        bank: "",
      });
      setErrors({
        bankId: "",
        accountNumber: "",
        name: "",
        bank: "",
      });
    }
  }, [isOpen, editMode]);

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const showPopup = (message, type = "success") => {
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }

    setPopup({
      show: true,
      message,
      type,
    });

    const timeout = setTimeout(() => {
      setPopup((prev) => ({ ...prev, show: false }));
    }, 3000);

    setPopupTimeout(timeout);
  };

  const closePopup = () => {
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }
    setPopup((prev) => ({ ...prev, show: false }));
  };

  const handleMouseEnter = () => {
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setPopup((prev) => ({ ...prev, show: false }));
    }, 3000);

    setPopupTimeout(timeout);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (
      (name === "bankId" || name === "accountNumber") &&
      value !== "" &&
      !/^\d+$/.test(value)
    ) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      bankId: "",
      accountNumber: "",
      name: "",
      bank: "",
    };

    if (!formData.bankId) {
      newErrors.bankId = "Bank ID is required";
      isValid = false;
    } else if (formData.bankId.length !== 6) {
      newErrors.bankId = "Bank ID must be exactly 6 digits";
      isValid = false;
    }

    if (!formData.accountNumber) {
      newErrors.accountNumber = "Account number is required";
      isValid = false;
    } else if (formData.accountNumber.length !== 8) {
      newErrors.accountNumber = "Account number must be exactly 8 digits";
      isValid = false;
    }

    if (!formData.name.trim()) {
      newErrors.name = "Card holder name is required";
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
      isValid = false;
    }

    if (!formData.bank.trim()) {
      newErrors.bank = "Bank name is required";
      isValid = false;
    } else if (formData.bank.trim().length < 2) {
      newErrors.bank = "Bank name must be at least 2 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showPopup("Please fix the validation errors", "error");
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (editMode && payoutMethod) {
        const payoutData = {
          bankId: formData.bankId,
          accountNumber: formData.accountNumber,
          name: formData.name.trim(),
          bank: formData.bank.trim(),
          ryft_payout_method_id: payoutMethod.ryft_payout_method_id,
        };
        response = await editPayoutService(payoutData);
      } else {
        const payoutData = {
          bankIdType: "SortCode",
          accountNumberType: "UnitedKingdom",
          bankId: formData.bankId,
          accountNumber: formData.accountNumber,
          name: formData.name.trim(),
          bank: formData.bank.trim(),
        };
        response = await SavePayoutService(payoutData);
      }

      showPopup(
        editMode
          ? "Payout method updated successfully!"
          : "Payout method added successfully!",
        "success",
      );

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Error saving payout method:", error);

      const errorMessage =
        error.response?.data?.message ||
        `Failed to ${editMode ? "update" : "add"} payout method. Please try again.`;
      showPopup(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {popup.show && (
        <Popup
          message={popup.message}
          type={popup.type}
          onClose={closePopup}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="bg-[#E6F0FF] rounded-2xl w-[90%] max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-xl font-bold cursor-pointer hover:text-gray-700"
            aria-label="Close modal"
          >
            ✕
          </button>

          <h2 className="text-[24px] font-semibold text-center">
            {editMode ? "Edit Payout Method" : "Add Payout Method"}
          </h2>

          <p className="text-center text-gray-500 font-normal text-sm mt-2">
            {editMode
              ? "Update your bank account details below"
              : "Add your bank account details to receive payouts"}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mt-4">
              <label className="text-[14px] font-normal">
                Card Holder Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter card holder name"
                required
                className={`w-full mt-2 border outline-none border-white rounded-[10px] py-4 px-2 bg-[#D0E3FF] focus:ring-2 focus:ring-[#4681F4] ${
                  errors.name ? "ring-2 ring-red-500" : ""
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="text-[14px] font-normal">Bank Name *</label>
              <input
                type="text"
                name="bank"
                value={formData.bank}
                onChange={handleInputChange}
                placeholder="Enter bank name"
                required
                className={`w-full mt-2 border outline-none border-white rounded-[10px] py-4 px-2 bg-[#D0E3FF] focus:ring-2 focus:ring-[#4681F4] ${
                  errors.bank ? "ring-2 ring-red-500" : ""
                }`}
              />
              {errors.bank && (
                <p className="text-red-500 text-xs mt-1">{errors.bank}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="text-[14px] font-normal">
                Bank ID (Sort Code) *
              </label>
              <input
                type="text"
                name="bankId"
                value={formData.bankId}
                onChange={handleInputChange}
                placeholder="Enter 6-digit Sort Code"
                required
                maxLength="6"
                className={`w-full mt-2 border outline-none border-white rounded-[10px] py-4 px-2 bg-[#D0E3FF] focus:ring-2 focus:ring-[#4681F4] ${
                  errors.bankId ? "ring-2 ring-red-500" : ""
                }`}
              />
              {errors.bankId && (
                <p className="text-red-500 text-xs mt-1">{errors.bankId}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="text-[14px] font-normal">
                Bank Account Number *
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder={
                  editMode
                    ? "Enter full 8-digit account number"
                    : "Enter 8-digit account number"
                }
                required
                maxLength="8"
                className={`w-full mt-2 border outline-none border-white rounded-[10px] py-4 px-2 bg-[#D0E3FF] focus:ring-2 focus:ring-[#4681F4] ${
                  errors.accountNumber ? "ring-2 ring-red-500" : ""
                }`}
              />
              {editMode && !formData.accountNumber && (
                <p className="text-amber-600 text-xs mt-1">
                  ⓘ Please enter your full 8-digit account number (only last 4
                  digits are shown for security)
                </p>
              )}
              {errors.accountNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.accountNumber}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-blue-500 hover:bg-blue-700 cursor-pointer text-white py-3 rounded-full font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? editMode
                  ? "Updating..."
                  : "Adding..."
                : editMode
                  ? "Update Payout Method"
                  : "Add Payout Method"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full mt-4 border py-3 rounded-full font-bold text-xl bg-[#D0E3FF] hover:bg-blue-300 border-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreatePayouMethod;
