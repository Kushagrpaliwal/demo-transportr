/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import {
  createSendPackageService,
  PackageQuoteService,
  packageFeeStatusService,
  searchUsersService,
  editSendPackageService,
  getSingleSendRequestsService,
} from "../api/services/SendRequestsService/SendRequests";
import {
  parseInsuranceFeeConfig,
  calcInsuranceFee,
} from "../utils/insuranceCost";
import Popup from "../components/Common/Popup";
import CompleteVerficationBanner from "../components/Dashboard/CompleteVerficationBanner";
import { useProfile } from "../context/ProfileContext";
import { Camera, ShieldCheck, Check, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const packageSizes = ["Small", "Medium", "Large"];

const sizeToApiValue = {
  Small: "Small",
  Medium: "Medium",
  Large: "Large",
};

const SAME_LOCATION_MSG = "Origin & destination cannot be the same";
const CITY_CHANGE_MSG = "You cannot change the city";

const isSameOriginAndDestination = (origin, destination) => {
  const normalizedOrigin = origin.trim().toLowerCase();
  const normalizedDestination = destination.trim().toLowerCase();
  return (
    normalizedOrigin &&
    normalizedDestination &&
    normalizedOrigin === normalizedDestination
  );
};

const normalizeCity = (city) => (city || "").trim().toLowerCase();

const isCityAllowed = (city, lockedCity) => {
  if (!lockedCity) return true;
  return normalizeCity(city) === normalizeCity(lockedCity);
};

const RECIPIENT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UK_MOBILE_REGEX = /^\+44\d{10}$/;
const UK_MOBILE_MAX_LENGTH = 13;

const looksLikeEmailInput = (value) => /[a-zA-Z@.]/.test(value);

const looksLikePhoneInput = (value) => /^\+?\d*$/.test(value);

const getRecipientEmailError = (value, partial = false) => {
  const email = value.trim();

  if (!email.includes("@")) {
    if (!/^[a-zA-Z0-9._%+-]*$/.test(email)) {
      return "Email contains invalid characters";
    }
    return partial ? "" : "Email must include @ symbol";
  }

  const parts = email.split("@");
  if (parts.length > 2) return "Email can only contain one @ symbol";

  const [local, domain] = parts;
  if (!local) return "Enter the part before @";
  if (!/^[a-zA-Z0-9._%+-]+$/.test(local)) {
    return "Email address contains invalid characters before @";
  }
  if (!domain) return partial ? "" : "Enter the domain after @";
  if (!domain.includes(".")) {
    return "Email domain must include a dot (e.g. example.com)";
  }

  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return "Enter a valid domain extension (e.g. .com)";
  }
  if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
    return "Email domain contains invalid characters";
  }

  if (!RECIPIENT_EMAIL_REGEX.test(email)) {
    return "Enter a valid email address";
  }

  return "";
};

const getUkMobileError = (value, partial = false) => {
  const phone = value.trim();

  if (!looksLikePhoneInput(phone)) {
    return "Phone number can only contain + and digits";
  }

  if (!phone.startsWith("+")) {
    return "Mobile number must start with +44 (e.g. +447123456789)";
  }

  if (!phone.startsWith("+44")) {
    if ("+44".startsWith(phone)) {
      return partial ? "" : "Mobile number must start with +44";
    }
    return "Mobile number must start with +44 (e.g. +447123456789)";
  }

  const subscriberNumber = phone.slice(3);
  if (subscriberNumber.length > 10) {
    return "Mobile number must be +44 followed by 10 digits";
  }

  if (subscriberNumber.length < 10) {
    return partial
      ? `Enter 10 digits after +44 (${subscriberNumber.length}/10)`
      : "Mobile number must be +44 followed by 10 digits (e.g. +447123456789)";
  }

  if (!UK_MOBILE_REGEX.test(phone)) {
    return "Enter a valid Mobile number (+44 followed by 10 digits)";
  }

  return "";
};

const getRecipientContactError = (value, { partial = false } = {}) => {
  const trimmed = value.trim();
  if (!trimmed) return partial ? "" : "Recipient contact is required";

  if (looksLikeEmailInput(trimmed)) {
    return getRecipientEmailError(trimmed, partial);
  }

  if (looksLikePhoneInput(trimmed)) {
    return getUkMobileError(trimmed, partial);
  }

  return "Enter a valid email address or Mobile number (+44 followed by 10 digits)";
};

const extractCityFromAddress = (address, postcode) => {
  if (!address) return "";

  if (postcode) {
    const postcodeIndex = address.indexOf(postcode);
    if (postcodeIndex > 0) {
      const beforePostcode = address.substring(0, postcodeIndex).trim();
      const parts = beforePostcode.split(",");
      const lastPart = parts[parts.length - 1]?.trim();
      if (lastPart && !lastPart.includes("UK")) {
        return lastPart;
      }
    }
  }

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    let cityPart = parts[parts.length - 2];
    cityPart = cityPart
      .replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i, "")
      .trim();
    if (cityPart.includes("UK")) {
      cityPart = parts[parts.length - 3] || cityPart;
    }
    return cityPart;
  }

  return parts[0] || "";
};

const getTravelerCity = (
  travelerData,
  cityField,
  addressField,
  postcodeField,
) => {
  if (!travelerData) return "";
  if (travelerData[cityField]) return travelerData[cityField].trim();
  if (travelerData[addressField]) {
    return extractCityFromAddress(
      travelerData[addressField],
      travelerData[postcodeField],
    );
  }
  return "";
};

const SendPackage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const travelerData = location.state?.travelerData;
  const editPackageId = location.state?.id;
  const isEditMode = !!editPackageId;
  const isBookingWithTraveler = !!(travelerData && !isEditMode);
  const lockedOriginCity = isBookingWithTraveler
    ? getTravelerCity(travelerData, "origin_city", "origin", "origin_postcode")
    : "";
  const lockedDestinationCity = isBookingWithTraveler
    ? getTravelerCity(
        travelerData,
        "destination_city",
        "destination",
        "destination_postcode",
      )
    : "";

  console.log("travelerData", location.state);

  const getAvailablePackageSizes = () => {
    if (!travelerData || !travelerData.available_space) return packageSizes;
    const spaceStr = travelerData.available_space.toLowerCase();
    if (spaceStr.includes("small")) return [packageSizes[0]];
    if (spaceStr.includes("medium")) return [packageSizes[0], packageSizes[1]];
    return packageSizes;
  };
  const availableSizeOptions = getAvailablePackageSizes();

  const [size, setSize] = useState("");
  const [recipientType, setRecipientType] = useState("auto");
  const [recipientSearchQuery, setRecipientSearchQuery] = useState("");
  const [fragile, setFragile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const popupTimeoutRef = useRef(null);
  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const bannerRef = useRef(null);
  const [insurance, setInsurance] = useState(false);
  const [rush, setRush] = useState(false);
  const [quote, setQuote] = useState(0);
  const [quoteFailed, setQuoteFailed] = useState(false);
  const [quoteReceived, setQuoteReceived] = useState(false);
  const [fee, setFee] = useState(0);
  const [insuranceFee, setInsuranceFee] = useState({
    amount: 0,
    percentage: 0,
    hide: true,
  });
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);
  const userSearchDebounceRef = useRef(null);
  const userSearchRequestIdRef = useRef(0);
  const quoteDebounceRef = useRef(null);
  const quoteRequestIdRef = useRef(0);
  const [formData, setFormData] = useState({
    origin: "",
    origin_city: lockedOriginCity,
    origin_postalcode: "",
    destination: "",
    destination_city: lockedDestinationCity,
    destination_postalcode: "",
    contents: travelerData?.contents || "",
    weight: travelerData?.weight || "",
    pickup_date:
      travelerData?.departure_date || travelerData?.pickup_date || "",
    notes: travelerData?.notes || "",
    offer: travelerData?.offer || "",
    declared_value: "",
    insurance_premium: "",
    recipient_name: "",
    recipient_contact: "",
    recipient_id: "",
    traveller_id: travelerData?.user_id || travelerData?.sender_id || "",
    travel_plan_id: travelerData?.id || travelerData?.package_id || "",
    package_img: "",
  });

  const [confirmrequest, Setconfirmrequest] = useState(false);
  const [requestSent, SetrequestSent] = useState(false);
  const [insure, setInsure] = useState(null);
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

  const fetchPackageData = async () => {
    if (!editPackageId) return;

    try {
      setLoading(true);
      const res = await getSingleSendRequestsService(editPackageId);
      const packageData = res?.data?.shipment;
      // console.log("Package data for edit:", packageData);

      if (packageData) {
        const packageSize = packageData.size;
        if (packageSize === "Small") setSize("Small");
        else if (packageSize === "Medium") setSize("Medium");
        else if (packageSize === "Large") setSize("Large");

        setFragile(packageData.fragile === 1 || packageData.fragile === true);

        if (packageData.recipient_id) {
          setRecipientType("auto");
        } else if (
          packageData.recipient_name ||
          packageData.recipient_contact
        ) {
          setRecipientType("manual");
        }

        const declaredVal = packageData?.declared_value || "";
        setInsurance(parseFloat(declaredVal || 0) > 0 ? true : false);
        setRush(packageData.rush_fee > 0);
        setInsure(declaredVal || null);

        setFormData({
          origin: packageData.origin || "",
          origin_city: packageData.origin_city || "",
          origin_postalcode: packageData.origin_postalcode || "",
          destination: packageData.destination || "",
          destination_city: packageData.destination_city || "",
          destination_postalcode: packageData.destination_postalcode || "",
          contents: packageData.contents || "",
          weight: packageData.weight || "",
          pickup_date: packageData.pickup_date || "",
          notes: packageData.notes || "",
          offer: packageData.offer ? String(packageData.offer) : "",
          declared_value: packageData.declared_value || "",
          insurance_premium: packageData.insurance_premium || "",
          recipient_name: packageData.recipient_name || "",
          recipient_contact: packageData.recipient_contact || "",
          recipient_id: packageData.recipient_id
            ? String(packageData.recipient_id)
            : "",
          traveller_id: packageData.traveller_id || travelerData?.user_id || "",
          travel_plan_id: packageData.travel_plan_id || travelerData?.id || "",
          package_img: packageData.package_img || "",
        });
      }
    } catch (error) {
      console.error("Error fetching package data:", error);
      showPopup("Failed to load package data for editing", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchPackageData();
    }
  }, [isEditMode]);

  useEffect(() => {
    if (showVerificationBanner && bannerRef.current) {
      bannerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showVerificationBanner]);

  useEffect(() => {
    if (travelerData && !isEditMode) {
      let newOffer = null;
      if (size === packageSizes[0] && travelerData.rate_small)
        newOffer = String(travelerData.rate_small);
      else if (size === packageSizes[1] && travelerData.rate_medium)
        newOffer = String(travelerData.rate_medium);
      else if (size === packageSizes[2] && travelerData.rate_large)
        newOffer = String(travelerData.rate_large);

      if (newOffer !== null) {
        setFormData((prev) => ({ ...prev, offer: newOffer }));
      }
    }
  }, [size, travelerData, isEditMode]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "weight") {
      if (!/^\d*\.?\d{0,2}$/.test(value)) return;
    }

    if (name === "offer" || name === "declared_value") {
      if (!/^\d*\.?\d{0,2}$/.test(value)) return;
    }

    if (name === "recipient_contact") {
      if (value === "") {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        return;
      }

      if (looksLikeEmailInput(value)) {
        if (!/^[a-zA-Z0-9._%+-@]*$/.test(value)) return;

        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({
          ...prev,
          [name]: getRecipientContactError(value, { partial: true }),
        }));
        return;
      }

      if (looksLikePhoneInput(value)) {
        if (value.length > UK_MOBILE_MAX_LENGTH) return;

        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({
          ...prev,
          [name]: getRecipientContactError(value, { partial: true }),
        }));
        return;
      }

      return;
    }

    if (name === "origin_city" && isBookingWithTraveler) {
      setErrors((prev) => ({ ...prev, origin_city: CITY_CHANGE_MSG }));
      return;
    }

    if (name === "destination_city" && isBookingWithTraveler) {
      setErrors((prev) => ({ ...prev, destination_city: CITY_CHANGE_MSG }));
      return;
    }

    if (name === "origin") {
      setFormData((prev) => ({
        ...prev,
        origin: value,
        origin_postalcode: "",
        ...(isBookingWithTraveler
          ? { origin_city: lockedOriginCity }
          : { origin_city: "" }),
      }));
      setErrors((prev) => ({ ...prev, origin: "" }));
      return;
    }

    if (name === "destination") {
      setFormData((prev) => ({
        ...prev,
        destination: value,
        destination_postalcode: "",
        ...(isBookingWithTraveler
          ? { destination_city: lockedDestinationCity }
          : { destination_city: "" }),
      }));
      setErrors((prev) => ({ ...prev, destination: "" }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.origin.trim())
      newErrors.origin = "Origin address is required";
    if (!formData.destination.trim())
      newErrors.destination = "Destination address is required";
    if (isSameOriginAndDestination(formData.origin, formData.destination)) {
      newErrors.destination = SAME_LOCATION_MSG;
    }
    if (isBookingWithTraveler) {
      if (
        lockedOriginCity &&
        !isCityAllowed(formData.origin_city, lockedOriginCity)
      ) {
        newErrors.origin = CITY_CHANGE_MSG;
      }
      if (
        lockedDestinationCity &&
        !isCityAllowed(formData.destination_city, lockedDestinationCity)
      ) {
        newErrors.destination = CITY_CHANGE_MSG;
      }
    }
    if (!formData.contents.trim())
      newErrors.contents = "Package details are required";
    if (!formData.weight) newErrors.weight = "Weight is required";
    if (!formData.pickup_date)
      newErrors.pickup_date = "Pickup date is required";
    if (!formData.offer) newErrors.offer = "Offer amount is required";
    if (!size) newErrors.size = "Package size is required";

    if (recipientType === "auto" && !formData.recipient_id.trim()) {
      newErrors.recipient_id = "Recipient ID is required for registered user";
    }

    if (recipientType === "manual") {
      if (!formData.recipient_name.trim())
        newErrors.recipient_name = "Recipient name is required";

      const contactError = getRecipientContactError(
        formData.recipient_contact,
        { partial: false },
      );
      if (contactError) {
        newErrors.recipient_contact = contactError;
      }
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleAddressKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const extractPostcode = (addressComponents) => {
    if (!addressComponents) return "";
    const postcodeComponent = addressComponents.find(
      (component) =>
        component.types.includes("postal_code") ||
        component.types.includes("postal_code_prefix") ||
        component.types.includes("postal_code_suffix"),
    );
    return postcodeComponent?.long_name || "";
  };

  const extractCity = (addressComponents) => {
    if (!addressComponents) return "";
    const cityComponent = addressComponents.find(
      (component) =>
        component.types.includes("postal_town") ||
        component.types.includes("locality") ||
        component.types.includes("administrative_area_level_2"),
    );
    return cityComponent?.long_name || "";
  };

  const applyOriginSelection = (address, city, postcode) => {
    if (
      isBookingWithTraveler &&
      lockedOriginCity &&
      !isCityAllowed(city, lockedOriginCity)
    ) {
      setFormData((prev) => ({
        ...prev,
        origin_city: lockedOriginCity,
      }));
      setErrors((prev) => ({ ...prev, origin: CITY_CHANGE_MSG }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      origin: address,
      origin_city: isBookingWithTraveler ? lockedOriginCity : city,
      origin_postalcode: postcode,
    }));
    setErrors((prev) => ({ ...prev, origin: "" }));
  };

  const applyDestinationSelection = (address, city, postcode) => {
    if (
      isBookingWithTraveler &&
      lockedDestinationCity &&
      !isCityAllowed(city, lockedDestinationCity)
    ) {
      setFormData((prev) => ({
        ...prev,
        destination_city: lockedDestinationCity,
      }));
      setErrors((prev) => ({ ...prev, destination: CITY_CHANGE_MSG }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      destination: address,
      destination_city: isBookingWithTraveler ? lockedDestinationCity : city,
      destination_postalcode: postcode,
    }));
    setErrors((prev) => ({ ...prev, destination: "" }));
  };

  const getPlaceDetails = (placeId, callback) => {
    if (!window.google || !placeId) return;

    const placesService = new window.google.maps.places.PlacesService(
      document.createElement("div"),
    );

    placesService.getDetails(
      {
        placeId,
        fields: ["address_components", "formatted_address"],
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          callback(place);
        }
      },
    );
  };

  useEffect(() => {
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
              applyOriginSelection(
                detailedPlace.formatted_address || "",
                extractCity(detailedPlace.address_components),
                extractPostcode(detailedPlace.address_components),
              );
            });
          } else {
            applyOriginSelection(
              place.formatted_address || "",
              extractCity(place.address_components),
              extractPostcode(place.address_components),
            );
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
              applyDestinationSelection(
                detailedPlace.formatted_address || "",
                extractCity(detailedPlace.address_components),
                extractPostcode(detailedPlace.address_components),
              );
            });
          } else {
            applyDestinationSelection(
              place.formatted_address || "",
              extractCity(place.address_components),
              extractPostcode(place.address_components),
            );
          }
        });
      }
    };

    const timer = setTimeout(initializeAutocomplete, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const same = isSameOriginAndDestination(
      formData.origin,
      formData.destination,
    );

    setErrors((prev) => {
      if (same) {
        return { ...prev, destination: SAME_LOCATION_MSG };
      }
      if (prev.destination === SAME_LOCATION_MSG) {
        return { ...prev, destination: "" };
      }
      return prev;
    });
  }, [formData.origin, formData.destination]);

  const resetForm = () => {
    setSize("");
    setRecipientType("auto");
    setFragile(false);
    setFormData({
      origin: "",
      origin_city: lockedOriginCity,
      origin_postalcode: "",
      destination: "",
      destination_city: lockedDestinationCity,
      destination_postalcode: "",
      contents: "",
      weight: "",
      pickup_date: travelerData?.departure_date || "",
      notes: "",
      offer: "",
      declared_value: "",
      insurance_premium: "",
      recipient_name: "",
      recipient_contact: "",
      recipient_id: "",
      traveller_id: travelerData?.user_id || "",
      travel_plan_id: travelerData?.id || "",
      package_img: "",
    });
    setErrors({});
  };

  const fetchFee = async () => {
    try {
      const res = await packageFeeStatusService("rush_fee");
      setFee(res?.data?.data || 0);
      const res2 = await packageFeeStatusService("insurance_fee");
      setInsuranceFee(parseInsuranceFeeConfig(res2?.data));
    } catch (err) {
      console.error("Failed to fetch fee:", err);
      setFee(0);
      setInsuranceFee(parseInsuranceFeeConfig(null));
    }
  };

  useEffect(() => {
    fetchFee();
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.destination === SAME_LOCATION_MSG) {
        showPopup(SAME_LOCATION_MSG, "error");
        return;
      }
      if (
        newErrors.origin === CITY_CHANGE_MSG ||
        newErrors.destination === CITY_CHANGE_MSG
      ) {
        showPopup(CITY_CHANGE_MSG, "error");
        return;
      }

      const fieldLabels = {
        origin: "Origin Address",
        destination: "Destination Address",
        contents: "Package Details",
        weight: "Estimated Weight",
        pickup_date: "Pickup Date",
        offer: "Your Offer",
        size: "Package Size",
        recipient_id: "Recipient ID",
        recipient_name: "Recipient Full Name",
        recipient_contact: "Recipient Email or Phone",
      };
      const missingFields = Object.keys(newErrors).map(
        (key) => fieldLabels[key] || key,
      );
      showPopup(
        `Please fill required fields: ${missingFields.join(", ")}`,
        "error",
      );
      return;
    }

    if (needsVerification() && !isEditMode) {
      setShowVerificationBanner(true);
      return;
    }

    Setconfirmrequest(true);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);

    const isInsured = Boolean(
      insure &&
      String(insure) !== "0" &&
      insurance &&
      !quoteFailed &&
      parseFloat(quote || 0) > 0,
    );
    const insuranceValue = isInsured
      ? parseFloat(quote || 0) + parseFloat(insuranceFee?.amount || 0)
      : 0;
    // const rushFeeValue = rush ? parseFloat(fee?.amount || 0) : 0;

    const payload = new FormData();
    payload.append("origin", formData.origin);
    payload.append("destination", formData.destination);
    payload.append("contents", formData.contents);
    payload.append("size", sizeToApiValue[size]);
    payload.append("weight", parseFloat(formData.weight));
    payload.append("fragile", fragile);
    payload.append("pickup_date", formData.pickup_date);
    payload.append("notes", formData.notes || "");
    payload.append("offer", parseFloat(formData.offer));
    payload.append("recipient_name", formData.recipient_name || "");
    payload.append("recipient_contact", formData.recipient_contact || "");
    payload.append("recipient_id", formData.recipient_id || "");
    payload.append("origin_city", formData.origin_city || "");
    payload.append("origin_postalcode", formData.origin_postalcode || "");
    payload.append("destination_city", formData.destination_city || "");
    payload.append(
      "destination_postalcode",
      formData.destination_postalcode || "",
    );
    payload.append("traveller_id", formData.traveller_id || "");
    if (formData.package_img && typeof formData.package_img !== "string") {
      payload.append("package_img", formData.package_img);
    }
    payload.append("travel_plan_id", formData.travel_plan_id || "");
    if (rush) {
      payload.append("rush_fee", 1);
    }
    if (isInsured) {
      payload.append("insurance_premium", insuranceValue);
      if (formData.declared_value) {
        payload.append("declared_value", formData.declared_value);
      }
    }

    try {
      let response;
      if (isEditMode) {
        response = await editSendPackageService(payload, editPackageId);
      } else {
        response = await createSendPackageService(payload);
      }

      if (response?.data?.success) {
        Setconfirmrequest(false);
        SetrequestSent(true);
        if (!isEditMode) {
          resetForm();
        }
        showPopup(
          isEditMode
            ? "Package updated successfully!"
            : "Package request created successfully!",
          "success",
        );
      } else {
        showPopup(
          response?.data?.message ||
            `Failed to ${isEditMode ? "update" : "create"} package request`,
          "error",
        );
      }
    } catch (error) {
      showPopup(
        error?.response?.data?.message ||
          `Something went wrong while ${isEditMode ? "updating" : "sending"} package request`,
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const getQuote = async (requestId) => {
    if (!insure || insure === "0" || insure === 0) {
      if (requestId !== quoteRequestIdRef.current) return;
      setQuote(0);
      setQuoteFailed(false);
      setQuoteReceived(false);
      return;
    }

    try {
      const res = await PackageQuoteService({
        declared_value: insure,
      });
      if (requestId !== quoteRequestIdRef.current) return;
      setQuote(res?.data?.quote?.premium || 0);
      setQuoteFailed(false);
      setQuoteReceived(true);
    } catch (err) {
      if (requestId !== quoteRequestIdRef.current) return;
      console.error(err);
      setQuote(0);
      setQuoteFailed(true);
      setQuoteReceived(false);
      setInsurance(false);
      showPopup("Failed to get quote. Insurance was not applied.", "error");
    }
  };

  useEffect(() => {
    if (quoteDebounceRef.current) {
      clearTimeout(quoteDebounceRef.current);
    }

    const hasDeclaredValue =
      insure !== null &&
      insure !== undefined &&
      insure !== 0 &&
      insure !== "0" &&
      insure !== "";

    if (hasDeclaredValue) {
      setQuoteReceived(false);
      setQuoteFailed(false);
      setInsurance(false);
    }

    quoteDebounceRef.current = setTimeout(() => {
      const requestId = ++quoteRequestIdRef.current;
      getQuote(requestId);
    }, 400);

    return () => clearTimeout(quoteDebounceRef.current);
  }, [insure]);

  const insurancePremium = parseFloat(quote || 0);
  const insuranceFeeCalc =
    insurancePremium > 0
      ? calcInsuranceFee(insurancePremium, insuranceFee)
      : null;
  const insuranceTotalFee = insurancePremium + (insuranceFeeCalc?.total || 0);

  const hasDeclaredValue =
    insure !== null &&
    insure !== undefined &&
    insure !== 0 &&
    insure !== "0" &&
    insure !== "";
  const isQuoteLoading = hasDeclaredValue && !quoteReceived && !quoteFailed;

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!showUserDropdown) return;

    if (userSearchDebounceRef.current) {
      clearTimeout(userSearchDebounceRef.current);
    }

    const query = recipientSearchQuery.trim();
    if (!query) {
      setRegisteredUsers([]);
      setUserSearchLoading(false);
      return;
    }

    userSearchDebounceRef.current = setTimeout(async () => {
      const requestId = ++userSearchRequestIdRef.current;
      try {
        setUserSearchLoading(true);
        const res = await searchUsersService(query);
        if (requestId !== userSearchRequestIdRef.current) return;
        setRegisteredUsers(res?.data?.data || []);
      } catch (err) {
        if (requestId !== userSearchRequestIdRef.current) return;
        console.error(err);
        setRegisteredUsers([]);
      } finally {
        if (requestId === userSearchRequestIdRef.current) {
          setUserSearchLoading(false);
        }
      }
    }, 400);

    return () => clearTimeout(userSearchDebounceRef.current);
  }, [recipientSearchQuery, showUserDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setShowUserDropdown(false);
        setRecipientSearchQuery("");
        setRegisteredUsers([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="w-full flex flex-col items-center py-8 px-2">
      <style>
        {`
          input[type='number'].no-spinner::-webkit-inner-spin-button,
          input[type='number'].no-spinner::-webkit-outer-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
          }
          
          input[type='number'].no-spinner {
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

      {showVerificationBanner && (
        <div ref={bannerRef} className="mb-6 w-full">
          <CompleteVerficationBanner />
        </div>
      )}

      <div className="w-full mx-auto text-center md:text-left">
        <div className="text-left">
          <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
            {isEditMode ? "Edit Package Request" : "Send a Package"}
          </h2>

          <p className="text-[#5F6C85] text-base md:text-lg mb-8">
            {isEditMode
              ? "Update the details of your package request below."
              : "Fill in the details below to find a traveller for your package."}
          </p>
        </div>

        {loading && !confirmrequest ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4681F4]"></div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 text-left"
          >
            {travelerData && !isEditMode && (
              <div className="flex flex-col sm:flex-row bg-[#EEF2FC] rounded-xl p-4 gap-3 sm:gap-4 sm:items-center text-left">
                {/* Avatar */}
                <div className="w-[45px] h-[45px] sm:w-[50px] sm:h-[50px] rounded-full overflow-hidden flex-shrink-0">
                  {travelerData.profile_pic || travelerData.sender_profile ? (
                    <img
                      src={
                        travelerData.profile_pic || travelerData.sender_profile
                      }
                      alt="Traveller"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-bold text-base sm:text-xl">
                      {travelerData.first_name?.[0]?.toUpperCase() ||
                        travelerData.username?.[0]?.toUpperCase() ||
                        travelerData.full_name?.[0]?.toUpperCase() ||
                        "T"}
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div className="flex flex-col">
                  <div className="font-semibold text-sm sm:text-base md:text-[17px] text-black">
                    Booking With{" "}
                    {travelerData.first_name ||
                      travelerData.username ||
                      travelerData.full_name ||
                      travelerData.sender_name ||
                      "Traveller"}
                  </div>

                  <div className="text-gray-500 text-xs sm:text-sm md:text-[14px] leading-snug">
                    Please provide the package details below.
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-6">
              <div className="text-xl md:text-[20px] font-semibold text-black">
                Origin Address
              </div>
              <div>
                <label className="block text-black font-medium text-base mb-2">
                  Address Line 1
                </label>
                <input
                  ref={originInputRef}
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  onKeyDown={handleAddressKeyDown}
                  type="text"
                  placeholder="e.g., 123 High St, London"
                  className={`w-full italic bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none ${errors.origin ? "border border-red-500" : ""}`}
                />
                {errors.origin && (
                  <p className="text-red-500 text-sm mt-1">{errors.origin}</p>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-4 md:gap-2">
                <div className="flex-1">
                  <label className="block text-black font-medium text-base mb-2 ">
                    City
                  </label>
                  <input
                    name="origin_city"
                    value={formData.origin_city}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="e.g., London"
                    readOnly={isBookingWithTraveler}
                    className={`w-full italic bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none ${isBookingWithTraveler ? "opacity-60 cursor-not-allowed" : ""} ${errors.origin_city ? "border border-red-500" : ""}`}
                  />
                  {errors.origin_city && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.origin_city}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-black font-medium text-base mb-2">
                    Postcode
                  </label>
                  <input
                    name="origin_postalcode"
                    value={formData.origin_postalcode}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="e.g., BS1 1DL"
                    className="w-full italic bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="text-xl md:text-[20px] font-semibold text-black">
                Destination Address
              </div>
              <div>
                <label className="block text-black font-medium text-base mb-2">
                  Address Line 1
                </label>
                <input
                  ref={destinationInputRef}
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  onKeyDown={handleAddressKeyDown}
                  type="text"
                  placeholder="e.g., 123 High St, London"
                  className={`w-full italic bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none ${errors.destination ? "border border-red-500" : ""}`}
                />
                {errors.destination && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.destination}
                  </p>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-4 md:gap-2">
                <div className="flex-1">
                  <label className="block text-black font-medium text-base mb-2 ">
                    City
                  </label>
                  <input
                    name="destination_city"
                    value={formData.destination_city}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="e.g., London"
                    readOnly={isBookingWithTraveler}
                    className={`w-full italic bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none ${isBookingWithTraveler ? "opacity-60 cursor-not-allowed" : ""} ${errors.destination_city ? "border border-red-500" : ""}`}
                  />
                  {errors.destination_city && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.destination_city}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-black font-medium text-base mb-2">
                    Postcode
                  </label>
                  <input
                    name="destination_postalcode"
                    value={formData.destination_postalcode}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="e.g., BS1 1DL"
                    className="w-full italic bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="text-xl md:text-[20px] font-semibold text-black">
                Recipient Details
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="transportrUser"
                      checked={recipientType === "auto"}
                      onChange={() => {
                        setRecipientType("auto");
                        setErrors((prev) => ({
                          ...prev,
                          recipient_name: "",
                          recipient_contact: "",
                        }));
                      }}
                      name="recipientType"
                      value="registered"
                      className="border-[#4681F4] min-w-[20px] max-w-[20px] h-[20px] cursor-pointer"
                    />
                    <label
                      htmlFor="transportrUser"
                      className="font-thin text-base cursor-pointer"
                    >
                      Select a registered Transportr user
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="manualRecipient"
                      checked={recipientType === "manual"}
                      onChange={() => {
                        setRecipientType("manual");
                        setErrors((prev) => ({ ...prev, recipient_id: "" }));
                      }}
                      name="recipientType"
                      value="manual"
                      className="border-[#4681F4] min-w-[20px] max-w-[20px] h-[20px] cursor-pointer"
                    />
                    <label
                      htmlFor="manualRecipient"
                      className="font-thin text-base cursor-pointer"
                    >
                      Manually enter recipient details
                    </label>
                  </div>
                </div>
                {recipientType === "auto" && (
                  <div className="flex-1 relative" ref={userDropdownRef}>
                    <label className="block text-black font-medium text-base mb-2">
                      Recipient ID
                    </label>
                    <div
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className={`w-full italic bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none cursor-pointer flex items-center justify-between ${errors.recipient_id ? "border border-red-500" : ""}`}
                    >
                      <span className="truncate pr-2">
                        {formData.recipient_id
                          ? formData.recipient_name ||
                            registeredUsers.find(
                              (u) => u.id == formData.recipient_id,
                            )?.username ||
                            registeredUsers.find(
                              (u) => u.id == formData.recipient_id,
                            )?.full_name ||
                            formData.recipient_id
                          : "Select a user"}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`transform transition-transform flex-shrink-0 ${showUserDropdown ? "rotate-180" : ""}`}
                      />
                    </div>

                    {showUserDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col">
                        <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-20 rounded-t-xl">
                          <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full bg-[#E6F0FF] rounded-lg px-3 py-2 text-sm outline-none"
                            value={recipientSearchQuery}
                            onChange={(e) =>
                              setRecipientSearchQuery(e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-[260px] overflow-y-auto">
                          {userSearchLoading && (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              Searching...
                            </div>
                          )}
                          {!userSearchLoading &&
                            !recipientSearchQuery.trim() && (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Type to search users
                              </div>
                            )}
                          {!userSearchLoading &&
                            recipientSearchQuery.trim() &&
                            registeredUsers?.map((user) => (
                              <div
                                key={user.id}
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    recipient_id: String(user.id),
                                    recipient_name:
                                      user.full_name ||
                                      user.username ||
                                      `User ${user.id}`,
                                  }));
                                  setShowUserDropdown(false);
                                  setRecipientSearchQuery("");
                                  setRegisteredUsers([]);
                                }}
                                className="px-4 py-3 hover:bg-[#E6F0FF] cursor-pointer text-base text-gray-800 border-b border-gray-100 last:border-0"
                              >
                                <div className="font-medium truncate">
                                  {user.username ||
                                    user.full_name ||
                                    `User ${user.id}`}
                                </div>
                              </div>
                            ))}
                          {!userSearchLoading &&
                            recipientSearchQuery.trim() &&
                            registeredUsers?.length === 0 && (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No users found
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                    {errors.recipient_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.recipient_id}
                      </p>
                    )}
                  </div>
                )}
                {recipientType !== "auto" && (
                  <div className="flex-1 flex flex-col gap-4">
                    <div>
                      <label className="block text-black font-medium text-base mb-2">
                        Recipient Full Name
                      </label>
                      <input
                        name="recipient_name"
                        value={formData.recipient_name}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="e.g., Peter Pan"
                        className={`w-full italic bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none ${errors.recipient_name ? "border border-red-500" : ""}`}
                      />
                      {errors.recipient_name && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.recipient_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-black font-medium text-base mb-2">
                        Recipient Email or Phone
                      </label>
                      <input
                        name="recipient_contact"
                        value={formData.recipient_contact}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="peter@example.com or +447123456789"
                        className={`w-full italic bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none ${errors.recipient_contact ? "border border-red-500" : ""}`}
                      />
                      {errors.recipient_contact && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.recipient_contact}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xl md:text-[20px] font-semibold text-black">
              Package Details
            </div>
            <div>
              <textarea
                name="contents"
                value={formData.contents}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe what's inside the package (e.g., books, clothes, small electronics)"
                className={`w-full italic resize-none bg-[#E6F0FF] rounded-xl px-4 py-2 md:py-3 text-black text-base outline-none min-h-[60px] ${errors.contents ? "border border-red-500" : ""}`}
              />
              {errors.contents && (
                <p className="text-red-500 text-sm mt-1">{errors.contents}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-black font-medium text-base mb-2">
                  Package Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className={`w-full italic bg-[#E6F0FF] cursor-pointer h-10 md:h-[50px] rounded-xl custom-select ${errors.size ? "border border-red-500" : ""}`}
                >
                  <option value="" disabled>
                    Medium (Backpack)
                  </option>
                  {availableSizeOptions.map((sz, i) => (
                    <option key={i} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
                {errors.size && (
                  <p className="text-red-500 text-sm mt-1">{errors.size}</p>
                )}
              </div>
              <div>
                <label className="block text-black font-medium text-base mb-2">
                  Estimated Weight (kg)
                </label>
                <input
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g., 2.5"
                  className="w-full italic bg-[#E6F0FF] h-10 md:h-[50px] rounded-xl px-4 py-2 md:py-3 text-black text-base outline-none no-spinner"
                />
                {errors.weight && (
                  <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
                )}
              </div>
            </div>
            <div className="w-full">
              <label className="flex items-center gap-2 text-black font-medium text-sm sm:text-base mb-2">
                <Camera size={18} className="text-[#4681F4]" />
                Photo of Item (Optional)
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#E6F0FF] border border-dashed border-[#4681F4]/20 rounded-xl px-4 sm:px-5 py-4 transition-all hover:bg-blue-100/40">
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData((prev) => ({ ...prev, package_img: file }));
                    }
                  }}
                />

                {/* Button */}
                <label
                  htmlFor="fileUpload"
                  className="bg-white border border-gray-300 rounded-xl px-5 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition shadow-sm whitespace-nowrap text-center"
                >
                  {formData.package_img &&
                  typeof formData.package_img !== "string"
                    ? "Change File"
                    : "Choose File"}
                </label>

                {/* File Info */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-gray-800 font-medium truncate mb-1">
                    {formData.package_img
                      ? typeof formData.package_img === "string"
                        ? formData.package_img
                        : formData.package_img.name
                      : "No file chosen"}
                  </p>

                  <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                    A photo helps the traveller understand the item's size and
                    shape.
                    <br className="hidden md:block" /> Max 2MB (JPG, PNG).
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#D6D6D6] p-4 flex gap-3">
              <input
                type="checkbox"
                id="fragile"
                checked={fragile}
                onChange={(e) => setFragile(e.target.checked)}
                className="customCircleCheckbox mt-1 border-[#4681F4] min-w-[23px] max-w-[24px]"
              />
              <div>
                <label htmlFor="fragile" className="text-base text-black">
                  This package is fragile
                </label>
                <div className="text-xs mt-1 text-[#666666]">
                  Requires special handling. Travellers will{" "}
                  <br className="md:block hidden" /> be notified.
                </div>
              </div>
            </div>
            <div>
              <label className="block text-black font-medium text-base mb-2">
                Desired Pickup Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={today}
                  value={formData.pickup_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pickup_date: e.target.value,
                    }))
                  }
                  placeholder="DD-MM-YYYY"
                  readOnly={!!(travelerData && !isEditMode)}
                  disabled={!!(travelerData && !isEditMode)}
                  className={`w-full bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none pr-5 uppercase placeholder:uppercase ${travelerData && !isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}
                />
                {errors.pickup_date && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.pickup_date}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-black font-medium text-base mb-2">
                Delivery Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Any special instructions for the traveller or recipient."
                className="w-full italic bg-[#E6F0FF] rounded-xl px-4 py-2 md:py-3 resize-none text-black text-base outline-none min-h-[60px]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-black italic font-medium text-base mb-2">
                  Your Offer (£)
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    £
                  </span>

                  <input
                    name="offer"
                    value={formData.offer}
                    onChange={handleInputChange}
                    type="number"
                    onWheel={(e) => e.target.blur()}
                    placeholder="e.g., 20.00"
                    className={`w-full italic bg-[#E6F0FF] h-10 md:h-[50px] rounded-xl pl-8 pr-4 py-2 md:py-3 text-black text-base outline-none no-spinner ${
                      errors.offer ? "border border-red-500" : ""
                    }`}
                  />
                </div>

                {errors.offer && (
                  <p className="text-red-500 text-sm mt-1">{errors.offer}</p>
                )}
              </div>
              <div>
                <label className="block text-black font-medium text-base mb-2">
                  Declared Value (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    £
                  </span>
                  <input
                    name="declared_value"
                    value={formData.declared_value}
                    onChange={(e) => {
                      handleInputChange(e);
                      setInsure(e.target.value);
                    }}
                    type="number"
                    onWheel={(e) => e.target.blur()}
                    placeholder=" e.g., 50.00"
                    className="w-full italic bg-[#E6F0FF] h-10 md:h-[50px] rounded-xl pl-8 pr-4 py-2 md:py-3 text-black text-base outline-none no-spinner"
                  />
                </div>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              {isQuoteLoading && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="h-5 w-5 min-w-[20px] animate-spin rounded-full border-2 border-[#4681F4] border-r-transparent" />
                  <span className="text-sm text-gray-600">
                    Calculating insurance premium...
                  </span>
                </div>
              )}

              {hasDeclaredValue && quoteReceived && (
                <div
                  onClick={() => {
                    if (quoteFailed) return;
                    setInsurance(!insurance);
                  }}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 h-full
      							  ${quoteFailed ? "border-red-200 bg-red-50/50 cursor-not-allowed opacity-70" : insurance ? "border-blue-400 bg-blue-50/50 shadow-sm cursor-pointer" : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"}`}
                >
                  <div
                    className={`w-5 h-5 min-w-[20px] mt-1 rounded-full border-2 flex items-center justify-center transition-colors
         						 ${insurance ? "border-blue-500" : "border-gray-400"}`}
                  >
                    {insurance && (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <ShieldCheck className="text-blue-500" size={16} />
                      Yes, insure this package
                    </div>

                    <p className="text-sm text-gray-500 mt-1">
                      Covers your package up to £
                      {parseFloat(insure || 0).toFixed(2)} declared value.
                    </p>

                    <div className="text-sm font-semibold text-gray-800 mt-2">
                      You pay: £{insuranceTotalFee.toFixed(2)}
                      {/* {insuranceFeeCalc ? (
                          <span className="block text-xs font-normal text-gray-500 mt-0.5">
                            {insuranceFeeCalc.percentage}% of £
                            {insurancePremium.toFixed(2)} + £
                            {insuranceFeeCalc.amount.toFixed(2)}
                          </span>
                        ) : null} */}
                    </div>

                    {quoteFailed && (
                      <p className="text-sm text-red-500 mt-2">
                        Failed to get quote. Insurance cannot be applied.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {fee?.hide ? null : (
                <div
                  onClick={() => setRush(!rush)}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 h-full
      							  ${rush ? "border-blue-400 bg-blue-50/50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <div
                    className={`w-5 h-5 min-w-[20px] mt-1 rounded-full border-2 flex items-center justify-center transition-colors
         						 ${rush ? "border-blue-500" : "border-gray-400"}`}
                  >
                    {rush && (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      Priority Rush Boost (£{fee.amount})
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Hightlight your request and appear at the top of the
                      searches to find a traveller faster.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {confirmrequest && (
              <div className="flex items-center justify-center">
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40"></div>

                  <div className="relative w-[90%] max-w-md bg-[#eaf1fb] rounded-[28px] px-6 py-7 shadow-xl">
                    <h2 className="text-[22px] font-semibold text-center text-black">
                      Confirm Your Request
                    </h2>

                    <p className="text-[13px] text-gray-500 text-center mt-2 leading-relaxed">
                      Please review the details of your shipment request before
                      posting.
                    </p>

                    <div className="mt-6 space-y-3 text-[14px] text-gray-800 break-words">
                      <p>
                        <span className="font-semibold">Route:</span>{" "}
                        {formData.origin_city
                          ? `${formData.origin_city}${formData.origin_postalcode ? `, ${formData.origin_postalcode}` : ""}`
                          : formData.origin}{" "}
                        to{" "}
                        {formData.destination_city
                          ? `${formData.destination_city}${formData.destination_postalcode ? `, ${formData.destination_postalcode}` : ""}`
                          : formData.destination}
                      </p>
                      <p>
                        <span className="font-semibold">Recipient:</span>{" "}
                        {formData.recipient_name}
                      </p>
                      <p>
                        <span className="font-semibold">Package:</span>{" "}
                        {formData.contents} ({sizeToApiValue[size] || size})
                      </p>
                      <p>
                        <span className="font-semibold">Desired Pickup:</span>{" "}
                        {formData.pickup_date
                          ? formData.pickup_date.split("-").reverse().join("-")
                          : ""}
                      </p>
                      <p>
                        <span className="font-semibold">Your Offer:</span> £
                        {parseFloat(formData.offer || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-8 space-y-4">
                      <button
                        type="button"
                        onClick={handleFinalSubmit}
                        className="w-full py-3.5 rounded-full bg-[#4a7be5] text-white font-semibold text-[15px] shadow-md"
                        disabled={loading}
                      >
                        {loading
                          ? "Submitting..."
                          : isEditMode
                            ? "Confirm & Update"
                            : "Confirm & Send Request"}
                      </button>

                      <button
                        type="button"
                        onClick={() => Setconfirmrequest(false)}
                        className="w-full py-3.5 rounded-full bg-[#dbe6f7] text-black font-medium text-[15px] border border-white/60"
                      >
                        Go Back & Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {requestSent && (
              <div className="flex items-center justify-center">
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40"></div>

                  <div className="relative w-[90%] max-w-md bg-[#eeedf3] rounded-[28px] px-6 py-8 shadow-xl text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-14 h-14 rounded-full border-2 border-blue-400 flex items-center justify-center">
                        <Check className="text-blue-500" size={24} />
                      </div>
                    </div>
                    <h2 className="text-[20px] font-semibold text-gray-900">
                      {isEditMode ? "Request Updated!" : "Request Sent!"}
                    </h2>
                    <p className="text-[13px] text-gray-500 mt-2 leading-relaxed px-2">
                      {isEditMode
                        ? "Your package request has been successfully updated."
                        : "Your booking request has been successfully submitted. We'll notify you with any updates."}
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate("/dashboard/send-requests")}
                        className="w-full py-3.5 rounded-full bg-[#4a7be5] text-white font-semibold text-[15px] shadow-md"
                      >
                        View My Requests
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#4681F4] w-full md:w-[274px] h-[50px] hover:bg-white hover:text-[#4681F4] border border-[#4681F4] text-white font-bold cursor-pointer rounded-full text-xl transition-all duration-300 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isEditMode ? "Update Request" : "Send Booking Request"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default SendPackage;
