import React, { useState } from "react";
import { ProFile } from "../../assets/icons";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";

import { ConfirmPickupService } from "../../api/services/TrackPackageService/TrackPackage";
import { getTravelerProfileService } from "../../api/services/SearchTravelersService/SearchTravelers";
import { RatingsService } from "../../api/services/DashboardService/ShipmentHistory";

const PackageTracker = ({ shipmentData, profile }) => {
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localReviewSubmitted, setLocalReviewSubmitted] = useState(false);
  console.log(shipmentData?.traveller?.id, profile?.data?.id);
  const shouldShowTraveler =
    String(shipmentData?.traveller?.id) !== String(profile?.data?.id);
  const shouldShowPickup =
    String(shipmentData?.trackingHistory[0]?.status) === "Pending Pickup" &&
    String(shipmentData?.traveller?.id) === String(profile?.data?.id);
  const shouldShowInTransit =
    String(shipmentData?.trackingHistory[0]?.status) === "In Transit" &&
    String(shipmentData?.traveller?.id) === String(profile?.data?.id);
  const shouldShowDelivery =
    shipmentData?.delivery_code &&
    shipmentData?.traveller?.id !== profile?.data?.id &&
    String(shipmentData?.trackingHistory[0]?.status) !== "Delivered";

  const isTraveller =
    String(shipmentData?.traveller?.id) === String(profile?.data?.id);
  const reviewName = isTraveller
    ? shipmentData?.sender_name
    : shipmentData?.traveller?.name || shipmentData?.sender_name;

  const postRating = async () => {
    try {
      setIsSubmitting(true);
      const res = await RatingsService({
        rating,
        comment,
        pkg_id: shipmentData?.package_id,
      });
      if (res && (res.status === 200 || res.status === 201)) {
        setIsModalOpen(false);
        setLocalReviewSubmitted(true);
        setRating(5);
        setComment("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewTravellerProfile = async () => {
    const travellerId = shipmentData?.traveller?.id;
    if (!travellerId) return;
    try {
      const res = await getTravelerProfileService(travellerId);
      const profileData = res?.data?.data;
      sessionStorage.setItem(
        "selectedTravellerProfile",
        JSON.stringify({
          travellerProfile: profileData,
          travellerId: travellerId,
        }),
      );
      navigate("/dashboard/user-profile", {
        state: {
          travellerProfile: profileData,
          travellerId: travellerId,
          hideBookButton: true,
        },
      });
    } catch (error) {
      console.error("Error fetching traveler profile:", error);
    }
  };

  return (
    <section className="w-full">
      {/* Top Title Section */}
      <div className="mb-6 text-center md:text-left">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black">
          Track Package:{" "}
          <span className="font-bold">#{shipmentData?.tracking_number}</span>
        </h2>
        <p className="text-[#5F6C85] text-base md:text-lg">
          {shipmentData?.contents}
        </p>
      </div>

      {/* Card Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center md:text-left">
        {/* Package Details Card */}
        <div className="bg-[#EAF3FF] rounded-[20px] p-6 md:p-8 shadow-sm">
          <h3 className="text-lg md:text-[22px] font-semibold text-black mb-4">
            Package Details
          </h3>
          <div className="space-y-1 text-base text-black text-left">
            <p>
              <strong className="text-lg font-bold">From:</strong>{" "}
              {shipmentData.from}
            </p>
            <p>
              <strong className="text-lg font-bold">Sender:</strong>{" "}
              {shipmentData.sender_name}
            </p>
            <p>
              <strong className="text-lg font-bold">To:</strong>{" "}
              {shipmentData.to}
            </p>
            <p>
              <strong className="text-lg font-bold">Recipient:</strong>{" "}
              {shipmentData.recipient}
            </p>

            <hr className="my-3 border-[#D6D6D6]" />

            <p>
              <strong className="text-lg font-bold">Size:</strong>{" "}
              {shipmentData.size}
            </p>
            <p>
              <strong className="text-lg font-bold">Agreed Cost:</strong>{" "}
              <span className="text-[#4681F4] font-semibold">
                £{shipmentData.agreed_cost}
              </span>
            </p>

            <hr className="my-3 border-[#D6D6D6]" />

            <p>
              <strong className="text-lg font-bold">Status:</strong>{" "}
              <span className="text-[#F4B846]">
                {shipmentData?.trackingHistory[0]?.status}
              </span>
            </p>
            <p>
              <strong className="text-lg font-bold">Current Location:</strong>{" "}
              {shipmentData.current_location}
            </p>
            <p>
              <strong className="text-lg font-bold">Estimated Delivery:</strong>{" "}
              {shipmentData.estimated_delivery}
            </p>
          </div>
        </div>

        {shouldShowTraveler ? (
          <div className="bg-[#EAF3FF] rounded-[20px] p-6 md:p-8 shadow-sm flex flex-col">
            <div>
              <h3 className="text-lg md:text-[22px] font-semibold text-black mb-4">
                Traveller Information
              </h3>
              <div className="flex items-center gap-4 text-left mb-4">
                {shipmentData?.traveller?.profile_pic ? (
                  <img
                    src={shipmentData.traveller.profile_pic}
                    alt="Traveller"
                    className="w-[50px] h-[50px] rounded-full object-cover"
                  />
                ) : (
                  <div className="w-[50px] h-[50px] rounded-full bg-gray-200 flex items-center justify-center">
                    {shipmentData?.traveller?.name
                      ?.substring(0, 1)
                      ?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-black text-lg font-bold">
                    {shipmentData?.traveller?.name}
                  </p>
                  <button
                    onClick={handleViewTravellerProfile}
                    className="mt-1 w-[141px] h-[26px] border group border-[#4681F4] text-[#4681F4] text-xs rounded-full flex items-center justify-center cursor-pointer hover:bg-[#4681F4] hover:text-white transition-all duration-200"
                  >
                    <div
                      className=" text-[#4681F4] group-hover:text-white"
                      dangerouslySetInnerHTML={{ __html: ProFile }}
                    />{" "}
                    View Traveller Profile
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                navigate(`/dashboard/messages/${shipmentData?.traveller?.id}`)
              }
              className="mt-4 w-full h-10 md:h-[50px] bg-[#4681F4] hover:bg-white hover:text-[#4681F4] border border-[#4681F4] flex items-center justify-center text-white font-bold rounded-full text-xl cursor-pointer transition-all"
            >
              Contact Traveller
            </button>
          </div>
        ) : null}

        {shouldShowPickup ? (
          <div className="bg-[#EAF3FF] rounded-[20px] p-6 md:p-8 shadow-sm flex flex-col">
            <div>
              <h3 className="text-lg md:text-[22px] font-semibold text-black mb-4">
                Traveller Information
              </h3>
              <div className="flex items-center gap-4 text-left mb-4">
                <img
                  src={
                    shipmentData?.traveller?.profile_pic ||
                    "/dashboard/participants.svg"
                  }
                  alt="Traveller"
                  className="w-[50px] h-[50px] rounded-full object-cover"
                />
                <div>
                  <p className="text-black text-lg font-bold">
                    You are the Traveller
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                ConfirmPickupService({
                  tracking_number: shipmentData?.tracking_number,
                })
              }
              className="mt-4 w-full h-10 md:h-[50px] bg-[#4681F4] hover:bg-white hover:text-[#4681F4] border border-[#4681F4] flex items-center justify-center text-white font-bold rounded-full text-xl cursor-pointer transition-all"
            >
              Confirm Pickup
            </button>
          </div>
        ) : null}

        {shouldShowInTransit ? (
          <div className="bg-[#EAF3FF] rounded-[20px] p-6 md:p-8 shadow-sm flex flex-col">
            <div>
              <h3 className="text-lg md:text-[22px] font-semibold text-black mb-4">
                Traveller Information
              </h3>
              <div className="flex items-center gap-4 text-left mb-4">
                <img
                  src={
                    shipmentData?.traveller?.profile_pic ||
                    "/dashboard/participants.svg"
                  }
                  alt="Traveller"
                  className="w-[50px] h-[50px] rounded-full object-cover"
                />
                <div>
                  <p className="text-black text-lg font-bold">
                    You are the Traveller
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setDelivery(true)}
              className="mt-4 w-full h-10 md:h-[50px] bg-[#4681F4] hover:bg-white hover:text-[#4681F4] border border-[#4681F4] flex items-center justify-center text-white font-bold rounded-full text-xl cursor-pointer transition-all"
            >
              Confirm Delivery
            </button>
          </div>
        ) : null}

        {delivery ? (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
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
              <button className="w-full border border-gray-300 rounded-full py-3 flex items-center justify-center gap-2 mb-4 bg-[#DCE6F5] hover:bg-[#d0dbef]">
                <span className="text-lg">📷</span>
                <span className="font-medium">Scan Recipient’s QR Code</span>
              </button>
              <p className="font-semibold mb-2">Or</p>
              <p className="text-sm text-gray-700 mb-2">
                Enter Alphanumeric Code
              </p>
              <input
                type="text"
                placeholder="e.g., TRN-8XB3"
                className="w-full rounded-full px-4 py-3 mb-5 bg-[#DCE6F5] outline-none placeholder-gray-500"
              />

              <button className="w-full bg-blue-500 text-white py-3 rounded-full font-semibold mb-3 hover:bg-blue-600 transition">
                Confirm & Complete
              </button>

              <button
                onClick={() => setDelivery(false)}
                className="w-full py-3 rounded-full border border-gray-300 bg-[#DCE6F5] hover:bg-[#d0dbef]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {shipmentData?.trackingHistory[0]?.status === "Delivered" ? (
          <div className="bg-[#ECFDF5] rounded-[20px] p-6 md:p-8 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="flex justify-center mb-6">
              <img
                src="/check-circle.svg"
                alt="Success"
                className="w-16 h-16"
              />
            </div>

            <h3 className="text-lg md:text-[22px] font-semibold text-[#166534] mb-2">
              Delivery Confirmed
            </h3>

            <p className="text-[#374151] text-base md:text-lg mb-6 leading-relaxed max-w-[300px]">
              The package has been successfully delivered.
            </p>

            {!shipmentData?.rating && !localReviewSubmitted ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 w-full h-10 md:h-[50px] bg-white border border-[#4681F4] flex items-center justify-center text-[#166534] font-bold rounded-full text-xl cursor-pointer transition-all hover:bg-[#F3F4F6]"
              >
                <span className="text-xl mr-2">⭐</span>
                Leave a Review
              </button>
            ) : (
              <button
                disabled
                className="mt-4 w-full h-10 md:h-[50px] bg-[#EAF6EA] border border-[#9CCB9C] flex items-center justify-center text-[#8FBC8F] font-bold rounded-full text-xl cursor-not-allowed transition-all"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Review Submitted
              </button>
            )}
          </div>
        ) : null}

        {shouldShowDelivery ? (
          <div className="bg-[#EAF3FF] rounded-[20px] p-6 md:p-8 shadow-sm flex flex-col items-center justify-center text-center">
            <h3 className="text-lg md:text-[22px] font-semibold text-black mb-4">
              Delivery Confirmation Code
            </h3>

            <p className="text-[#5F6C85] text-base md:text-lg mb-6 leading-relaxed">
              Show this code to the Traveller upon delivery to confirm receipt.
            </p>

            <div className="bg-white rounded-[20px] p-8 w-full flex flex-col items-center border border-[#D6D6D6]">
              <div className="flex justify-center mb-6">
                <QRCodeCanvas value={shipmentData?.delivery_code} size={120} />
              </div>

              <div className="bg-[#EAF3FF] text-[#4681F4] font-bold text-2xl px-8 py-4 rounded-full border border-[#4681F4]/20">
                {shipmentData?.delivery_code}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="bg-[#E6F0FF] rounded-2xl w-[90%] max-w-lg p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-xl font-bold cursor-pointer flex items-center justify-center"
            >
              ✕
            </button>

            <h2 className="text-[24px] font-semibold text-center">
              Leave a Review
              {/* for {reviewName || "User"} */}
            </h2>

            <p className="text-center text-gray-500 font-normal text-sm mt-2">
              Share your experience
              {/* with {reviewName || "them"} */}
            </p>

            <div className="mt-4 text-left">
              <label className="text-[14px] font-normal">Overall Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full mt-2 border outline-none border-white rounded-[10px] py-4 px-2 bg-[#D0E3FF] focus:ring-2 focus:ring-[#4681F4]"
              >
                <option value={5}>5 ⭐</option>
                <option value={4}>4 ⭐</option>
                <option value={3}>3 ⭐</option>
                <option value={2}>2 ⭐</option>
                <option value={1}>1 ⭐</option>
              </select>
            </div>

            <div className="mt-4 text-left">
              <label className="text-[14px] font-normal">Your Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full mt-2 border text-[14px] font-normal placeholder:text-[#666666] border-white p-3 rounded-[10px] text-[#666666] outline-none bg-[#D0E3FF] focus:ring-2 focus:ring-[#4681F4]"
                rows="4"
                placeholder="Tell us about your experience..."
              />
            </div>

            <button
              onClick={postRating}
              disabled={isSubmitting}
              className={`w-full mt-4 ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700 cursor-pointer"} text-white py-3 rounded-full font-bold text-xl`}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-4 border py-3 rounded-full font-bold text-xl bg-[#D0E3FF] hover:bg-blue-300 border-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default PackageTracker;
