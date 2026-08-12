import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createNewTravelPlanService,
  editTravelPlansService,
  viewTravelPlansService,
} from "../api/services/TravelPlansService/Travelplan";
import Popup from "../components/Common/Popup";
import CompleteVerficationBanner from "../components/Dashboard/CompleteVerficationBanner";
import { useProfile } from "../context/ProfileContext";
import { checkPayoutService } from "../api/services/PaymentsService/Payments";
import CreatePayouMethod from "../components/Common/CreatePayoutMethod";

const spaces = [
  "Small Items (e.g., envelope-sized)",
  "Medium Items (e.g., backpack-sized)",
  "Large Items (e.g., suitcase-sized)",
];

const times = [
  "Morning (8am-12pm)",
  "Afternoon (12pm-5pm)",
  "Evening (5pm-10pm)",
];

const NewTravellerPage = () => {
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departure_date: "",
    estimated_arrival_date: "",
    available_space: "",
    estimated_arrival_time: "",
    rate_small: "",
    rate_medium: "",
    rate_large: "",
    notes: "",
    origin_postcode: "",
    destination_postcode: "",
    origin_city: "",
    destination_city: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [travelId, setTravelId] = useState(null);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [hasPayoutMethod, setHasPayoutMethod] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [isCheckingPayout, setIsCheckingPayout] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(false);
  const [confirmTrip, setConfirmTrip] = useState(false);

  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const popupTimeoutRef = useRef(null);
  const bannerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const result = useProfile() || {};
  const profile = result?.profile || {};
  const data = profile?.data || {};

  const needsVerification = () => {
    return (
      !data?.verification ||
      data?.verification?.status === "PendingVerification" ||
      data?.verification?.status === "Pending"
    );
  };

  useEffect(() => {
    if (showVerificationBanner && bannerRef.current) {
      bannerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showVerificationBanner]);

  useEffect(() => {
    const state = location.state;
    if (state?.travel_id) {
      setTravelId(state.travel_id);
      if (state?.mode === "view") {
        setIsViewMode(true);
        setIsEditMode(false);
      } else {
        setIsEditMode(true);
        setIsViewMode(false);
      }
      fetchTravelPlanDetails(state.travel_id);
    }
    checkPayoutStatus();
  }, [location]);

  const checkPayoutStatus = async () => {
    setIsCheckingPayout(true);
    try {
      const response = await checkPayoutService();
      if (response.data.success) {
        setHasPayoutMethod(response.data.hasPayoutMethod);
      }
    } catch (error) {
      console.error("Error checking payout status:", error);
    } finally {
      setIsCheckingPayout(false);
    }
  };

  const extractCityFromAddressComponents = (addressComponents) => {
    if (!addressComponents) return "";

    const localityComponent = addressComponents.find(
      (component) =>
        component.types.includes("locality") ||
        component.types.includes("postal_town") ||
        component.types.includes("administrative_area_level_3"),
    );

    if (localityComponent) {
      return localityComponent.long_name;
    }

    if (addressComponents.length > 0) {
      return addressComponents[0].long_name;
    }

    return "";
  };

  const fetchTravelPlanDetails = async (id) => {
    setFetchLoading(true);
    try {
      const response = await viewTravelPlansService(id);
      if (response.data.success) {
        const travelData = response.data.travel_plan;
        const availableSpace = spaces.includes(travelData.available_space)
          ? travelData.available_space
          : "";

        const estimatedTime = times.includes(travelData.estimated_arrival_time)
          ? travelData.estimated_arrival_time
          : "";

        setFormData({
          origin: travelData.origin || "",
          destination: travelData.destination || "",
          departure_date: travelData.departure_date || "",
          estimated_arrival_date: travelData.estimated_arrival_date || "",
          available_space: availableSpace,
          estimated_arrival_time: estimatedTime,
          rate_small: travelData.rate_small || "",
          rate_medium: travelData.rate_medium || "",
          rate_large: travelData.rate_large || "",
          notes: travelData.notes || "",
          origin_postcode: travelData.origin_postcode || "",
          destination_postcode: travelData.destination_postcode || "",
          // origin_city: travelData.origin_city || "",
          // destination_city: travelData.destination_city || "",
        });
      } else {
        showPopup(
          response.data.message || "Error fetching travel plan details",
          "error",
        );
      }
    } catch (error) {
      console.error("Error fetching travel plan details:", error);
      showPopup(
        "Something went wrong while fetching travel plan details",
        "error",
      );
    } finally {
      setFetchLoading(false);
    }
  };

  const extractPostcode = (addressComponents) => {
    if (!addressComponents) return "";
    const postalCodeComponent = addressComponents.find(
      (component) =>
        component.types.includes("postal_code") ||
        component.types.includes("postal_code_prefix") ||
        component.types.includes("postal_code_suffix"),
    );

    if (postalCodeComponent) {
      return postalCodeComponent.long_name;
    }

    return "";
  };

  const getPlaceDetails = (placeId, callback) => {
    if (!window.google || !placeId) return;

    const placesService = new window.google.maps.places.PlacesService(
      document.createElement("div"),
    );

    placesService.getDetails(
      {
        placeId: placeId,
        fields: ["address_components", "formatted_address", "geometry"],
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          callback(place);
        }
      },
    );
  };

  useEffect(() => {
    if (isViewMode) return;

    const initializeAutocomplete = () => {
      if (window.google && originInputRef.current) {
        const originAutocomplete = new window.google.maps.places.Autocomplete(
          originInputRef.current,
          {
            types: ["address"],
            componentRestrictions: { country: "gb" },
            fields: ["address_components", "formatted_address", "place_id"],
          },
        );

        originAutocomplete.addListener("place_changed", () => {
          const place = originAutocomplete.getPlace();

          if (place.place_id) {
            getPlaceDetails(place.place_id, (detailedPlace) => {
              const postcode = extractPostcode(
                detailedPlace.address_components,
              );
              const city = extractCityFromAddressComponents(
                detailedPlace.address_components,
              );

              setFormData((prev) => ({
                ...prev,
                origin: detailedPlace.formatted_address || "",
                origin_postcode: postcode || "",
                origin_city: city || "",
              }));
            });
          } else {
            const postcode = extractPostcode(place.address_components);
            const city = extractCityFromAddressComponents(
              place.address_components,
            );

            setFormData((prev) => ({
              ...prev,
              origin: place.formatted_address || "",
              origin_postcode: postcode || "",
              origin_city: city || "",
            }));
          }
        });
      }

      if (window.google && destinationInputRef.current) {
        const destinationAutocomplete =
          new window.google.maps.places.Autocomplete(
            destinationInputRef.current,
            {
              types: ["address"],
              componentRestrictions: { country: "gb" },
              fields: ["address_components", "formatted_address", "place_id"],
            },
          );

        destinationAutocomplete.addListener("place_changed", () => {
          const place = destinationAutocomplete.getPlace();

          if (place.place_id) {
            getPlaceDetails(place.place_id, (detailedPlace) => {
              const postcode = extractPostcode(
                detailedPlace.address_components,
              );
              const city = extractCityFromAddressComponents(
                detailedPlace.address_components,
              );

              setFormData((prev) => ({
                ...prev,
                destination: detailedPlace.formatted_address || "",
                destination_postcode: postcode || "",
                destination_city: city || "",
              }));
            });
          } else {
            const postcode = extractPostcode(place.address_components);
            const city = extractCityFromAddressComponents(
              place.address_components,
            );

            setFormData((prev) => ({
              ...prev,
              destination: place.formatted_address || "",
              destination_postcode: postcode || "",
              destination_city: city || "",
            }));
          }
        });
      }
    };

    const timer = setTimeout(initializeAutocomplete, 500);

    return () => {
      clearTimeout(timer);
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, [isViewMode, formData.origin, formData.destination]);

  const showPopup = (message, type = "success") => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }

    setPopup({ show: true, message, type });

    popupTimeoutRef.current = setTimeout(() => {
      setPopup((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleClosePopup = () => {
    setPopup((prev) => ({ ...prev, show: false }));
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
  };

  const handlePopupMouseEnter = () => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
  };

  const handlePopupMouseLeave = () => {
    popupTimeoutRef.current = setTimeout(() => {
      setPopup((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      name === "rate_small" ||
      name === "rate_medium" ||
      name === "rate_large"
    ) {
      if (!/^\d*\.?\d{0,2}$/.test(value)) return;
    }

    if (name === "origin") {
      setFormData((prev) => ({
        ...prev,
        origin: value,
        origin_postcode: "",
        origin_city: "",
      }));
      setErrors((prev) => ({ ...prev, origin: "", origin_postcode: "" }));
      return;
    }

    if (name === "destination") {
      setFormData((prev) => ({
        ...prev,
        destination: value,
        destination_postcode: "",
        destination_city: "",
      }));
      setErrors((prev) => ({
        ...prev,
        destination: "",
        destination_postcode: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAddressKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.origin) newErrors.origin = "Origin is required";
    if (!formData.destination)
      newErrors.destination = "Destination is required";
    if (!formData.departure_date)
      newErrors.departure_date = "Departure date is required";
    if (!formData.estimated_arrival_date)
      newErrors.estimated_arrival_date = "Estimated arrival date is required";
    if (!formData.available_space)
      newErrors.available_space = "Available space is required";
    if (!formData.estimated_arrival_time)
      newErrors.estimated_arrival_time = "Estimated arrival time is required";

    if (!formData.origin_postcode)
      newErrors.origin_postcode = "Origin postcode is required";
    if (!formData.destination_postcode)
      newErrors.destination_postcode = "Destination postcode is required";
    if (!formData.rate_small) newErrors.rate_small = "Small rate is required";
    if (!formData.rate_medium)
      newErrors.rate_medium = "Medium rate is required";
    if (!formData.rate_large) newErrors.rate_large = "Large rate is required";

    if (formData.departure_date && formData.estimated_arrival_date) {
      if (
        new Date(formData.estimated_arrival_date) <
        new Date(formData.departure_date)
      ) {
        newErrors.estimated_arrival_date =
          "Arrival date must be after departure date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayoutModalClose = () => {
    setShowPayoutModal(false);
    setPendingSubmission(false);
    checkPayoutStatus();
  };

  const handlePayoutSuccess = () => {
    setShowPayoutModal(false);
    setHasPayoutMethod(true);

    if (pendingSubmission) {
      setPendingSubmission(false);
      executeSubmitTravelPlan();
    }
  };

  const executeSubmitTravelPlan = async () => {
    setLoading(true);

    const payload = {
      origin: formData.origin,
      destination: formData.destination,
      departure_date: formData.departure_date,
      estimated_arrival_date: formData.estimated_arrival_date,
      available_space: formData.available_space,
      estimated_arrival_time: formData.estimated_arrival_time,
      rate_small: formData.rate_small ? parseFloat(formData.rate_small) : null,
      rate_medium: formData.rate_medium
        ? parseFloat(formData.rate_medium)
        : null,
      rate_large: formData.rate_large ? parseFloat(formData.rate_large) : null,
      notes: formData.notes || "",
      origin_postcode: formData.origin_postcode,
      destination_postcode: formData.destination_postcode,
      // origin_city: formData.origin_city,
      // destination_city: formData.destination_city,
    };

    try {
      let response;

      if (isEditMode && travelId) {
        response = await editTravelPlansService(travelId, payload);
      } else if (!isViewMode) {
        response = await createNewTravelPlanService(payload);
      }

      if (response?.data.success) {
        showPopup(
          isEditMode
            ? "Travel plan updated successfully!"
            : "Travel plan created successfully!",
          "success",
        );

        setFormData({
          origin: "",
          destination: "",
          departure_date: "",
          estimated_arrival_date: "",
          available_space: "",
          estimated_arrival_time: "",
          rate_small: "",
          rate_medium: "",
          rate_large: "",
          notes: "",
          origin_postcode: "",
          destination_postcode: "",
          origin_city: "",
          destination_city: "",
        });
        setTimeout(() => {
          navigate("/dashboard/my-travels");
        }, 2000);
      } else {
        showPopup(
          response?.data.message ||
            `Error ${isEditMode ? "updating" : "creating"} travel plan`,
          "error",
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} travel plan:`,
        error,
      );
      showPopup(
        `Something went wrong while ${isEditMode ? "updating" : "creating"} the travel plan`,
        "error",
      );
    } finally {
      setLoading(false);
      setConfirmTrip(false);
    }
  };

  const submitTravelPlan = async () => {
    if (!confirmTrip) {
      setConfirmTrip(true);
      return;
    }

    await executeSubmitTravelPlan();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showPopup("Please fill in all required fields correctly", "error");
      return;
    }
    if (!isEditMode && !isViewMode && needsVerification()) {
      setShowVerificationBanner(true);
      return;
    }

    if (
      !isCheckingPayout &&
      hasPayoutMethod === false &&
      !isViewMode &&
      !isEditMode
    ) {
      setPendingSubmission(true);
      setShowPayoutModal(true);
      return;
    }

    await submitTravelPlan();
  };

  const handleConfirmAndList = () => {
    setConfirmTrip(false);
    executeSubmitTravelPlan();
  };

  const today = new Date().toISOString().split("T")[0];

  const formatDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  if (fetchLoading || isCheckingPayout) {
    return (
      <section className="w-full flex flex-col items-center justify-center py-8 px-2 min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4681F4] border-r-transparent"></div>
          <p className="mt-4 text-[#5F6C85]">
            {isCheckingPayout
              ? "Checking payout status..."
              : "Loading travel plan details..."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex flex-col items-center py-8 px-2">
      {/* Custom styles for number input */}
      <style>
        {`
          input[type='number'].custom-number-input::-webkit-inner-spin-button,
          input[type='number'].custom-number-input::-webkit-outer-spin-button,
          .custom-number-input[type='number']::-webkit-inner-spin-button,
          .custom-number-input[type='number']::-webkit-outer-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
          }
          
          input[type='number'].custom-number-input,
          .custom-number-input[type='number'] {
            -moz-appearance: textfield !important;
            appearance: textfield !important;
          }
        `}
      </style>

      {popup.show && (
        <Popup
          message={popup.message}
          type={popup.type}
          onClose={handleClosePopup}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        />
      )}

      <CreatePayouMethod
        isOpen={showPayoutModal}
        onClose={handlePayoutModalClose}
        onSuccess={handlePayoutSuccess}
      />

      {showVerificationBanner && (
        <div ref={bannerRef} className="mb-6 w-full">
          <CompleteVerficationBanner />
        </div>
      )}

      <div className="w-full mx-auto">
        <h2 className="text-2xl md:text-[32px] text-center md:text-left font-semibold text-black mb-2">
          {isViewMode
            ? "View Travel Plan"
            : isEditMode
              ? "Edit Travel Plan"
              : "Add New Travel Plan"}
        </h2>
        <p className="text-[#5F6C85] text-base text-center md:text-left md:text-lg mb-8">
          {isViewMode
            ? "View your travel plan details below."
            : isEditMode
              ? "Update your travel plan details below."
              : "List your upcoming trips to carry packages for others. Set your prices to attract senders."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-black text-base font-medium mb-2">
                Origin *
              </label>
              <input
                ref={originInputRef}
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                onKeyDown={handleAddressKeyDown}
                readOnly={isViewMode}
                placeholder={isViewMode ? "" : "e.g., 123 Southwood Hall"}
                className={`w-full bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-3 text-black text-base outline-none ${isViewMode ? "cursor-default opacity-75" : ""}`}
              />
              {errors.origin && (
                <p className="text-red-500 text-sm mt-1">{errors.origin}</p>
              )}
            </div>
            <div>
              <label className="block text-black text-base font-medium mb-2">
                Destination *
              </label>
              <input
                ref={destinationInputRef}
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                onKeyDown={handleAddressKeyDown}
                readOnly={isViewMode}
                placeholder={isViewMode ? "" : "e.g., 123 Southwall Hall"}
                className={`w-full bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-3 text-black text-base outline-none ${isViewMode ? "cursor-default opacity-75" : ""}`}
              />
              {errors.destination && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.destination}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-black text-base font-medium mb-2">
                Origin Postcode *
              </label>
              <input
                type="text"
                name="origin_postcode"
                value={formData.origin_postcode}
                onChange={handleChange}
                readOnly={isViewMode}
                disabled={isViewMode || !formData.origin.trim()}
                placeholder={isViewMode ? "" : "e.g., W1A 0AX"}
                className={`w-full bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-3 text-base outline-none ${isViewMode || !formData.origin.trim() ? "text-gray-600 cursor-not-allowed opacity-75" : "text-black"}`}
              />
              {errors.origin_postcode && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.origin_postcode}
                </p>
              )}
            </div>
            <div>
              <label className="block text-black text-base font-medium mb-2">
                Destination Postcode *
              </label>
              <input
                type="text"
                name="destination_postcode"
                value={formData.destination_postcode}
                onChange={handleChange}
                readOnly={isViewMode}
                disabled={isViewMode || !formData.destination.trim()}
                placeholder={isViewMode ? "" : "e.g., W1A 0AX"}
                className={`w-full bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-3 text-base outline-none ${isViewMode || !formData.destination.trim() ? "text-gray-600 cursor-not-allowed opacity-75" : "text-black"}`}
              />
              {errors.destination_postcode && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.destination_postcode}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-black text-base font-medium mb-2">
                Departure Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="departure_date"
                  min={today}
                  value={formData.departure_date}
                  onChange={handleChange}
                  readOnly={isViewMode}
                  disabled={isViewMode}
                  placeholder="DD/MM/YYYY"
                  className={`w-full placeholder:uppercase uppercase  bg-[#E6F0FF] rounded-xl px-4 py-3 text-black h-10 md:h-[50px] text-base outline-none ${isViewMode ? "cursor-default opacity-75" : ""}`}
                />
              </div>
              {errors.departure_date && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.departure_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-black text-base font-medium mb-2">
                Estimated Arrival Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="estimated_arrival_date"
                  min={formData.departure_date || today}
                  value={formData.estimated_arrival_date}
                  onChange={handleChange}
                  readOnly={isViewMode}
                  disabled={isViewMode}
                  className={`w-full bg-[#E6F0FF] uppercase rounded-xl px-4 py-3 h-10 md:h-[50px] text-black text-base outline-none ${isViewMode ? "cursor-default opacity-75" : ""}`}
                />
              </div>
              {errors.estimated_arrival_date && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.estimated_arrival_date}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-black text-base font-medium mb-2">
                Available Space *
              </label>
              <select
                name="available_space"
                value={formData.available_space}
                onChange={handleChange}
                disabled={isViewMode}
                className={`w-full bg-[#E6F0FF] rounded-xl px-4 py-3 text-black text-base outline-none ${isViewMode ? "cursor-default opacity-75" : ""}`}
              >
                <option value="" disabled>
                  Select available space
                </option>
                {spaces.map((sz, i) => (
                  <option key={i} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
              {errors.available_space && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.available_space}
                </p>
              )}
            </div>
            <div>
              <label className="block text-black text-base font-medium mb-2">
                Estimated Arrival Time *
              </label>
              <select
                name="estimated_arrival_time"
                value={formData.estimated_arrival_time}
                onChange={handleChange}
                disabled={isViewMode}
                className={`w-full bg-[#E6F0FF] rounded-xl px-4 py-3 text-black text-base outline-none ${isViewMode ? "cursor-default opacity-75" : ""}`}
              >
                <option value="" disabled>
                  Select arrival time
                </option>
                {times.map((t, i) => (
                  <option key={i} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.estimated_arrival_time && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.estimated_arrival_time}
                </p>
              )}
            </div>
          </div>

          <hr className="border-[#D6D6D6] my-2" />

          <div>
            <h3 className="md:text-xl text-base font-semibold text-black mb-2">
              Your Rates
            </h3>
            <p className="text-black text-base md:text-lg mb-4">
              Set prices for different package sizes to get booking requests
              faster.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block text-black text-base font-medium mb-2">
                  Small Items (£)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    £
                  </span>
                  <input
                    type="number"
                    name="rate_small"
                    step="0.01"
                    min="0"
                    value={formData.rate_small}
                    onChange={handleChange}
                    readOnly={isViewMode}
                    disabled={isViewMode}
                    onWheel={(e) => e.target.blur()}
                    placeholder={isViewMode ? "" : "e.g., 10"}
                    className={`w-full bg-[#E6F0FF] h-10 md:h-[50px] rounded-xl pl-8 pr-4 py-3 text-black text-base outline-none custom-number-input ${isViewMode ? "cursor-default opacity-75" : ""}`}
                  />
                </div>
                {errors.rate_small && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.rate_small}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-black text-base font-medium mb-2">
                  Medium Items (£)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    £
                  </span>
                  <input
                    type="number"
                    name="rate_medium"
                    step="0.01"
                    min="0"
                    value={formData.rate_medium}
                    onChange={handleChange}
                    readOnly={isViewMode}
                    disabled={isViewMode}
                    onWheel={(e) => e.target.blur()}
                    placeholder={isViewMode ? "" : "e.g., 25"}
                    className={`w-full bg-[#E6F0FF] h-10 md:h-[50px] rounded-xl pl-8 pr-4 py-3 text-black text-base outline-none custom-number-input ${isViewMode ? "cursor-default opacity-75" : ""}`}
                  />
                </div>
                {errors.rate_medium && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.rate_medium}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-black text-base font-medium mb-2">
                  Large Items (£)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    £
                  </span>
                  <input
                    type="number"
                    name="rate_large"
                    step="0.01"
                    min="0"
                    value={formData.rate_large}
                    onChange={handleChange}
                    readOnly={isViewMode}
                    disabled={isViewMode}
                    onWheel={(e) => e.target.blur()}
                    placeholder={isViewMode ? "" : "e.g., 50"}
                    className={`w-full bg-[#E6F0FF] h-10 md:h-[50px] rounded-xl pl-8 pr-4 py-3 text-black text-base outline-none custom-number-input ${isViewMode ? "cursor-default opacity-75" : ""}`}
                  />
                </div>
                {errors.rate_large && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.rate_large}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-[#E6F0FF] rounded-xl p-4 flex items-start gap-3 mb-4">
              <img src="/await.svg" alt="await" />
              <div>
                <div className="font-bold text-base text-[#4681F4] mb-2">
                  How Your Earnings Work
                </div>
                <div className="text-sm text-[#4681F4]">
                  The prices you set here are what the sender will pay. A
                  Transportr service fee (typically 10-15%) will be deducted
                  from this amount upon successful delivery. Pro members enjoy
                  lower fees.
                </div>
              </div>
            </div>
          </div>

          <hr className="border-[#D6D6D6] my-2" />

          <div>
            <label className="block text-black text-base font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              readOnly={isViewMode}
              disabled={isViewMode}
              placeholder={
                isViewMode
                  ? ""
                  : "e.g., Specific route details, preferred package types, contact info"
              }
              className={`w-full bg-[#E6F0FF] resize-none rounded-xl px-4 py-3 text-black text-base outline-none min-h-[60px] ${isViewMode ? "cursor-default opacity-75" : ""}`}
            />
          </div>

          {/* confirm modal */}
          {confirmTrip && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="w-[420px] bg-[#E9EEF6] rounded-3xl p-6 shadow-md">
                <h2 className="text-2xl font-semibold text-center mb-2">
                  Confirm Your Trip
                </h2>

                <p className="text-center text-gray-500 text-sm mb-6">
                  Please review your travel plan details below. Does everything
                  look correct?
                </p>

                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="font-semibold">
                      {formData.origin_city || formData.origin}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {formData.origin_postcode}
                    </p>
                  </div>

                  <span className="text-xl">→</span>

                  <div className="text-right">
                    <p className="font-semibold">
                      {formData.destination_city || formData.destination}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {formData.destination_postcode}
                    </p>
                  </div>
                </div>

                <div className="bg-[#DCE6F5] rounded-2xl p-4 mb-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">Departure</p>
                      <p className="text-gray-600 text-sm">
                        {formatDate(formData.departure_date)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">Arrival</p>
                      <p className="text-gray-600 text-sm">
                        {formatDate(formData.estimated_arrival_date)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        ({formData.estimated_arrival_time})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#DCE6F5] rounded-2xl p-4 mb-6">
                  <p className="font-semibold mb-3">Rates:</p>

                  <div className="flex justify-between text-center">
                    <div>
                      <p className="font-semibold">
                        £ {formData.rate_small || 0}
                      </p>
                      <p className="text-gray-500 text-sm">Small</p>
                    </div>

                    <div>
                      <p className="font-semibold">
                        £ {formData.rate_medium || 0}
                      </p>
                      <p className="text-gray-500 text-sm">Medium</p>
                    </div>

                    <div>
                      <p className="font-semibold">
                        £ {formData.rate_large || 0}
                      </p>
                      <p className="text-gray-500 text-sm">Large</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirmAndList}
                  className="w-full bg-blue-500 text-white py-3 rounded-full font-semibold mb-3 hover:bg-blue-600 transition"
                >
                  Confirm & List Trip
                </button>

                <button
                  onClick={() => setConfirmTrip(false)}
                  className="w-full py-3 rounded-full bg-[#DCE6F5] border border-gray-300 hover:bg-[#d0dbef]"
                >
                  Go Back & Edit
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 mt-4">
            {!isViewMode && (
              <button
                type="submit"
                disabled={loading}
                className="bg-[#4681F4] w-full md:w-[274px] h-[50px] hover:bg-white hover:text-[#4681F4] border border-[#4681F4] text-white font-bold cursor-pointer rounded-full text-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update Travel Plan"
                    : "Add Travel Plan"}
              </button>
            )}

            {(isViewMode || isEditMode) && (
              <button
                type="button"
                onClick={() => navigate("/dashboard/my-travels")}
                className={`${isViewMode ? "bg-[#4681F4] w-full md:w-[274px]" : "bg-gray-500 w-full md:w-[274px]"} h-[50px] hover:bg-opacity-80 text-white font-bold cursor-pointer rounded-full text-xl transition-all duration-300`}
              >
                {isViewMode ? "Back to My Travels" : "Cancel"}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};

export default NewTravellerPage;
