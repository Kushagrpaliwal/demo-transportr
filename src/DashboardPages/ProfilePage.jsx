import { useState, useEffect } from "react";
import { EditIcon, MessageIcon, LockIcon } from "../assets/icons";
import { useProfile } from "../context/ProfileContext";
import {
  saveProfileInformationService,
  updateProfileImageService,
} from "../api/services/ProfileService/profileServices";
import { usePopup } from "../context/PopupContext";
import LoadingButton from "../components/Common/LoadingButton";
import CompleteVerficationBanner from "../components/Dashboard/CompleteVerficationBanner";
import AccountSetting from "../components/Profile/AccountSetting";
import {
  AllTravellerReviewsService,
  ReplyToRatingService,
} from "../api/services/DashboardService/ShipmentHistory";
import { useLocation } from "react-router-dom";
import { getProFeaturesService } from "../api/services/proFeaturesService/proFeatures";
import { PlanStatusService } from "../api/services/SubscriptionsService/plans";

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);

  const day = date.getDate();
  const suffix = ["th", "st", "nd", "rd"][
    day % 10 > 3 || ~~((day % 100) / 10) === 1 ? 0 : day % 10
  ];

  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  return `${day}${suffix} ${month}, ${year}`;
}

const ProfilePage = () => {
  const { profile, fetchProfile } = useProfile();
  const { showPopup } = usePopup();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [save, setSave] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [hasLoadedAllReviews, setHasLoadedAllReviews] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [proFeatureData, setProFeatureData] = useState();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const location = useLocation();

  const [formData, setformData] = useState({
    f_name: "",
    l_name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  });

  useEffect(() => {
    if (profile?.data) {
      setformData({
        f_name: profile.data.f_name || "",
        l_name: profile.data.l_name || "",
        username: profile.data.username || "",
        email: profile.data.email || "",
        phone: profile.data.phone || "",
        address: profile.data.address || "",
        bio: profile.data.bio || "",
      });
    }
  }, [profile]);

  const getProFeatures = async () => {
    try {
      const res = await getProFeaturesService();
      const pfData = res?.data?.data || res?.data || res;
      setProFeatureData(pfData);

      if (pfData?.hide === 1 || pfData?.hide === true) {
        const subRes = await PlanStatusService();
        const subData = subRes?.data?.data || subRes?.data || subRes;
        setSubscriptionStatus(subData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getProFeatures();
  }, []);

  useEffect(() => {
    const loadInitialReviews = async () => {
      const travelerId = profile?.data?.id;
      if (!travelerId) return;

      try {
        setIsReviewsLoading(true);
        const res = await AllTravellerReviewsService(travelerId, 3, true);
        const reviewData = res?.data?.data || res?.data || [];
        setReviews(Array.isArray(reviewData) ? reviewData : []);
        setHasLoadedAllReviews(false);
      } catch (error) {
        console.error("Error fetching limited reviews", error);
      } finally {
        setIsReviewsLoading(false);
      }
    };

    loadInitialReviews();
  }, [profile?.data?.id]);

  const needsVerification = () => {
    const userData = profile?.data;
    return (
      !userData?.verification ||
      userData?.verification?.status === "PendingVerification" ||
      userData?.verification?.status === "Pending"
    );
  };

  const handleImageEditClick = () => {
    if (needsVerification()) {
      setShowVerificationBanner(true);

      setTimeout(() => {
        const bannerElement = document.getElementById("verification-banner");
        if (bannerElement) {
          bannerElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      setShowImagePicker(!showImagePicker);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (needsVerification()) {
      setShowVerificationBanner(true);
      setShowImagePicker(false);
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    if (!selectedImage) {
      showPopup("Please select an image first", "error");
      return;
    }

    const formData = new FormData();
    formData.append("profile_pic", selectedImage);

    try {
      setImageLoading(true);
      const res = await updateProfileImageService(formData);
      if (res.data?.success || res.success) {
        showPopup("Profile image updated successfully", "success");
        await fetchProfile();
        setShowImagePicker(false);
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        showPopup(
          res.data?.message || "Failed to update profile image",
          "error",
        );
      }
    } catch (err) {
      console.error(err);
      showPopup("Something went wrong while updating profile image", "error");
    } finally {
      setImageLoading(false);
    }
  };

  const handleCancelImageUpload = () => {
    setShowImagePicker(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleEditClick = () => {
    if (needsVerification()) {
      setShowVerificationBanner(true);
    }
    setSave(true);
  };

  const validateForm = () => {
    const errors = {};
    const unverifiedUser = needsVerification();

    if (!formData.username.trim()) {
      errors.username = "Username is required.";
    }
    if (!formData.bio.trim()) {
      errors.bio = "Bio is required.";
    }
    if (!unverifiedUser) {
      // First name and last name are now always non-editable, so remove from validation
      if (!formData.phone.trim()) errors.phone = "Phone number is required.";
      if (!formData.address.trim()) errors.address = "Address is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const unverifiedUser = needsVerification();
    const payload = unverifiedUser
      ? { username: formData.username, bio: formData.bio }
      : {
          username: formData.username,
          bio: formData.bio,
          phone: formData.phone,
          address: formData.address,
        };

    try {
      setLoading(true);
      const res = await saveProfileInformationService(payload);
      if (res.data?.success || res.success) {
        showPopup("Profile updated successfully", "success");
        await fetchProfile();
        setSave(false);
        setFormErrors({});
      } else {
        showPopup(res.data?.message || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error(err);
      showPopup("Something went wrong while updating profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile?.data) {
      setformData({
        f_name: profile.data.f_name || "",
        l_name: profile.data.l_name || "",
        username: profile.data.username || "",
        email: profile.data.email || "",
        phone: profile.data.phone || "",
        address: profile.data.address || "",
        bio: profile.data.bio || "",
      });
    }
    setSave(false);
    setShowVerificationBanner(false);
    setFormErrors({});
  };

  const handleLoadAllReviews = async () => {
    const travelerId = profile?.data?.id;
    if (!travelerId || hasLoadedAllReviews) return;

    try {
      setIsReviewsLoading(true);
      const res = await AllTravellerReviewsService(travelerId, null, true);
      const reviewData = res?.data?.data || res?.data || [];
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setHasLoadedAllReviews(true);
    } catch (error) {
      console.error("Error fetching all reviews", error);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const openReplyModal = (review) => {
    setSelectedReview(review);
    setReplyText(review?.reply || "");
    setIsReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setIsReplyModalOpen(false);
    setSelectedReview(null);
    setReplyText("");
  };

  const handleSubmitReply = async () => {
    if (!selectedReview?.id) return;
    const trimmedReply = replyText.trim();
    if (!trimmedReply) {
      showPopup("Please write a reply before submitting.", "error");
      return;
    }

    try {
      setIsReplySubmitting(true);
      await ReplyToRatingService(selectedReview.id, { reply: trimmedReply });
      showPopup("Reply submitted successfully.", "success");

      setReviews((prev) =>
        prev.map((item) =>
          item.id === selectedReview.id
            ? {
                ...item,
                reply: trimmedReply,
                replied_at: new Date().toISOString(),
              }
            : item,
        ),
      );
      closeReplyModal();
    } catch (error) {
      console.error("Error while replying to review", error);
      showPopup(
        error?.response?.data?.message || "Failed to submit reply.",
        "error",
      );
    } finally {
      setIsReplySubmitting(false);
    }
  };

  useEffect(() => {
    if (location.state?.section === "account") {
      document.getElementById("account")?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [location]);

  const isHideActive = proFeatureData?.hide === 1 || proFeatureData?.hide === true;
  const subCreatedAt = subscriptionStatus?.created_at;
  const pfUpdatedAt = proFeatureData?.updated_at;
  const showProBadge =
    profile?.data?.pro_traveler === 1 &&
    (!isHideActive || (subCreatedAt && pfUpdatedAt && new Date(subCreatedAt) < new Date(pfUpdatedAt)));

  return (
    <>
      {showVerificationBanner && (
        <div id="verification-banner">
          <CompleteVerficationBanner />
        </div>
      )}

      <section className="w-full flex flex-col items-center pt-8">
        <div className="w-full mx-auto text-center md:text-left">
          <div className="text-left">
            <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-1">
              My Profile
            </h2>
            <p className="text-[#5F6C85] text-base md:text-lg mb-8">
              View and manage your account details.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile Preview"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : profile?.data?.profile_pic ? (
                  <img
                    src={profile?.data?.profile_pic}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#4681F4] text-white text-xl font-semibold text-center overflow-hidden">
                    {profile?.data?.f_name?.slice(0, 2).toUpperCase() || " "}
                  </div>
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-base md:text-xl font-bold text-black">
                    {profile?.data?.username || ""}
                  </span>
                  {showProBadge && (
                    <div className="bg-[#F3E8FF] flex items-center h-[22px] w-[83px] border-[0.4px] border-[#6B21A8] justify-center text-[#6B21A8] text-[10px] rounded-full">
                      <img
                        src="/pro-icon.svg"
                        alt="pro-icon"
                        className="w-3 h-3"
                      />{" "}
                      Pro Traveller
                    </div>
                  )}
                  {(profile?.data?.verification === null ||
                    profile?.data?.verification?.status === "Pending") && (
                    <div className=" flex items-center h-[22px] w-[83px] gap-0.5 bg-[#D0E3FF] border-[0.4px] border-[#4681F4] justify-center text-[#4681F4] text-[10px] rounded-full">
                      <img
                        src="/unverified.svg"
                        alt="unverified"
                        className="w-3 h-3"
                      />{" "}
                      Unverified
                    </div>
                  )}
                  {profile?.data?.verification?.status === "Approved" && (
                    <div className=" flex items-center h-[22px] gap-0.5 w-[83px] bg-[#D8FFDC] border-[0.4px] border-[#05B71A] justify-center text-[#05B71A] text-[10px] rounded-full">
                      <img src="/verified.svg" alt="verified" className="" />{" "}
                      Verified
                    </div>
                  )}
                  {profile?.data?.verification?.status ===
                    "PendingVerification" && (
                    <div className=" flex items-center h-[22px] gap-0.5 w-[100px] bg-[#FFD47D4D] border-[0.4px] border-[#F4B744] justify-center text-[#F4B744] text-[10px] rounded-full">
                      <img
                        src="/pending_status.svg"
                        alt="pending_status"
                        className=""
                      />{" "}
                      Pending Status
                    </div>
                  )}
                </div>
                <div className="text-black text-base">
                  {profile?.data?.email || ""}
                </div>
                <div className=" text-base">
                  Member Since: {formatDate(profile?.data?.created_at) || ""}
                </div>
              </div>
            </div>
            <button
              onClick={handleImageEditClick}
              className="flex items-center justify-center cursor-pointer gap-2 bg-[#4681F4] border border-[#4681F4] group h-[50px] w-[171px] text-white hover:bg-[white] hover:text-[#4681F4] rounded-full text-[14px] transition-all duration-300"
            >
              <div
                className="w-6 h-6 text-white group-hover:text-[#4681F4]"
                dangerouslySetInnerHTML={{ __html: EditIcon }}
              />
              Edit Profile Image
            </button>
          </div>

          {/* Image Picker */}
          {showImagePicker && (
            <div className="mb-5">
              <div className="flex mb-5 items-center gap-4 bg-[#E6F0FF] rounded-[10px] p-4">
                <div className="flex-1">
                  <div className="flex items-center italic bg-[#E6F0FF] rounded-[10px] overflow-hidden border border-[#4681F4]">
                    <label className="bg-[#4681F4] text-white px-6 py-3 cursor-pointer hover:bg-blue-600 transition-all whitespace-nowrap">
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <span className="px-4 text-gray-500 truncate">
                      {selectedImage?.name || "No File Chosen"}
                    </span>
                  </div>
                </div>
                {imagePreview && (
                  <div className="flex items-center gap-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={handleCancelImageUpload}
                  className="bg-[#E6F0FF] w-[88px] h-[34px] flex items-center justify-center text-black hover:bg-white hover:text-[#4681F4] hover:border hover:border-[#4681F4] cursor-pointer rounded-full text-[14px] duration-300 font-bold transition-all"
                >
                  Cancel
                </button>
                <LoadingButton
                  loading={imageLoading}
                  onClick={handleImageUpload}
                  className="bg-[#4681F4] w-[88px] h-[34px] flex items-center justify-center cursor-pointer hover:bg-white hover:text-[#4681F4] border border-[#4681F4] text-white rounded-full text-[14px] font-bold duration-300 transition-all"
                >
                  Upload
                </LoadingButton>
              </div>
            </div>
          )}

          <hr className="border-[#D6D6D6] mb-8" />

          {/* Personal Information Section */}
          <div className="w-full">
            <h3 className="text-left text-2xl md:text-[32px] font-semibold text-black mb-6">
              Personal Information
            </h3>

            {/* Edit Mode Indicator */}
            {save && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 font-medium">
                      You are in Edit Mode. Don’t forget to save your changes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {profile?.data?.verification === null && (
              <div className="w-full bg-[#D0E3FF] flex items-start gap-5 rounded-[20px] p-5 mb-5">
                <img src="/shield-check.svg" alt="shield-check" />
                <div className="">
                  <h4 className="text-base md:text-lg font-semibold mb-5">
                    You're Almost There!
                  </h4>
                  <p className="text-sm">
                    The last step is to verify your name and address. It's
                    essential for securing your account and enabling all
                    features, like sending packages or earning money on your
                    travels.
                  </p>
                </div>
              </div>
            )}
            <form
              className="flex flex-col gap-4 md:gap-6 text-left"
              onSubmit={handleSave}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-left">
                {/* First Name - Always non-editable with lock icon */}
                <div>
                  <label className="block text-black text-base font-medium mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.f_name}
                      readOnly
                      disabled
                      className="w-full bg-[#E6F0FF] h-10 lg:h-[50px] rounded-[12px] px-4 py-3 text-black text-base outline-none opacity-60 cursor-not-allowed pr-10"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Last Name - Always non-editable with lock icon */}
                <div>
                  <label className="block text-black text-base font-medium mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.l_name}
                      readOnly
                      disabled
                      className="w-full bg-[#E6F0FF] h-10 lg:h-[50px] rounded-[12px] px-4 py-3 text-black text-base outline-none opacity-60 cursor-not-allowed pr-10"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Username - Editable in edit mode */}
                <div>
                  <label className="block text-black text-base font-medium mb-2">
                    Username (Public)
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      setformData({ ...formData, username: e.target.value });
                      if (formErrors.username)
                        setFormErrors((prev) => ({ ...prev, username: "" }));
                    }}
                    readOnly={!save}
                    className={`w-full bg-[#E6F0FF] h-10 lg:h-[50px] rounded-[12px] px-4 py-3 text-black text-base outline-none ${
                      !save
                        ? "opacity-75 cursor-not-allowed"
                        : formErrors.username
                          ? "border border-red-500"
                          : ""
                    }`}
                  />
                  {formErrors.username && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.username}
                    </p>
                  )}
                </div>

                {/* Email - Always non-editable with lock icon */}
                <div>
                  <label className="block text-black text-base font-medium mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      disabled
                      className="w-full bg-[#E6F0FF] h-10 lg:h-[50px] rounded-[12px] px-4 py-3 text-black text-base outline-none opacity-60 cursor-not-allowed pr-10"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-left">
                {/* Phone Number - Editable in edit mode for verified users */}
                <div>
                  <label className="block text-black text-base font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => {
                      setformData({ ...formData, phone: e.target.value });
                      if (formErrors.phone)
                        setFormErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    readOnly={!save || needsVerification()}
                    className={`w-full bg-[#E6F0FF] h-10 lg:h-[50px] rounded-[12px] px-4 py-3 text-black text-base outline-none ${
                      !save || needsVerification()
                        ? "opacity-75 cursor-not-allowed"
                        : formErrors.phone
                          ? "border border-red-500"
                          : ""
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Residential Address - Editable in edit mode for verified users */}
                <div>
                  <label className="block text-black text-base font-medium mb-2">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => {
                      setformData({ ...formData, address: e.target.value });
                      if (formErrors.address)
                        setFormErrors((prev) => ({ ...prev, address: "" }));
                    }}
                    readOnly={!save || needsVerification()}
                    className={`w-full bg-[#E6F0FF] h-10 lg:h-[50px] rounded-[12px] px-4 py-3 text-black text-base outline-none ${
                      !save || needsVerification()
                        ? "opacity-75 cursor-not-allowed"
                        : formErrors.address
                          ? "border border-red-500"
                          : ""
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio - Editable in edit mode */}
              <div>
                <label className="block text-black text-base font-medium mb-2">
                  Bio
                </label>
                <textarea
                  rows={5}
                  value={formData.bio}
                  onChange={(e) => {
                    setformData({ ...formData, bio: e.target.value });
                    if (formErrors.bio)
                      setFormErrors((prev) => ({ ...prev, bio: "" }));
                  }}
                  readOnly={!save}
                  className={`w-full bg-[#E6F0FF] rounded-[12px] px-4 py-3 text-black text-base outline-none resize-none ${
                    !save
                      ? "opacity-75 cursor-not-allowed"
                      : formErrors.bio
                        ? "border border-red-500"
                        : ""
                  }`}
                />
                {formErrors.bio && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.bio}</p>
                )}
              </div>

              {!save && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="flex items-center justify-center cursor-pointer gap-2 bg-[#4681F4] border border-[#4681F4] group h-[50px] w-[171px] text-white hover:bg-[white] hover:text-[#4681F4] rounded-full text-[14px] transition-all duration-300"
                >
                  <div
                    className="w-6 h-6 text-white group-hover:text-[#4681F4]"
                    dangerouslySetInnerHTML={{ __html: EditIcon }}
                  />
                  Edit Profile
                </button>
              )}
              {save && (
                <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-[#E6F0FF] w-[88px] h-[34px] flex items-center justify-center text-black hover:bg-white hover:text-[#4681F4] hover:border hover:border-[#4681F4] cursor-pointer rounded-full text-[14px] duration-300 font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    loading={loading}
                    type="submit"
                    className="bg-[#4681F4] w-[88px] h-[34px] flex items-center justify-center cursor-pointer hover:bg-white hover:text-[#4681F4] border border-[#4681F4] text-white rounded-full text-[14px] font-bold duration-300 transition-all"
                  >
                    Save
                  </LoadingButton>
                </div>
              )}
            </form>
          </div>

          {/* Reviews Section */}
          <div className="w-full mt-12">
            <div className="bg-[#E6F0FF] rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-2xl md:text-[32px] font-semibold text-black">
                  Your Reviews ({reviews.length})
                </h3>
              </div>
              <p className="text-black text-left text-lg mb-6">
                This is the feedback you’ve received from other users.
              </p>
              {reviews.length === 0 && !isReviewsLoading ? (
                <div className="text-black text-base">No reviews yet.</div>
              ) : (
                <div className="flex flex-col md:flex-row flex-wrap gap-6">
                  {reviews.map((review, index) => {
                    const rating = Number(review.rating || 0);
                    return (
                      <div
                        key={review.id || index}
                        className="bg-white rounded-xl border border-[#E6E6E6] text-left p-4 flex flex-col md:flex-row gap-4 md:gap-2 shadow-sm min-w-[300px] flex-1"
                      >
                        <div className="w-full flex flex-col">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center">
                              <span className="flex gap-1">
                                {Array(5)
                                  .fill(0)
                                  .map((_, i) => (
                                    <img
                                      key={i}
                                      src="/star.svg"
                                      alt="star"
                                      className={`w-[19px] h-[18px] ${i < rating ? "opacity-100" : "opacity-20"}`}
                                    />
                                  ))}
                              </span>
                              <span className="text-base text-black ml-2">
                                {review.rating || "0"}
                              </span>
                            </div>
                            {!review.reply && (
                              <button
                                type="button"
                                onClick={() => openReplyModal(review)}
                                className="flex items-center justify-center group hover:bg-[#4681F4] cursor-pointer hover:text-white gap-1 bg-[#D0E3FF] text-black font-bold min-w-[77px] max-w-[90px] w-full h-[34px] rounded-full text-sm"
                              >
                                <div
                                  className="text-black group-hover:text-white"
                                  dangerouslySetInnerHTML={{
                                    __html: MessageIcon,
                                  }}
                                />
                                Reply
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {review.rated_by_pic || review.reviewer_profile_pic || review.profile_pic ? (
                              <img
                                src={review.rated_by_pic || review.reviewer_profile_pic || review.profile_pic}
                                alt={review.rated_by_name || review.reviewer_name || "Reviewer"}
                                className="w-10 h-10 rounded-full object-cover min-w-[40px]"
                              />
                            ) : (
                              <div className="w-10 h-10 min-w-[40px] rounded-full bg-[#4681F4] flex items-center justify-center text-white font-bold">
                                {(review.rated_by_name || review.reviewer_name || "A").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-bold text-lg text-[#4681F4]">
                              {review.rated_by_name ||
                                review.reviewer_name ||
                                "Anonymous"}
                            </span>
                          </div>
                          <div className="text-black text-base mt-1">
                            {review.comment || "No review comment provided."}
                          </div>
                          <div className="text-base mt-3">
                            {formatDate(
                              review.created_at || review.created_at_raw,
                            )}
                          </div>
                          {review.reply && (
                            <div className="mt-4 ms-6 rounded-xl border-l-[3px] border-[#4681F4] bg-[#D0E3FF] p-4">
                              <div className="flex items-center gap-2 font-semibold text-[#1F2937]">
                                <div
                                  className="text-[#4681F4]"
                                  dangerouslySetInnerHTML={{
                                    __html: MessageIcon,
                                  }}
                                />
                                Reply from {profile?.data?.username || "You"}
                              </div>
                              <p className="mt-2 text-[#1F2937]">
                                {review.reply}
                              </p>
                              <div className="mt-2 text-base">
                                {formatDate(review.replied_at)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-5">
                {!hasLoadedAllReviews && (
                  <button
                    type="button"
                    onClick={handleLoadAllReviews}
                    disabled={isReviewsLoading}
                    className="px-5 py-2 md:px-6 md:py-3 bg-[#4681F4] text-white rounded-full font-semibold hover:bg-[#3572e3] transition-colors duration-300 shadow-md text-sm md:text-base disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isReviewsLoading ? "Loading..." : "Load All Reviews"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div id="account">
            <AccountSetting />
          </div>
        </div>
      </section>
      {isReplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#E6F0FF] rounded-2xl w-[90%] max-w-lg p-6 relative">
            <button
              onClick={closeReplyModal}
              className="absolute top-4 right-4 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-[24px] font-semibold text-center">
              Reply to{" "}
              {selectedReview?.rated_by_name ||
                selectedReview?.reviewer_name ||
                "Reviewer"}
            </h2>
            <p className="text-center text-gray-500 font-normal text-sm mt-2">
              Add your response to this review
            </p>
            <div className="mt-4">
              <label className="text-[14px] font-normal">Your Reply</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full mt-2 border text-[14px] font-normal placeholder:text-[#666666] border-white p-3 rounded-[10px] text-[#666666] outline-none bg-[#D0E3FF] focus:ring-2 focus:ring-[#4681F4]"
                rows="4"
                placeholder="Write your reply..."
              />
            </div>
            <button
              onClick={handleSubmitReply}
              disabled={isReplySubmitting}
              className="w-full mt-4 bg-blue-500 hover:bg-blue-700 cursor-pointer text-white py-3 rounded-full font-bold text-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isReplySubmitting ? "Submitting..." : "Submit Reply"}
            </button>
            <button
              onClick={closeReplyModal}
              className="w-full mt-4 border py-3 rounded-full font-bold text-xl bg-[#D0E3FF] hover:bg-blue-300 border-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;
