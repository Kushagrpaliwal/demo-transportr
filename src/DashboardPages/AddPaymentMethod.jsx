import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SaveCardsService } from "../api/services/PaymentsService/Payments";
import { usePopup } from "../context/PopupContext";
import { useNavigate } from "react-router-dom";

const AddPaymentMethod = () => {
  const { showPopup } = usePopup();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    number: "",
    expiryMonth: null,
    expiryYear: null,
    cvc: "",
    country: "",
    postalCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date, fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: date,
    }));
  };

  const handleAddCard = async (e) => {
    e.preventDefault();

    if (!formData.expiryMonth || !formData.expiryYear) {
      showPopup("Please select valid expiry month and year.", "error");
      return;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const selectedMonth = formData.expiryMonth.getMonth() + 1;
    const selectedYear = formData.expiryYear.getFullYear();

    if (
      selectedYear < currentYear ||
      (selectedYear === currentYear && selectedMonth < currentMonth)
    ) {
      showPopup("Expiry date must be in the future.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const month = String(formData.expiryMonth.getMonth() + 1).padStart(
        2,
        "0",
      );
      const year = String(formData.expiryYear.getFullYear());

      const payload = {
        number: formData.number.replace(/\s+/g, ""),
        expiryMonth: month,
        expiryYear: year,
        cvc: formData.cvc,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      const response = await SaveCardsService(payload);
      // console.log("Response:", response);

      showPopup("Card details saved successfully!", "success");

      setFormData({
        firstName: "",
        lastName: "",
        number: "",
        expiryMonth: null,
        expiryYear: null,
        cvc: "",
        country: "",
        postalCode: "",
      });

      setTimeout(() => {
        navigate("/dashboard/payments");
      }, 1000);
    } catch (error) {
      console.error("Error saving card details:", error);
      showPopup("Failed to save card details. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full flex flex-col py-6 px-4 md:px-8">
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl md:text-[32px] font-bold text-black mb-8">
          Card Details
        </h2>

        <form className="w-full flex flex-col gap-6" onSubmit={handleAddCard}>
          <div className="flex flex-col md:flex-row gap-6 w-full">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[15px] ">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                pattern="[A-Za-z\s]{2,50}"
                title="First name must contain only letters and spaces (2-50 characters)"
                placeholder="First Name"
                className="w-full bg-[#EBF3FF] text-black placeholder-[#8CA1C4] rounded-xl px-4 h-[54px] focus:outline-none focus:ring-1 focus:ring-[#4681F4] transition-all"
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[15px] ">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                pattern="[A-Za-z\s]{2,50}"
                title="Last name must contain only letters and spaces (2-50 characters)"
                placeholder="Last Name"
                className="w-full bg-[#EBF3FF] text-black placeholder-[#8CA1C4] rounded-xl px-4 h-[54px] focus:outline-none focus:ring-1 focus:ring-[#4681F4] transition-all"
              />
            </div>
          </div>

          <div className="w-full flex flex-col gap-2">
            <label className="text-[15px] text-black">
              Card Number (with brand detection and spacing)
            </label>
            <input
              type="text"
              name="number"
              value={formData.number}
              onChange={handleInputChange}
              placeholder="Enter Here"
              required
              pattern="[0-9]{16}"
              maxLength="16"
              title="Enter exactly 16 digits"
              className="w-full bg-[#EBF3FF] text-black placeholder-[#8CA1C4] rounded-xl px-4 h-[54px] focus:outline-none focus:ring-1 focus:ring-[#4681F4] transition-all"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6 w-full">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[15px] text-black">Expiry (MM/YY)</label>

              <div className="flex w-full gap-3">
                <div className="flex-1">
                  <DatePicker
                    selected={formData.expiryMonth}
                    onChange={(date) => handleDateChange(date, "expiryMonth")}
                    placeholderText="MM"
                    dateFormat="MM"
                    required
                    min="1"
                    max="12"
                    showMonthYearPicker
                    className="w-full bg-[#EBF3FF] text-black placeholder-[#8CA1C4] rounded-xl px-4 h-[54px] focus:outline-none focus:ring-1 focus:ring-[#4681F4] transition-all"
                  />
                </div>

                <div className="flex-1">
                  <DatePicker
                    selected={formData.expiryYear}
                    onChange={(date) => handleDateChange(date, "expiryYear")}
                    placeholderText="YY"
                    dateFormat="yy"
                    required
                    min="24"
                    max="99"
                    showYearPicker
                    className="w-full bg-[#EBF3FF] text-black placeholder-[#8CA1C4] rounded-xl px-4 h-[54px] focus:outline-none focus:ring-1 focus:ring-[#4681F4] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[15px] text-black">
                CVC (with small help tooltip)
              </label>
              <input
                type="text"
                name="cvc"
                value={formData.cvc}
                onChange={handleInputChange}
                required
                pattern="[0-9]{3,4}"
                maxLength="4"
                inputMode="numeric"
                title="Enter a valid CVC"
                placeholder="Enter Here"
                className="w-full bg-[#EBF3FF] text-black placeholder-[#8CA1C4] rounded-xl px-4 h-[54px] focus:outline-none focus:ring-1 focus:ring-[#4681F4] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 w-full">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[15px] text-black">Country/Region</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="London"
                className="w-full bg-[#EBF3FF] text-black placeholder-[#8CA1C4] rounded-xl px-4 h-[54px] focus:outline-none focus:ring-1 focus:ring-[#4681F4] transition-all"
              />
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[15px] text-black">Postal/ Zip Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="Enter Here"
                pattern="[A-Za-z0-9\s-]{4,10}"
                title="Enter a valid postal code"
                className="w-full bg-[#EBF3FF] text-black placeholder-[#8CA1C4] rounded-xl px-4 h-[54px] focus:outline-none focus:ring-1 focus:ring-[#4681F4] transition-all"
              />
            </div>
          </div>

          <div className="w-full flex justify-center mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-[300px] h-[50px] bg-[#4681F4] text-white font-bold text-lg rounded-full transition-all duration-200 ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-600"}`}
            >
              {isLoading ? "Adding..." : "Add Card Details"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddPaymentMethod;
