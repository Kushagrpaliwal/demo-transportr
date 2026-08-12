import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShipmentHistoryService,
  RatingsService,
} from "../../api/services/DashboardService/ShipmentHistory";
import { useProfile } from "../../context/ProfileContext";

const ShipmentHistory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewmore, setViewmore] = useState(true);
  const [shipmentHistory, SetshipmentHistory] = useState({});
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedPkgId, setSelectedPkgId] = useState(null);
  const [selectedRecipientName, setSelectedRecipientName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const profileContext = useProfile() || {};
  const userProfile =
    profileContext.profile?.data || profileContext.profile || null;

  // const sentPackages = [
  //   {
  //     destination: "Miami, FL",
  //     status: "In Progress",
  //     icon: "box",
  //     date: "2nd October, 2024",
  //   },
  //   {
  //     destination: "Seattle, WA",
  //     status: "Upcoming",

  //     icon: "box",
  //     date: "10th October, 2024",
  //   },
  // ];

  const fetchShipment = async () => {
    try {
      const res = await ShipmentHistoryService();
      SetshipmentHistory(res?.data?.data);
    } catch (error) {
      console.error(error);
    }
  };

  const postRating = async () => {
    try {
      setIsSubmitting(true);

      const res = await RatingsService({
        rating,
        comment,
        pkg_id: selectedPkgId,
      });
      if (res && (res.status === 200 || res.status === 201)) {
        setIsModalOpen(false);
        fetchShipment();
        setRating(5);
        setComment("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchShipment();
  }, []);

  const getSortDate = (pkg) =>
    new Date(
      pkg.delivery_date || pkg.delivered_on || pkg.travel_completed_on || 0,
    );

  const currentData = [
    ...(activeTab === 0
      ? shipmentHistory?.deliveredShipments || []
      : activeTab === 1
        ? shipmentHistory?.receivedShipments || []
        : activeTab === 2
          ? shipmentHistory?.pastTravels || []
          : []),
  ].sort((a, b) => getSortDate(b) - getSortDate(a));

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const tabs = ["Sent Packages", "Received Packages", "Complete Travels"];

  return (
    <div className="bg-[#E6F0FF] rounded-[16px] p-6 md:p-10 text-center md:text-left">
      <div className="text-left">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
          Shipment History
        </h2>
        <p className="text-[#5F6C85] text-base md:text-lg mb-4">
          Review your past shipments and completed travels.
        </p>
      </div>
      <div className="flex gap-6 lg:gap-10 xl:gap-15 border-b border-[#D6D6D6] my-6">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            className={`pb-2 text-base lg:text-xl cursor-pointer  transition-all border-b-2 ${activeTab === idx ? "border-[#4681F4] font-semibold text-[#4681F4]" : "border-transparent text-[black]"}`}
            onClick={() => {
              setActiveTab(idx);
              setViewmore(true);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        key={activeTab}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
      >
        {(viewmore ? currentData.slice(0, 10) : currentData)?.map(
          (pkg, mapIdx) => (
            <div
              key={`${activeTab}-${pkg.package_id || pkg.travel_plan_id || mapIdx}`}
              className="h-full"
            >
              {activeTab !== 2 && (
                <div className="h-full">
                  <div className="bg-white rounded-[18px] shadow flex flex-col xl:flex xl:flex-row gap-3 p-5 md:p-6 min-h-[120px] h-full">
                    <div className=" flex justify-center">
                      <div className="bg-[#4681F4] rounded-full w-16 h-16 flex items-center justify-center overflow-hidden">
                        <img
                          src={activeTab === 2 ? "/truck.svg" : "/package.svg"}
                          alt="icon"
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    </div>

                    <div
                      className="w-full flex flex-col 
              items-center xl:items-start justify-center xl:justify-start text-center xl:text-left
              gap-1 py-1"
                    >
                      <p className="text-base xl:text-lg font-semibold text-black">
                        {activeTab === 1
                          ? `Package from ${pkg.sender_name}`
                          : `Package to ${pkg.destination}`}
                      </p>

                      {activeTab === 0 && pkg.traveler_name && (
                        <p className="text-sm text-[#5F6C85]">
                          {/* by {pkg.traveler_name} */}
                        </p>
                      )}

                      <p className="text-xs text-[#6B6B6B]">
                        Delivered on{" "}
                        {formatDate(
                          pkg.delivery_date ||
                            pkg.delivered_on ||
                            pkg.travel_completed_on,
                        )}
                      </p>
                    </div>

                    <div className="w-full flex flex-row xl:flex-col 2xl:w-[40%] items-center xl:items-end justify-center xl:justify-start gap-3 xl:gap-0 mt-2 xl:mt-0 space-y-0 xl:space-y-2">
                      <button
                        onClick={() => {
                          navigate("/dashboard/shipment-details", {
                            state: {
                              pkg,
                            },
                          });
                        }}
                        className="flex items-center justify-center border border-[#4681F4] text-[#4681F4] font-medium w-[130px] py-1.5 rounded-full cursor-pointer hover:bg-[#4681F4] hover:text-white transition-all text-xs"
                      >
                        View Details
                      </button>
                      {!pkg.review_id ? (
                        <div
                          onClick={() => {
                            setSelectedPkgId(pkg.package_id);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-1.5
                  w-[130px] py-1.5
                  border border-[#65A34A]
                  text-[#65A34A]
                  text-xs font-medium
                  rounded-full
                  whitespace-nowrap
                  cursor-pointer
                  hover:bg-[#65A34A] hover:text-white
                  transition-all duration-200"
                        >
                          <img
                            src="/review-star.png"
                            alt="review star"
                            className="w-3 h-3"
                          />
                          Leave a Review
                        </div>
                      ) : (
                        <div className="">
                          {/* <div
                    className="flex items-center justify-center gap-1.5 mb-1
                  px-3 py-1
                  bg-[#EAF6EA]
                  border border-[#9CCB9C]
                  text-[#8FBC8F]
                  text-[11px] font-medium
                  rounded-full
                  whitespace-nowrap
                  cursor-not-allowed"
                  >
                    <img
                      src="./review-star.png"
                      alt="review star"
                      className="w-3 h-3"
                    />
                    Leave a Review
                  </div> */}
                          <div
                            className="flex items-center justify-center gap-1.5
                  w-[130px] py-1.5
                  bg-[#EAF6EA]
                  border border-[#9CCB9C]
                  text-[#8FBC8F]
                  text-[10px] font-medium
                  rounded-full
                  whitespace-nowrap
                  cursor-not-allowed"
                          >
                            <svg
                              className="w-3 h-3"
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
                          </div>
                        </div>
                      )}
                    </div>
                    {/* <div className="flex items-center md:flex-row md:items-start gap-4">
                <div className="bg-[#4681F4] rounded-full w-15 h-15 flex items-center justify-center">
                  <img src="./package.svg" alt="" />
                </div>
                <div className="flex-1 w-full text-left">
                    
                  <div className="flex flex-col items-end justify-start bg-amber-600">
                    <button
                      onClick={() => {
                        navigate("/dashboard/travel-detail");
                      }}
                      className="border border-[#4681F4] text-[#4681F4] font-bold w-[94px] h-[34px] rounded-full cursor-pointer hover:bg-[#4681F4] hover:text-white transition-all text-lg"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => {
                        navigate("/dashboard/travel-detail");
                      }}
                      className="border border-[#4681F4] text-[#4681F4] font-bold w-[94px] h-[34px] rounded-full cursor-pointer hover:bg-[#4681F4] hover:text-white transition-all text-lg"
                    >
                      Details
                    </button>
                  </div>
                  <div className="flex flex-col items-start justify-start gap-2 mt-1">
				          	<span className="text-lg md:text-xl font-medium text-black">
                      Package to {pkg.destination}
                    </span>
                    <span
                      className={` ${pkg.status === "Upcoming" ? "text-[#666666]" : "text-[#4681F4]"} font-bold text-base`}
                    >
                      {pkg.status}
                    </span>
                  </div>
                  <div className="text-sm text-[#666666] mt-1">Delivered on {pkg.date}</div>
                </div>
              </div> */}
                  </div>
                </div>
              )}
              {activeTab === 2 && (
                <div className="bg-white rounded-[18px] flex flex-col xl:flex xl:flex-col gap-3 p-5 md:p-6 min-h-[120px] h-full">
                  <div className="bg-white rounded-[18px]flex flex-col xl:flex xl:flex-row gap-3 min-h-[120px]">
                    <div className=" flex justify-center">
                      <div className="bg-[#4681F4] rounded-full w-16 h-16 flex items-center justify-center">
                        <img
                          src={
                            activeTab === 0
                              ? "/package.svg"
                              : activeTab === 1
                                ? "/package.svg"
                                : "/truck.svg"
                          }
                          alt="icon"
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    </div>

                    <div className="w-full flex flex-col items-start justify-start gap-1 py-1">
                      <p className="text-base xl:text-lg font-semibold text-black">
                        Trip to {pkg.destination}
                      </p>

                      <p className="text-xs text-[#6B6B6B]">
                        Delivered on {formatDate(pkg.travel_completed_on)}
                      </p>

                      <button
                        onClick={() => {
                          navigate("/dashboard/shipment-travel-detail", {
                            state: {
                              pkg,
                            },
                          });
                        }}
                        className="flex items-center justify-center border border-[#4681F4] text-[#4681F4] font-medium w-[130px] py-1.5 rounded-full cursor-pointer hover:bg-[#4681F4] hover:text-white transition-all text-xs my-1"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  <div className="w-full flex flex-col items-start justify-start space-y-2 ">
                    <p className="text-base font-light">Package Delivered:</p>
                    <div className="text-sm font-light text-gray-500 ">
                      {pkg?.packages?.map((pkgItem) => {
                        const hasUserReview = pkgItem.reviews?.some(
                          (review) => review.reviewer_id == userProfile?.id,
                        );

                        return (
                          <div key={pkgItem.package_id}>
                            <span>
                              {pkgItem.contents} for {pkgItem.sender_name}
                            </span>
                            {!hasUserReview ? (
                              <div
                                onClick={() => {
                                  setSelectedPkgId(pkgItem.package_id);
                                  setSelectedRecipientName(pkgItem.sender_name);
                                  setIsModalOpen(true);
                                }}
                                className="flex items-center justify-center gap-1.5
                              w-[130px] py-1.5
                              border border-[#65A34A]
                              text-[#65A34A]
                              text-xs font-medium
                              rounded-full
                              whitespace-nowrap
                              cursor-pointer
                              hover:bg-[#65A34A] hover:text-white
                              transition-all duration-200 mb-2 mt-2"
                              >
                                <img
                                  src="/review-star.png"
                                  alt="review star"
                                  className="w-3 h-3"
                                />
                                Leave a Review
                              </div>
                            ) : (
                              <div className="">
                                <div
                                  className="flex items-center justify-center gap-1.5
                                w-[130px] py-1.5 my-2
                                bg-[#EAF6EA]
                                border border-[#9CCB9C]
                                text-[#8FBC8F]
                                text-[10px] font-medium
                                rounded-full
                                whitespace-nowrap
                                cursor-not-allowed"
                                >
                                  <svg
                                    className="w-3 h-3"
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
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ),
        )}
      </div>
      <div>
        {currentData.length >= 10 ? (
          <div className="flex justify-center item-center p-4 mt-4">
            <button
              onClick={() => setViewmore(!viewmore)}
              className="bg-[#4681F4] hover:bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-full transition-all duration-300"
            >
              {viewmore === true ? "View More" : "View Less"}
            </button>
          </div>
        ) : (
          <div></div>
        )}
      </div>
      {/* )} */}

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="bg-[#E6F0FF] rounded-2xl w-[90%] max-w-lg p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>

            <h2 className="text-[24px] font-semibold text-center">
              Leave a Review
              {/* for {selectedRecipientName || "Sender"} */}
            </h2>

            <p className="text-center text-gray-500 font-normal text-sm mt-2">
              Share your experience
              {/* with {selectedRecipientName} */}
            </p>

            <div className="mt-4">
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

            <div className="mt-4">
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
              type="button"
              disabled={isSubmitting}
              onClick={postRating}
              className="w-full mt-4 bg-blue-500 hover:bg-blue-700 text-white py-3 rounded-full font-bold text-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
            >
              {isSubmitting ? "Submitting…" : "Submit Review"}
            </button>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-4 border py-3 rounded-full font-bold text-xl bg-[#D0E3FF] hover:bg-blue-300  border-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentHistory;
