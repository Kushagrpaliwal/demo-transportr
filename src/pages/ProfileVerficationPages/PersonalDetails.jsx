import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { saveProfileInformationService } from "../../api/services/ProfileService/profileServices";
import { usePopup } from "../../context/PopupContext";
import { useProfile } from "../../context/ProfileContext";
import LoadingButton from "../../components/Common/LoadingButton";
import { useLocation } from "react-router-dom";

// import { fetchAddressAutocompleteService, fetchAddressDetailsService } from "../../api/services/AddressServices/addressServices";

const formatDOB = (date) => {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
};

const revertDOB = (date) => {
  if (!date) return "";
  const [day, month, year] = date.split("-");
  return `${year}-${month}-${day}`;
};

const PersonalDetails = () => {
  const navigate = useNavigate();
  const { profile, fetchProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const addressInputRef = useRef(null);
  const location = useLocation();
  // const [addressSuggestions, setAddressSuggestions] = useState([]);
  // const [placeID, setplaceID] = useState("");
  // const debounceRef = useRef(null);

  const dropdownRef = useRef(null);
  const { showPopup } = usePopup();
  const verified = location.state?.isVerified;

  const [formData, setFormData] = useState({
    f_name: "",
    l_name: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    address_2: "",
    city: "",
    country: "GB",
    postalcode: "",
    confirm_details: false,
  });

  useEffect(() => {
    if (profile?.data) {
      setFormData({
        f_name: profile.data.f_name || "",
        l_name: profile.data.l_name || "",
        phone: profile.data.phone || "",
        dob: profile.data.dob ? revertDOB(profile.data.dob) : "",
        gender: profile.data.gender || "",
        address: profile.data.address || "",
        address_2: profile.data.address_2 || "",
        city: profile.data.city || "",
        country: profile.data.country || "GB",
        postalcode: profile.data.postalcode || "",
        confirm_details: false,
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "phone") {
      if (!/^\d{0,11}$/.test(value)) return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field on change
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.f_name || formData.f_name.length < 2)
      newErrors.f_name = "First Name must be at least 2 characters";

    if (!formData.l_name || formData.l_name.length < 2)
      newErrors.l_name = "Last Name must be at least 2 characters";

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else {
      // Validate UK phone number format
      const phoneRegex = /^(?:(?:\+44)|0)(?:\d\s?){10}$/;
      const cleanedPhone = formData.phone.replace(/\s/g, "");
      if (
        !phoneRegex.test(cleanedPhone) &&
        !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)
      ) {
        newErrors.phone =
          "Please enter a valid phone number (e.g., 07123456789 or +447123456789)";
      }
    }

    if (!formData.dob) {
      newErrors.dob = "Date of Birth is required";
    } else {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) newErrors.dob = "You must be at least 18 years old";
    }

    if (!formData.gender) newErrors.gender = "Gender is required";

    if (!formData.address || formData.address.length < 2)
      newErrors.address = "Address Line 1 must be at least 2 characters";

    if (formData.address_2 && formData.address_2.length < 2)
      newErrors.address_2 = "Address Line 2 must be at least 2 characters";

    if (!formData.city || formData.city.length < 2)
      newErrors.city = "City must be at least 2 characters";

    if (!formData.country || formData.country.length < 2)
      newErrors.country = "Country must be at least 2 characters";

    if (!formData.postalcode || formData.postalcode.length < 2)
      newErrors.postalcode = "Postcode must be at least 2 characters";

    if (!formData.confirm_details)
      newErrors.confirm_details = "Please confirm your details";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const payload = {
      ...formData,
      dob: formatDOB(formData.dob),
    };
    delete payload.confirm_details;

    if (!profile?.data?.dob) {
      payload.start_kyc = 1;
    }

    try {
      const response = await saveProfileInformationService(payload);
      //console.log (response);
      if (response.data.success) {
        showPopup(
          response.data.message || "Personal Details Updated Successfully",
          "success",
        );
        await fetchProfile();
        if (verified) {
          navigate("/dashboard/verification/review");
        } else {
          navigate("/dashboard/verification/identity-scan");
        }
      } else {
        showPopup("Error in updating data");
      }
    } catch (error) {
      //console.log (error);
      showPopup("Something went wrong while updating data", "error");
    } finally {
      setLoading(false);
    }
  };

  const maxDateObj = new Date();
  maxDateObj.setFullYear(maxDateObj.getFullYear() - 18);
  maxDateObj.setDate(maxDateObj.getDate() - 1);
  const maxDate = `${maxDateObj.getFullYear()}-${String(maxDateObj.getMonth() + 1).padStart(2, "0")}-${String(maxDateObj.getDate()).padStart(2, "0")}`;

  /*
    const fetchSearchAdress = async (address) => {
      try {
        const data = await fetchAddressAutocompleteService(address);
        setAddressSuggestions(data?.predictions || []);
        //console.log (data);
      } catch (error) {
        console.error("Internal Server Error", error);
      }
    };
  
    const fetchAddressDetails = async () => {
      try {
        const data = await fetchAddressDetailsService(placeID);
        //console.log (data?.data?.result?.address_components);
  
        const city = data?.data?.result?.address_components?.find((items =>
          items.types.includes("postal_town"))
        )?.long_name
  
        const country = data?.data?.result?.address_components?.find((items =>
          items.types.includes("country"))
        )?.long_name
  
        const postalcode = data?.data?.result?.address_components?.find((items =>
          items.types.includes("postal_code"))
        )?.long_name
  
        setFormData({
          ...formData,
          city: city,
          country: country,
          postalcode: postalcode,
        })
  
        //console.log (city)
      } catch (error) {
        console.error("Internal Server Error", error);
      }
    };
  
    useEffect(() => {
      if (!formData.address) return;
  
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
  
      debounceRef.current = setTimeout(() => {
        fetchSearchAdress(formData.address);
      }, 750);
  
      return () => clearTimeout(debounceRef.current)
  
    }, [formData.address]);
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setAddressSuggestions([]);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
  
    useEffect(() => {
      if (placeID) {
        fetchAddressDetails();
      }
    }, [placeID]);
  */

  useEffect(() => {
    if (!window.google || !addressInputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: "gb" },
      },
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      const city = place.address_components?.find((c) =>
        c.types.includes("postal_town"),
      )?.long_name;

      const country = place.address_components?.find((c) =>
        c.types.includes("country"),
      )?.short_name;

      const postalcode = place.address_components?.find((c) =>
        c.types.includes("postal_code"),
      )?.long_name;

      setFormData((prev) => ({
        ...prev,
        address: place.formatted_address || "",
        city: city || "",
        country: country || "GB",
        postalcode: postalcode || "",
      }));
    });
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full xl:max-w-5xl mx-auto p-8">
      <h5 className="text-[20px] font-semibold text-black">Step 1 of 4</h5>

      <h1 className="text-[26px] font-semibold text-black mb-2">
        Personal Details
      </h1>

      <p className="text-lg font-normal text-[#5F6C85] mb-6">
        The Information is kept secure and is only used for verification purpose
        to ensure community safety.
      </p>

      <div className="xl:grid grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="text-base font-medium">First Name</label>
          <input
            name="f_name"
            value={formData.f_name}
            onChange={handleChange}
            placeholder="eg., John"
            className={`customInputCSS`}
          />
          {errors.f_name && (
            <p className="text-sm text-red-500">{errors.f_name}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="text-base font-medium">Last Name</label>
          <input
            name="l_name"
            value={formData.l_name}
            onChange={handleChange}
            placeholder="eg., Doe"
            className={`customInputCSS`}
          />
          {errors.l_name && (
            <p className="text-sm text-red-500">{errors.l_name}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-base font-medium">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="eg., 07123456789"
            className={`customInputCSS`}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
          {/* <p className="text-xs text-gray-500 mt-1">
            Enter a valid UK phone number (e.g., 07123456789 or +447123456789)
          </p> */}
        </div>

        {/* DOB */}
        <div>
          <label className="text-base font-medium">Date Of Birth</label>
          <input
            type={formData.dob ? "date" : "text"}
            onFocus={(e) => (e.target.type = "date")}
            onBlur={(e) => {
              if (!e.target.value) e.target.type = "text";
            }}
            name="dob"
            max={maxDate}
            value={formData.dob}
            onChange={handleChange}
            placeholder="DD-MM-YYYY"
            className={`customInputCSS italic uppercase`}
          />
          {errors.dob && <p className="text-sm text-red-500">{errors.dob}</p>}
        </div>

        {/* Gender */}
        <div>
          <label className="text-base font-medium">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={`customInputCSS italic`}
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>

          {errors.gender && (
            <p className="text-sm text-red-500">{errors.gender}</p>
          )}
        </div>

        {/* Address 1 */}
        <div className="col-span-2" ref={dropdownRef}>
          <label className="text-base font-medium">Address Line 1</label>
          <div className="relative">
            <input
              name="address"
              ref={addressInputRef}
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g., 123 High St"
              className={`customInputCSS`}
            />
          </div>

          {errors.address && (
            <p className="text-sm text-red-500">{errors.address}</p>
          )}
        </div>

        {/* Address 2 */}
        <div className="col-span-2">
          <label className="text-base font-medium">
            Address Line 2 (Optional)
          </label>
          <input
            name="address_2"
            value={formData.address_2}
            onChange={handleChange}
            placeholder="e.g., Apartment 4B"
            className={`customInputCSS`}
          />
          {errors.address_2 && (
            <p className="text-sm text-red-500">{errors.address_2}</p>
          )}
        </div>

        {/* City */}
        <div>
          <label className="text-base font-medium">Town / City</label>
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="e.g., London"
            className={`customInputCSS`}
          />
          {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
        </div>

        {/* Country */}
        <div>
          <label className="text-base font-medium">Country (Optional)</label>
          <input
            name="country"
            value="United Kingdom"
            placeholder="e.g., United Kingdom"
            className={`customInputCSS`}
            disabled
            readOnly
          />
          {errors.country && (
            <p className="text-sm text-red-500">{errors.country}</p>
          )}
        </div>

        {/* Postcode */}
        <div className="col-span-2">
          <label className="text-base font-medium">Postcode</label>
          <input
            name="postalcode"
            value={formData.postalcode}
            onChange={handleChange}
            placeholder="e.g., SWA1A 0AA"
            className={`customInputCSS`}
          />
          {errors.postalcode && (
            <p className="text-sm text-red-500">{errors.postalcode}</p>
          )}
        </div>
      </div>

      {/* Checkbox */}
      <div className="bg-white rounded-[20px] p-3 flex flex-col gap-1 mb-2 border border-[#D6D6D6] mt-6">
        <label className="flex items-center gap-2 text-base font-bold text-black">
          <input
            type="checkbox"
            name="confirm_details"
            checked={formData.confirm_details}
            onChange={handleChange}
            className="customCircleCheckbox"
          />
          I confirm my details are correct
        </label>

        <span className="text-sm font-normal text-black ml-6">
          By checking this box, you confirm that the name and address provided
          are accurate. Changes will require contacting support.
        </span>

        {errors.confirm_details && (
          <p className="text-sm text-red-500 ml-6">{errors.confirm_details}</p>
        )}
      </div>

      {verified ? (
        <LoadingButton
          type="submit"
          loading={loading}
          className="mt-8 w-full xl:w-1/4 bg-blue-500 text-white py-3 rounded-full cursor-pointer"
        >
          Save & Return
        </LoadingButton>
      ) : (
        <LoadingButton
          type="submit"
          loading={loading}
          className="mt-8 w-full xl:w-1/4 bg-blue-500 text-white py-3 rounded-full cursor-pointer"
        >
          Continue To Identity Scan
        </LoadingButton>
      )}
    </form>
  );
};

export default PersonalDetails;
