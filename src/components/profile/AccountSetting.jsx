import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePasswordService } from "../../api/services/AuthService/auth";
import { usePopup } from "../../context/PopupContext";

const tabs = [
  "Change Password",
  //  "Notification Preferences",
  "Manage Subscription",
];

const AccountSetting = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Change Password");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [smsNotif, setSmsNotif] = useState(false);
  const [liveLocation, setLiveLocation] = useState(false);
  const [error, setError] = useState("");

  const { showPopup } = usePopup();

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (
      !formData.oldPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      setError("All fields are required");
      // showPopup('All fields are required', 'error');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match");
      // showPopup('New password and confirm password do not match', 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      // showPopup('Password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      await changePasswordService({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      showPopup("Password changed successfully!", "success");
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      // showPopup(err.response?.data?.message || 'Failed to change password. Please try again.', 'error');
      setError(
        err.response?.data?.message ||
          "Failed to change password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificationPreferences = async () => {
    try {
      // console.log('Saving preferences:', { emailNotif, pushNotif, smsNotif });
      showPopup("Notification preferences updated!", "success");
    } catch (err) {
      showPopup("Failed to update preferences", "error");
      console.log(err);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === "Manage Subscription") {
      navigate("/dashboard/subscriptions");
    } else {
      setActiveTab(tab);
    }
  };

  useEffect(() => {
    setError("");
  }, [activeTab]);

  useEffect(() => {
    setTimeout(() => {
      setError("");
    }, 5000);
  }, [error]);

  const renderContent = () => {
    if (activeTab === "Change Password") {
      return (
        <div className="mt-8">
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.oldPassword}
                onChange={(e) =>
                  setFormData({ ...formData, oldPassword: e.target.value })
                }
                placeholder="Old Password"
                className="w-full bg-[#E6F0FF] h-10 lg:h-[50px] rounded-[12px] px-4 py-3 text-black text-base outline-none pr-12"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M1.5 12C3.5 7 7.5 4 12 4C16.5 4 20.5 7 22.5 12C20.5 17 16.5 20 12 20C7.5 20 3.5 17 1.5 12Z"
                      stroke="black"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3.5"
                      stroke="black"
                      strokeWidth="2"
                    />
                  </svg>
                ) : (
                  <img src="/hide.svg" alt="hide" className="w-6 h-6" />
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                placeholder="New Password"
                className="w-full bg-[#E6F0FF] h-10 lg:h-[50px] rounded-[12px] px-4 py-3 text-black text-base outline-none pr-12"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
              >
                {showNewPassword ? (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M1.5 12C3.5 7 7.5 4 12 4C16.5 4 20.5 7 22.5 12C20.5 17 16.5 20 12 20C7.5 20 3.5 17 1.5 12Z"
                      stroke="black"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3.5"
                      stroke="black"
                      strokeWidth="2"
                    />
                  </svg>
                ) : (
                  <img src="/hide.svg" className="w-6 h-6" alt="hide" />
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="Confirm Password"
                className="w-full bg-[#E6F0FF] h-10 lg:h-[50px] rounded-[12px] px-4 py-3 text-black text-base outline-none pr-12"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
              >
                {showConfirmPassword ? (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M1.5 12C3.5 7 7.5 4 12 4C16.5 4 20.5 7 22.5 12C20.5 17 16.5 20 12 20C7.5 20 3.5 17 1.5 12Z"
                      stroke="black"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3.5"
                      stroke="black"
                      strokeWidth="2"
                    />
                  </svg>
                ) : (
                  <img src="/hide.svg" className="w-6 h-6" alt="hide" />
                )}
              </button>
            </div>

            <div className="text-red-500">{error}</div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#4681F4] hover:bg-[#3570e0] text-white px-6 h-10 lg:h-[50px] rounded-full text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      );
    }

    if (activeTab === "Notification Preferences") {
      return (
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#E6F0FF] rounded-xl p-4 md:p-6 flex flex-col gap-2.5">
              <div className="w-full flex items-center justify-between">
                <div className="font-bold text-base md:text-xl">
                  Email Notifications
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={() => setEmailNotif(!emailNotif)}
                    className="sr-only"
                  />
                  <div
                    className={`w-[49px] h-[28px] flex items-center ${emailNotif ? "bg-[#4681F4]" : "bg-[#666666]"} rounded-full p-1 transition-colors`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${emailNotif ? "translate-x-6" : ""}`}
                    />
                  </div>
                </label>
              </div>
              <div className="text-base text-[#666666]">
                Receive updates about new messages and package status.
              </div>
            </div>

            <div className="bg-[#E6F0FF] rounded-xl p-4 md:p-6 gap-4 flex-col flex ">
              <div className="w-full flex items-center justify-between">
                <div className="font-bold text-base md:text-xl">
                  Push Notifications
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushNotif}
                    onChange={() => setPushNotif(!pushNotif)}
                    className="sr-only"
                  />
                  <div
                    className={`w-[49px] h-[28px] flex items-center ${pushNotif ? "bg-[#4681F4]" : "bg-[#666666]"} rounded-full p-1 transition-colors`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${pushNotif ? "translate-x-6" : ""}`}
                    />
                  </div>
                </label>
              </div>
              <div className="text-base text-[#666666]">
                Get real-time alerts on your mobile device (if app installed).
              </div>
            </div>

            <div className="bg-[#E6F0FF] rounded-xl p-4 md:p-6 gap-2.5 flex-col flex">
              <div className="w-full flex items-center justify-between">
                <div className="font-bold text-base md:text-xl">
                  SMS Notifications
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsNotif}
                    onChange={() => setSmsNotif(!smsNotif)}
                    className="sr-only"
                  />
                  <div
                    className={`w-[49px] h-[28px] flex items-center ${smsNotif ? "bg-[#4681F4]" : "bg-[#666666]"} rounded-full p-1 transition-colors`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${smsNotif ? "translate-x-6" : ""}`}
                    />
                  </div>
                </label>
              </div>
              <div className="text-base text-[#666666]">
                Toggle SMS updates and alerts.
              </div>
            </div>

            <div className="bg-[#E6F0FF] rounded-xl p-4 md:p-6 gap-2.5 flex-col flex">
              <div className="w-full flex items-center justify-between">
                <div className="font-bold text-base md:text-xl">
                  Live Location Sharing
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={liveLocation}
                    onChange={() => setLiveLocation(!liveLocation)}
                    className="sr-only"
                  />
                  <div
                    className={`w-[49px] h-[28px] flex items-center ${liveLocation ? "bg-[#4681F4]" : "bg-[#666666]"} rounded-full p-1 transition-colors`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${liveLocation ? "translate-x-6" : ""}`}
                    />
                  </div>
                </label>
              </div>
              <div className="text-base text-[#666666]">
                Allow Your Live Location to be shared with senders while you are
                on a trip.
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSaveNotificationPreferences}
              className="bg-[#4681F4] hover:bg-[#3570e0] text-white px-6 h-10 lg:h-[50px] rounded-full text-xl transition-all"
            >
              Save Preferences
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <section className="w-full flex flex-col items-center py-8 px-2">
      <div className="w-full mx-auto text-center md:text-left">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
          Account Settings
        </h2>
        <p className="text-[#5F6C85] text-base md:text-lg mb-8">
          View and manage your account details.
        </p>

        <div className="w-full flex items-center justify-between gap-5 flex-col lg:flex-row mb-8">
          <div className="w-full ">
            <div className="flex gap-3 min-w-max whitespace-nowrap">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={` w-full h-10 lg:h-[50px] 
px-3 py-2 md:px-4 md:py-2.5 
text-sm md:text-base lg:text-xl 
hover:bg-[#4681F4] cursor-pointer hover:text-white 
rounded-full transition-all mb-4 md:mb-0
                    ${
                      activeTab === tab && tab !== "Manage Subscription"
                        ? "bg-[#4681F4]  text-white"
                        : tab === "Manage Subscription"
                          ? "bg-[#E6F0FF] text-black"
                          : "bg-[#E6F0FF] text-black"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {renderContent()}
      </div>
    </section>
  );
};

export default AccountSetting;
