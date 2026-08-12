import { useState, useEffect } from "react";
import { DeleteUser } from "../api/services/DeleteUserService/DeleteUser";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import ConfirmationModal from "../components/Common/ConfirmationModal";
import LoadingButton from "../components/Common/LoadingButton";
import { useProfile } from "../context/ProfileContext";
import { saveNotificationPreferencesService } from "../api/services/ProfileService/profileServices";

const Setting = () => {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const { profile, fetchProfile } = useProfile();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [smsNotif, setSmsNotif] = useState(false);
  const [liveLocation, setLiveLocation] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      const data = profile.data || profile;
      console.log("Full Profile Object in Settings:", profile);
      
      // Try to find the keys in various possible locations
      const prefs = data.notification_preferences || data;
      const emailVal = prefs.email_notification ?? prefs.emailNotification;
      const smsVal = prefs.sms_notification ?? prefs.smsNotification;

      if (emailVal !== undefined && emailVal !== null) {
        setEmailNotif(
          emailVal === true || emailVal === 1 || emailVal === "1" || emailVal === "true"
        );
      } else {
        setEmailNotif(true); // default
      }

      if (smsVal !== undefined && smsVal !== null) {
        setSmsNotif(
          smsVal === true || smsVal === 1 || smsVal === "1" || smsVal === "true"
        );
      } else {
        setSmsNotif(false); // default
      }
    }
  }, [profile]);

  const handleSaveNotificationPreferences = async () => {
    try {
      setLoading(true);
      const payload = {
        email_notification: emailNotif,
        sms_notification: smsNotif,
      };
      const res = await saveNotificationPreferencesService(payload);
      if (res.data?.success || res.success || res.status === 200) {
        showPopup("Notification preferences saved successfully", "success", 2000);
        await fetchProfile();
      } else {
        showPopup(res.data?.message || "Failed to save preferences", "error", 2000);
      }
    } catch (error) {
      console.error("Save notification preferences error:", error);
      showPopup("Failed to save preferences", "error", 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await DeleteUser();
      if (res.status === 200 || res.status === 204) {
        Cookies.remove("token");
        navigate("/login");
        showPopup("Account deleted successfully", "success", 2000);
      } else {
        showPopup("Failed to delete account", "error", 2000);
      }
    } catch (error) {
      console.error("Delete user error:", error);
      showPopup("Failed to delete account", "error", 2000);
    }
  };

  return (
    <section className="w-full flex flex-col items-center py-8 px-4">
      <div className="w-full mx-auto">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
          Settings
        </h2>
        <p className="text-[#5F6C85] text-base md:text-lg mb-6 lg:mb-10">
          Manage your application preferences and account settings.
        </p>
        <div className="w-full flex gap-2 items-center mb-5 md:mb-7.5">
          <img src="/reward.svg" alt="reward" />
          <h3 className="text-2xl md:text-[32px] text-[#2B6CE4] font-semibold">
            Pro Traveller Subscription
          </h3>
        </div>

        <div className="bg-[#E6F0FF] rounded-[20px] p-6 mb-6 flex flex-col gap-5 md:flex-row items-center justify-between">
          <div>
            <div className="font-bold text-xl flex gap-2 mb-2.5 md:text-2xl">
              <img src="/pro-star.svg" alt="star" />
              You are a Pro Traveller!
            </div>
            <div className="text-sm  text-[#666666]">
              Your current plan is Annual. It renews on the Oct 2, 2025.
            </div>
          </div>
          <button className="bg-[#4681F4] w-full md:w-[280px] h-[50px] text-[#F8FAFC] hover:bg-white hover:text-[#4681F4] font-bold text-xl flex items-center justify-center cursor-pointer transition-all duration-200 border border-[#4681F4] rounded-full">
            Manage Subscription
          </button>
        </div>

        <div className="mt-8 w-full">
          <h3 className="text-2xl md:text-[32px] font-semibold text-black mb-6">
            Notification Preferences
          </h3>
          <div className="flex flex-col gap-4 mb-6">
            {/* Email Notifications */}
            <div className="border border-[#E2E8F0] rounded-[20px] p-5 md:p-6 flex items-center justify-between bg-white shadow-sm transition-all duration-200">
              <div className="flex flex-col gap-1 pr-4">
                <span className="font-bold text-lg md:text-xl text-black">
                  Email Notifications
                </span>
                <span className="text-[#666666] text-sm md:text-base leading-normal">
                  Receive updates about new messages and package status.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={emailNotif}
                  onChange={() => setEmailNotif(!emailNotif)}
                  className="sr-only peer"
                />
                <div
                  className={`w-[52px] h-[32px] rounded-full p-1 transition-colors duration-200 ease-in-out ${emailNotif ? "bg-[#2B6CE4]" : "bg-[#737373]"} flex items-center`}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform duration-200 ease-in-out ${emailNotif ? "translate-x-5" : "translate-x-0"}`}
                  />
                </div>
              </label>
            </div>

            {/* Push Notifications */}
            {/* <div className="border border-[#E2E8F0] rounded-[20px] p-5 md:p-6 flex items-center justify-between bg-white shadow-sm transition-all duration-200">
              <div className="flex flex-col gap-1 pr-4">
                <span className="font-bold text-lg md:text-xl text-black">
                  Push Notifications
                </span>
                <span className="text-[#666666] text-sm md:text-base leading-normal">
                  Get real-time alerts on your mobile device (if app installed).
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={pushNotif}
                  onChange={() => setPushNotif(!pushNotif)}
                  className="sr-only peer"
                />
                <div
                  className={`w-[52px] h-[32px] rounded-full p-1 transition-colors duration-200 ease-in-out ${pushNotif ? "bg-[#2B6CE4]" : "bg-[#737373]"} flex items-center`}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform duration-200 ease-in-out ${pushNotif ? "translate-x-5" : "translate-x-0"}`}
                  />
                </div>
              </label>
            </div> */}

            {/* SMS Notifications */}
            <div className="border border-[#E2E8F0] rounded-[20px] p-5 md:p-6 flex items-center justify-between bg-white shadow-sm transition-all duration-200">
              <div className="flex flex-col gap-1 pr-4">
                <span className="font-bold text-lg md:text-xl text-black">
                  SMS Notifications
                </span>
                <span className="text-[#666666] text-sm md:text-base leading-normal">
                  Toggle between light and dark themes.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={smsNotif}
                  onChange={() => setSmsNotif(!smsNotif)}
                  className="sr-only peer"
                />
                <div
                  className={`w-[52px] h-[32px] rounded-full p-1 transition-colors duration-200 ease-in-out ${smsNotif ? "bg-[#2B6CE4]" : "bg-[#737373]"} flex items-center`}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform duration-200 ease-in-out ${smsNotif ? "translate-x-5" : "translate-x-0"}`}
                  />
                </div>
              </label>
            </div>

            {/* Live Location Sharing */}
            {/* <div className="border border-[#E2E8F0] rounded-[20px] p-5 md:p-6 flex items-center justify-between bg-white shadow-sm transition-all duration-200">
              <div className="flex flex-col gap-1 pr-4">
                <span className="font-bold text-lg md:text-xl text-black">
                  Live Location Sharing
                </span>
                <span className="text-[#666666] text-sm md:text-base leading-normal">
                  Allow Your Live Location to be shared with senders while you are on a trip.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={liveLocation}
                  onChange={() => setLiveLocation(!liveLocation)}
                  className="sr-only peer"
                />
                <div className={`w-[52px] h-[32px] rounded-full p-1 transition-colors duration-200 ease-in-out ${liveLocation ? 'bg-[#2B6CE4]' : 'bg-[#737373]'} flex items-center`}>
                  <div className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform duration-200 ease-in-out ${liveLocation ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </label>
            </div> */}
          </div>

          <LoadingButton
            loading={loading}
            onClick={handleSaveNotificationPreferences}
            className="bg-[#2B6CE4] w-full md:w-[280px] h-[50px] text-white hover:bg-white hover:text-[#2B6CE4] font-bold text-xl flex items-center justify-center cursor-pointer transition-all duration-200 border border-[#2B6CE4] rounded-full mb-8"
          >
            Save Preferences
          </LoadingButton>
        </div>

        <div className="bg-[#E6F0FF] rounded-xl p-6 xl:p-10 mb-6 flex-col gap-5 md:flex-row flex items-center justify-between">
          <div className="font-semibold  text-xl md:text-[32px]">
            Account Settings
          </div>
          <button
            onClick={() =>
              navigate("/dashboard/profile", { state: { section: "account" } })
            }
            className="bg-[#F4B846] w-full md:w-[280px] h-[50px] text-black hover:bg-white hover:text-[#F4B846] font-bold text-xl flex items-center justify-center cursor-pointer transition-all duration-200 border border-[#F4B846] rounded-full"
          >
            Change Password
          </button>
        </div>

        <div className="border border-[#EF4444] rounded-xl p-6 flex-col gap-5 md:flex-row flex items-center justify-between">
          <div>
            <div className="text-xl md:text-[32px] font-semibold text-[#EF4444]">
              Delete Account
            </div>
            <div className="text-base text-black">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </div>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-[#EF4444] w-full md:w-[280px] h-[50px] text-[#F8FAFC] hover:bg-white hover:text-[#EF4444] font-bold text-xl flex items-center justify-center cursor-pointer transition-all duration-200 border border-[#EF4444] rounded-full"
          >
            Delete My Account
          </button>
        </div>
        {showDeleteModal ? (
          <div>
            <ConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleDelete}
              title="Delete Account"
              message="Are you sure you want to delete your account? This action cannot be undone."
              confirmText="Delete"
              cancelText="Cancel"
              confirmButtonClass="bg-[#EF4444] text-white hover:bg-red-600"
              cancelButtonClass="bg-[#E6F0FF] text-black hover:bg-[#D0E3FF]"
            />
          </div>
        ) : (
          <></>
        )}
      </div>
    </section>
  );
};

export default Setting;
