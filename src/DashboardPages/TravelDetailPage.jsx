import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Map from "../components/Track/Map";
import { viewTravelPlansService } from "../api/services/TravelPlansService/Travelplan";
import {
  ConfirmDeliveryCodeService,
  ConfirmPickupService,
  ShipmentsTrackService,
} from "../api/services/TrackPackageService/TrackPackage";
import ConfirmationModal from "../components/Common/ConfirmationModal";
import OpenDisputeModal from "../components/Disputes/OpenDisputeModal";
import CreateFormalCaseModal from "../components/Disputes/CreateFormalCaseModal";

const TravelDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [travelData, setTravelData] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [deliveryCode, setDeliveryCode] = useState("");
  const [pickupLoading, setPickupLoading] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [travelerLocation, setTravelerLocation] = useState(null);
  const [showOpenDisputeModal, setShowOpenDisputeModal] = useState(false);
  const [showFormalCaseModal, setShowFormalCaseModal] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    const getSuffix = (d) => {
      if (d > 3 && d < 21) return "th";
      switch (d % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${day}${getSuffix(day)} ${month}, ${year}`;
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "upcoming":
        return { color: "text-[#F4B846]" };
      case "in progress":
      case "in transit":
        return { color: "text-[#4681F4]" };
      case "completed":
      case "delivered":
        return { color: "text-[#05B71A]" };
      default:
        return { color: "text-[#666666]" };
    }
  };

  const getPackageStatusBadge = (status) => {
    switch (status) {
      case "Pending Pickup":
        return {
          bg: "bg-[#F4B846]",
          text: "text-black",
          border: "border-[#F4B846]",
        };
      case "In Transit":
        return {
          bg: "bg-[#D0E3FF]",
          text: "text-[#4681F4]",
          border: "border-[#4681F4]",
        };
      case "Delivered":
        return {
          bg: "bg-[#05B71A]",
          text: "text-white",
          border: "border-white",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          border: "border-gray-300",
        };
    }
  };

  const fetchTravelPlanDetails = async (id) => {
    setFetchLoading(true);
    try {
      const response = await viewTravelPlansService(id);
      if (response.data.success) {
        setTravelData(response.data.travel_plan);
      } else {
        setError(response.data.message);
      }
    } catch {
      setError("Error fetching travel plan details");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    const travelId = location.state?.travel_id;
    if (travelId) fetchTravelPlanDetails(travelId);
    else setError("No travel plan ID provided");
  }, [location]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTravelerLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setTravelerLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  const handleConfirmDelivery = (pkg) => {
    setSelectedPackage(pkg);
    setShowDeliveryModal(true);
  };

  const handleOpenPickupModal = (pkg) => {
    setSelectedPackage(pkg);
    setShowPickupModal(true);
  };

  const handleReportIssue = (pkg) => {
    setSelectedPackage(pkg);
    // In TravelDetailPage, the viewer is the traveler. Open formal case directly.
    setShowFormalCaseModal(true);
  };

  const handleOpenFormalCase = () => {
    setShowOpenDisputeModal(false);
    setShowFormalCaseModal(true);
  };

  const handleFormalCaseSubmit = (responseData) => {
    setShowFormalCaseModal(false);
    const newDisputeId = responseData?.data?.id;
    if (newDisputeId) {
      navigate("/dashboard/dispute-detail", {
        state: { disputeId: newDisputeId },
      });
    } else {
      navigate("/dashboard/resolution-center");
    }
  };

  const handleClosePickupModal = () => {
    setShowPickupModal(false);
    setSelectedPackage(null);
  };

  const handleConfirmPickup = async () => {
    const trackingNumber = selectedPackage?.tracking_number;
    if (!trackingNumber) {
      alert("Tracking number not found for this package");
      return;
    }

    setPickupLoading(true);
    try {
      const response = await ConfirmPickupService(trackingNumber);
      if (response?.data?.success) {
        await fetchTravelPlanDetails(travelData?.id);
      } else {
        alert(response?.data?.message || "Unable to confirm pickup");
      }
    } catch {
      alert("Error confirming pickup");
    } finally {
      setPickupLoading(false);
      handleClosePickupModal();
    }
  };

  const handleDeliverySubmit = async () => {
    if (!deliveryCode.trim()) {
      alert("Please enter the delivery code");
      return;
    }

    const trackingNumber = selectedPackage?.tracking_number;
    if (!trackingNumber) {
      alert("Tracking number not found for this package");
      return;
    }

    setDeliveryLoading(true);
    try {
      const response = await ConfirmDeliveryCodeService({
        tracking_number: trackingNumber,
        delivery_code: deliveryCode.trim(),
      });

      if (response?.data?.success) {
        await fetchTravelPlanDetails(travelData?.id);
        setShowDeliveryModal(false);
        setSelectedPackage(null);
        setDeliveryCode("");
      } else {
        alert(response?.data?.message || "Unable to confirm delivery");
      }
    } catch {
      alert("Error confirming delivery");
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleScanQR = () => {
    // console.log("Scan QR code for package:", selectedPackage?.id);
  };

  const handleViewProfile = async (pkg) => {
    const userId = pkg.user_id || pkg.sender_id;
    if (!userId) {
      alert("User ID not found for this profile.");
      return;
    }

    try {
      const { getTravelerProfileService } =
        await import("../api/services/SearchTravelersService/SearchTravelers");
      const res = await getTravelerProfileService(userId);
      if (res?.data?.success) {
        sessionStorage.setItem(
          "selectedTravellerProfile",
          JSON.stringify({
            travellerProfile: res.data.data,
            travellerId: userId,
          }),
        );
        navigate("/dashboard/user-profile", {
          state: {
            travellerProfile: res.data.data,
            travellerId: userId,
            travelerData: pkg,
            hideBookButton: true,
          },
        });
      } else {
        alert("Failed to load profile details.");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      alert("Error fetching profile details.");
    }
  };

  const renderPackageSection = () => {
    const packages = travelData.packages || [];

    if (packages.length === 0) {
      return (
        <div className="bg-[#EAF3FF] rounded-[20px] p-6 md:p-8 shadow-sm text-center flex justify-between flex-col md:text-left">
          <div>
            <h3 className="text-lg md:text-[22px] xl:text-3xl font-semibold text-black mb-2">
              No Packages
            </h3>
            <p className="text-[#5F6C85] mb-6">
              No Packages are associated with this trip yet.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/find-shipments")}
            className="bg-[#4681F4] w-full h-[50px] hover:bg-white hover:text-[#4681F4] border border-[#4681F4] text-white font-bold cursor-pointer rounded-full text-xl transition-all duration-300"
          >
            Find a Shipment to Carry
          </button>
        </div>
      );
    }

    const awaitingPayment = packages.filter((pkg) => pkg.status === "Accepted");
    const associatedPackages = packages.filter(
      (pkg) => pkg.status !== "Accepted",
    );
    const pendingPickup = packages.filter(
      (pkg) => pkg.status === "Pending Pickup",
    );
    const inTransit = packages.filter((pkg) => pkg.status === "In Transit");
    const delivered = packages.filter((pkg) => pkg.status === "Delivered");
    const cancelled = packages.filter((pkg) => pkg.status === "Cancelled");
    // console.log(packages);

    return (
      <div className="bg-[#EAF3FF] rounded-[20px] p-6 md:p-8 shadow-sm">
        <h3 className="text-lg md:text-[22px] xl:text-3xl font-semibold mb-4">
          Associated Packages ({associatedPackages.length})
        </h3>

        {awaitingPayment?.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-lg mb-3">
              Packages on Board ({awaitingPayment.length})
            </h4>
            {awaitingPayment.map((pkg) => {
              const statusStyle = getPackageStatusBadge(pkg.status);
              return (
                <div key={pkg.id} className="mb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1">
                    <p className="font-bold text-black text-lg">
                      {pkg.contents}
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/dashboard/package-detail/${pkg.id}`)
                      }
                      className="w-full md:w-[115px] mt-1 md:mt-0 whitespace-nowrap bg-[#D0E3FF] text-[#4681F4] py-1 cursor-pointer rounded-full text-sm text-center hover:text-white hover:bg-blue-600 transition-colors"
                    >
                      View Package
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mt-1">
                        From: {pkg.sender_first_name} {pkg.sender_last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        To: {pkg.recipient_name}
                      </p>
                    </div>
                    <span
                      className={`inline-block mt-2 md:mt-0 px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
                    >
                      {pkg.status === "Accepted"
                        ? "Awaiting Payment"
                        : pkg.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pendingPickup?.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-lg mb-3">
              Upcoming Pickups ({pendingPickup.length})
            </h4>
            {pendingPickup.map((pkg) => {
              const statusStyle = getPackageStatusBadge(pkg.status);
              return (
                <div key={pkg.id} className="mb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <p className="font-bold text-black text-lg">
                      {pkg.contents}
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/dashboard/package-detail/${pkg.id}`)
                      }
                      className="w-full md:w-[115px] mt-1 md:mt-0 whitespace-nowrap bg-[#D0E3FF] text-[#4681F4] py-1 cursor-pointer rounded-full text-sm text-center hover:text-white hover:bg-blue-600 transition-colors"
                    >
                      View Package
                    </button>
                  </div>
                  <div className="flex md:justify-end mt-1">
                    <button
                      onClick={() => handleViewProfile(pkg)}
                      className="w-full md:w-[115px] whitespace-nowrap bg-[#D0E3FF] text-[#4681F4] py-1 cursor-pointer rounded-full text-sm text-center hover:text-white hover:bg-blue-600 transition-colors"
                    >
                      View Profile
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-1">
                    <div>
                      <p className="text-sm text-gray-600 mt-1">
                        From: {pkg.sender_first_name} {pkg.sender_last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        To: {pkg.recipient_name}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                      <div className="flex-1 md:flex-none md:w-[124px]">
                        <span
                          className={`flex whitespace-nowrap items-center justify-center w-full py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
                        >
                          {pkg.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenPickupModal(pkg)}
                        className="flex-1 md:flex-none md:w-[130px] whitespace-nowrap bg-[#4681F4] px-1 py-1 hover:bg-white hover:text-[#4681F4] border border-[#4681F4] text-white font-bold cursor-pointer rounded-full text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Confirm Pickup
                      </button>
                    </div>
                  </div>
                  {(!pkg.dispute?.id || pkg.dispute?.status !== "Pending") && (
                    <div className="flex mt-2 md:justify-end">
                      <button
                        onClick={() => handleReportIssue(pkg)}
                        className="w-full md:w-[262px] py-1.5 bg-[#EF4444] text-white border-[#EF4444] rounded-full text-base justify-center font-semibold flex items-center gap-2 hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        Report an issue
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {inTransit?.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-lg mb-3">
              Packages on Board ({inTransit.length})
            </h4>
            {inTransit.map((pkg) => {
              const statusStyle = getPackageStatusBadge(pkg.status);
              return (
                <div key={pkg.id} className="mb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <p className="font-bold text-black text-lg">
                      {pkg.contents}
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/dashboard/package-detail/${pkg.id}`)
                      }
                      className="w-full md:w-[115px] mt-1 md:mt-0 whitespace-nowrap bg-[#D0E3FF] text-[#4681F4] py-1 cursor-pointer rounded-full text-sm text-center hover:text-white hover:bg-blue-600 transition-colors"
                    >
                      View Package
                    </button>
                  </div>
                  <div className="flex md:justify-end mt-1">
                    <button
                      onClick={() => handleViewProfile(pkg)}
                      className="w-full md:w-[115px] whitespace-nowrap bg-[#D0E3FF] text-[#4681F4] py-1 cursor-pointer rounded-full text-sm text-center hover:text-white hover:bg-blue-600 transition-colors"
                    >
                      View Profile
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-1">
                    <div>
                      <p className="text-sm text-gray-600 mt-1">
                        From: {pkg.sender_first_name} {pkg.sender_last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        To: {pkg.recipient_name}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                      <div className="flex-1 md:flex-none md:w-[124px]">
                        <span
                          className={`flex whitespace-nowrap items-center justify-center w-full py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
                        >
                          {pkg.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleConfirmDelivery(pkg)}
                        className="flex-1 md:flex-none md:w-[130px] whitespace-nowrap bg-[#4681F4] px-1 py-1 hover:bg-white hover:text-[#4681F4] border border-[#4681F4] text-white font-bold cursor-pointer rounded-full text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Confirm Delivery
                      </button>
                    </div>
                  </div>
                  {(!pkg.dispute?.id || pkg.dispute?.status !== "Pending") && (
                    <div className="flex mt-2 md:justify-end">
                      <button
                        onClick={() => handleReportIssue(pkg)}
                        className="w-full md:w-[262px] py-1.5 bg-[#EF4444] text-white border-[#EF4444] rounded-full text-base justify-center font-semibold flex items-center gap-2 hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        Report an issue
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {delivered?.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-[#05B71A]">
              Delivered
            </h4>
            {delivered.map((pkg) => {
              const statusStyle = getPackageStatusBadge(pkg.status);
              return (
                <div key={pkg.id} className="mb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1">
                    <p className="font-bold text-black text-lg">
                      {pkg.contents}
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/dashboard/package-detail/${pkg.id}`)
                      }
                      className="w-full md:w-[115px] mt-1 md:mt-0 whitespace-nowrap bg-[#D0E3FF] text-[#4681F4] py-1 cursor-pointer rounded-full text-sm text-center hover:text-white hover:bg-blue-600 transition-colors"
                    >
                      View Package
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mt-1">
                        From: {pkg.sender_first_name} {pkg.sender_last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        To: {pkg.recipient_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
                      >
                        {pkg.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {cancelled?.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-[#05B71A]">
              Canceled
            </h4>
            {cancelled.map((pkg) => {
              const statusStyle = getPackageStatusBadge(pkg.status);
              return (
                <div key={pkg.id} className="mb-4">
                  <p className="font-bold text-black text-lg mb-1">
                    {pkg.contents}
                  </p>
                  <div className="text-sm text-gray-600 mb-2">
                    <p>
                      From: {pkg.sender_first_name} {pkg.sender_last_name}
                    </p>
                    <p>To: {pkg.recipient_name}</p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
                  >
                    {pkg.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (fetchLoading)
    return <div className="p-10 text-center">Loading travel details...</div>;
  if (error) return <p className="text-red-500 p-10 text-center">{error}</p>;
  if (!travelData) return null;

  const statusStyle = getStatusStyle(travelData.status);

  return (
    <>
      <section className="w-full px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">
            Travel Details: #{travelData.id}
          </h2>
          <p className="text-gray-500">
            A summary of your trip from {travelData.origin} to{" "}
            {travelData.destination}.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#EAF3FF] p-6 rounded-[20px]">
            <h3 className="text-lg md:text-2xl xl:text-3xl font-semibold mb-4">
              Trip Information
            </h3>

            <p>
              <strong>From:</strong> {travelData.origin}
            </p>
            <p>
              <strong>To:</strong> {travelData.destination}
            </p>

            <hr className="my-3" />

            <p>
              <strong>Departure:</strong>{" "}
              {formatDate(travelData.departure_date)}
            </p>
            <p>
              <strong>Est. Arrival:</strong>{" "}
              {travelData.estimated_arrival_date
                ? formatDate(travelData.estimated_arrival_date)
                : "Not specified"}
            </p>

            <hr className="my-3" />

            <p>
              <strong>Status:</strong>
              <span className={`ml-2 ${statusStyle.color}`}>
                {travelData.status}
              </span>
            </p>
          </div>

          {renderPackageSection()}
        </div>
      </section>

      <Map
        travelerLocation={travelerLocation}
        origin={travelData?.origin}
        destination={travelData?.destination}
      />

      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000]">
          <div className="bg-[#E9EEF6] w-[400px] rounded-3xl p-6 text-center shadow-xl">
            <h2 className="text-2xl font-semibold mb-3">
              Confirm Package Handover
            </h2>
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">
              Ask the recipient for their confirmation code to complete the
              delivery. You can either scan their{" "}
              <span className="underline">QR Code</span> or enter the
              alphanumeric code manually.
            </p>
            <button
              onClick={handleScanQR}
              className="w-full border border-gray-300 rounded-full py-3 flex items-center justify-center gap-2 mb-4 bg-[#DCE6F5] hover:bg-[#d0dbef] transition-colors"
            >
              <span className="text-lg">📷</span>
              <span className="font-medium">Scan Recipient's QR Code</span>
            </button>
            <p className="font-semibold mb-2">Or</p>
            <p className="text-sm text-gray-700 mb-2">
              Enter Alphanumeric Code
            </p>
            <input
              type="text"
              value={deliveryCode}
              onChange={(e) => setDeliveryCode(e.target.value)}
              placeholder="e.g., TRN-8XB3"
              className="w-full rounded-full px-4 py-3 mb-5 bg-[#DCE6F5] outline-none placeholder-gray-500"
            />

            <button
              onClick={handleDeliverySubmit}
              disabled={deliveryLoading}
              className="w-full bg-blue-500 text-white py-3 rounded-full font-semibold mb-3 hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deliveryLoading ? "Confirming..." : "Confirm & Complete"}
            </button>

            <button
              onClick={() => {
                setShowDeliveryModal(false);
                setSelectedPackage(null);
                setDeliveryCode("");
              }}
              className="w-full py-3 rounded-full border border-gray-300 bg-[#DCE6F5] hover:bg-[#d0dbef] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showPickupModal}
        onClose={() => {
          if (!pickupLoading) handleClosePickupModal();
        }}
        onConfirm={handleConfirmPickup}
        title="Confirm Pickup"
        message="Are you sure you want to confirm this package pickup?"
        confirmText="Confirm Pickup"
        cancelText="Cancel"
        confirmButtonClass="bg-[#4681F4] text-white hover:bg-blue-600"
        cancelButtonClass="bg-[#E6F0FF] text-black hover:bg-[#D0E3FF]"
        isLoading={pickupLoading}
      />

      <OpenDisputeModal
        isOpen={showOpenDisputeModal}
        onClose={() => setShowOpenDisputeModal(false)}
        travelerName={"the traveler"}
        onOpenFormalCase={handleOpenFormalCase}
      />

      <CreateFormalCaseModal
        isOpen={showFormalCaseModal}
        onClose={() => setShowFormalCaseModal(false)}
        packageId={selectedPackage?.id}
        trackingNumber={selectedPackage?.tracking_number}
        userType={"traveler"}
        senderId={selectedPackage?.user_id || selectedPackage?.sender_id}
        travelerId={travelData?.user_id}
        onSubmit={handleFormalCaseSubmit}
        hasInsurance={Number(selectedPackage?.insurance_premium) > 0}
      />
    </>
  );
};

export default TravelDetailPage;
