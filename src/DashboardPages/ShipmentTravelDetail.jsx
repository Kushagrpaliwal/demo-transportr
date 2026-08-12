import { useState } from "react";
import { useLocation } from "react-router-dom";
import ShipmentMap from "../components/Dashboard/ShipmentMap";
import { Plane, Package, Check, Star, MessageCircle } from "lucide-react";
import { RatingsService } from "../api/services/DashboardService/ShipmentHistory";
import { useProfile } from "../context/ProfileContext";

const ShipmentTravelDetail = () => {
  const location = useLocation();
  // const navigate = useNavigate();
  const [pkg, setPkg] = useState(location.state?.pkg);
  // console.log("pkg data", pkg);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  // const [selectedSenderName, setSelectedSenderName] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const profileContext = useProfile() || {};
  const userProfile = profileContext.profile?.data || profileContext.profile || null;
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = date.getDate();
    const suffix = ["th", "st", "nd", "rd"][
      day % 10 > 3 || ~~((day % 100) / 10) === 1 ? 0 : day % 10
    ];
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `${day}${suffix} ${month}, ${year}`;
  };

  const handlePostRating = async () => {
    if (!comment.trim()) {
      alert("Please write a review comment");
      return;
    }

    try {
      setIsSubmittingReview(true);
      const res = await RatingsService({
        rating,
        comment,
        pkg_id: selectedPackageId,
      });

      if (res && (res.status === 200 || res.status === 201)) {
        // Update local state to show the new review
        const updatedPackages = pkg.packages.map((pkgItem) => {
          if (pkgItem.package_id === selectedPackageId) {
            const newReview = {
              id: res?.data?.review?.id || Date.now(),
              reply: null,
              rating: rating,
              comment: comment,
              created_at: new Date().toISOString(),
              replied_at: null,
              reviewer_id: null,
              reviewer_name: "You",
              reviewed_user_id: null,
            };

            return {
              ...pkgItem,
              reviews: [...(pkgItem.reviews || []), newReview],
            };
          }
          return pkgItem;
        });

        setPkg({ ...pkg, packages: updatedPackages });
        setIsModalOpen(false);
        setRating(5);
        setComment("");
        setSelectedPackageId(null);
        // setSelectedSenderName("");

        alert("Review submitted successfully!");
      }
    } catch (error) {
      console.error("Error posting rating:", error);
      alert(
        error?.response?.data?.message ||
          "Failed to submit review. Please try again.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!pkg) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-xl text-gray-500">No travel details found.</p>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <section className="w-full mx-auto px-4 py-8 font-inter bg-white md:bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-left">
            <h2 className="text-2xl md:text-[32px] font-semibold text-black leading-tight">
              Travel Details: <br />
              <span className="font-bold text-3xl md:text-[40px]">
                #TRV{pkg.travel_plan_id || "N/A"}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#4CAF50] bg-[#F1F8E9] text-[#4CAF50]">
            <Plane size={18} className="rotate-45" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        </div>

        <p className="text-[#5F6C85] text-lg md:text-xl max-w-3xl leading-relaxed">
          A summary of your trip from{" "}
          <span className="text-black font-medium">
            {pkg.origin || "Unknown"}
          </span>{" "}
          to{" "}
          <span className="text-black font-medium">
            {pkg.destination || "Unknown"}
          </span>
          .
        </p>

        <div className="grid grid-cols-1 gap-8">
          {/* Trip Information Card */}
          <div className="bg-[#EAF3FF] rounded-[24px] p-6 md:p-10 shadow-sm border border-[#D1E9FF]">
            <h3 className="text-[22px] md:text-[28px] font-bold text-black mb-6">
              Trip Information
            </h3>
            <div className="space-y-6 text-lg md:text-xl text-black">
              <div className="space-y-4">
                <p className="flex flex-col md:flex-row md:items-center gap-1">
                  <span className="font-bold min-w-[100px]">From:</span>
                  <span className="text-[#5F6C85]">
                    {pkg.origin || "Unknown"}
                  </span>
                </p>
                <p className="flex flex-col md:flex-row md:items-start gap-1">
                  <span className="font-bold min-w-[100px]">To:</span>
                  <span className="text-[#5F6C85]">
                    {pkg.destination || "Unknown"}
                  </span>
                </p>
              </div>

              <hr className="border-[#D1D1D1]" />

              <div className="space-y-4">
                <p className="flex flex-col md:flex-row md:items-center gap-1">
                  <span className="font-bold min-w-[150px]">Completed On:</span>
                  <span className="text-[#5F6C85]">
                    {formatDate(pkg.travel_completed_on || pkg.completed_on)}
                  </span>
                </p>
              </div>

              <hr className="border-[#D1D1D1]" />

              <p className="flex items-center gap-2">
                <span className="font-bold">Status:</span>
                <span className="text-[#4CAF50] font-bold">
                  Travel Completed
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[22px] md:text-[28px] font-bold text-black">
              Delivered Packages & Reviews
            </h3>

            <div className="space-y-6">
              {pkg.packages && pkg.packages.length > 0 ? (
                pkg.packages.map((item, index) => {
                  const reviews = item.reviews || [];
                  const hasReviews = reviews?.filter(review => review.reviewer_id == userProfile?.id).length > 0;

                  return (
                    <div
                      key={index}
                      className="bg-[#EAF3FF] rounded-[24px] p-6 md:p-8 shadow-sm border border-[#D1E9FF]"
                    >
                      {/* Package Header */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-white rounded-xl text-[#4681F4] shadow-sm">
                            <Package size={28} />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xl md:text-2xl font-bold text-black">
                              {item.contents}
                            </h4>
                            <p className="text-lg text-black">
                              <span className="font-bold mr-1">Sender:</span>
                              <span className="text-[#5F6C85]">
                                {item.sender_name}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Leave Review Button */}
                        {!hasReviews && (
                          <button
                            onClick={() => {
                              setSelectedPackageId(item.package_id);
                              // setSelectedSenderName(item.sender_name);
                              setIsModalOpen(true);
                            }}
                            className="w-full md:w-auto px-8 py-3 bg-[#4681F4] text-white font-bold rounded-full hover:bg-[#3570E3] transition cursor-pointer shadow-md text-lg"
                          >
                            Leave a Review
                          </button>
                        )}
                      </div>

                      {/* Reviews Section - Grid Layout */}
                      {hasReviews && (
                        <div className="mt-6">
                          <div className="flex items-center gap-2 mb-4">
                            <MessageCircle
                              size={20}
                              className="text-[#4681F4]"
                            />
                            <h5 className="text-lg font-semibold text-black">
                              Reviews ({reviews.length})
                            </h5>
                          </div>

                          {/* Responsive Grid for Review Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reviews.map((review, reviewIndex) => {
                              const ratingValue = Number(review.rating || 0);

                              return (
                                <div
                                  key={review.id || reviewIndex}
                                  className="bg-white rounded-xl border border-[#E6E6E6] text-left p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full"
                                >
                                  <div className="w-full flex flex-col flex-grow">
                                    {/* Rating */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                      <div className="flex items-center">
                                        <span className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map((i) => (
                                            <Star
                                              key={i}
                                              size={16}
                                              className={`${i <= ratingValue ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                            />
                                          ))}
                                        </span>
                                        <span className="text-base text-black ml-2">
                                          {review.rating || "0"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Reviewer Info with Initial Avatar */}
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-10 h-10 rounded-full bg-[#4681F4] flex items-center justify-center text-white font-bold text-base">
                                        {getInitials(review.reviewer_name)}
                                      </div>
                                      <span className="font-bold text-base md:text-lg text-[#4681F4] break-words flex-1">
                                        {review.reviewer_name || "Anonymous"}
                                      </span>
                                    </div>

                                    {/* Review Comment */}
                                    <div className="text-black text-sm md:text-base mb-3 line-clamp-4">
                                      {review.comment ||
                                        "No review comment provided."}
                                    </div>

                                    {/* Review Date */}
                                    <div className="text-xs md:text-sm text-gray-500 mb-3">
                                      {formatDate(review.created_at)}
                                    </div>

                                    {/* Reply Section */}
                                    {review.reply && (
                                      <div className="mt-2 rounded-xl border-l-[3px] border-[#4681F4] bg-[#D0E3FF] p-3">
                                        <div className="flex items-center gap-2 font-semibold text-[#1F2937] text-sm">
                                          <MessageCircle
                                            size={14}
                                            className="text-[#4681F4]"
                                          />
                                          Reply from Traveller
                                        </div>
                                        <p className="mt-2 text-[#1F2937] text-sm line-clamp-3">
                                          {review.reply}
                                        </p>
                                        {review.replied_at && (
                                          <div className="mt-2 text-xs text-gray-600">
                                            {formatDate(review.replied_at)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Show "Review Submitted" badge for packages with reviews */}
                      {hasReviews && (
                        <div className="mt-4 flex justify-end">
                          <div className="flex items-center gap-2 px-4 py-2 bg-[#EAF6EA] border border-[#9CCB9C] text-[#4CAF50] font-medium rounded-full">
                            <Check size={16} />
                            <span className="text-sm">
                              Review{reviews.length > 1 ? "s" : ""} Submitted
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-[#EAF3FF] rounded-[24px] p-6 shadow-sm text-center">
                  <p className="text-gray-500">
                    No packages delivered during this trip.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[22px] md:text-[28px] font-bold text-black">
            Route Map
          </h3>
          <div className="w-full rounded-[24px] overflow-hidden shadow-sm border border-gray-200">
            <ShipmentMap
              origin={pkg.origin}
              destination={pkg.destination}
              originCity={pkg.origin_city}
              destinationCity={pkg.destination_city}
            />
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#E6F0FF] rounded-2xl w-full max-w-lg p-6 md:p-8 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-2xl font-bold cursor-pointer text-gray-600 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-2xl md:text-[28px] font-bold text-center text-black mb-2">
              Leave a Review
            </h2>

            <p className="text-center text-gray-500 font-medium text-base mb-8">
              Share your experience
            </p>

            <div className="space-y-6">
              <div>
                <label className="text-lg font-bold text-black block mb-2">
                  Overall Rating
                </label>
                <div className="flex gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={32}
                        className={`${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} transition-transform hover:scale-110`}
                      />
                    </button>
                  ))}
                </div>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full border-none rounded-xl py-4 px-4 bg-[#D0E3FF] text-lg font-medium focus:ring-2 focus:ring-[#4681F4] outline-none appearance-none"
                >
                  <option value={5}>5 ⭐ (Excellent)</option>
                  <option value={4}>4 ⭐ (Good)</option>
                  <option value={3}>3 ⭐ (Average)</option>
                  <option value={2}>2 ⭐ (Poor)</option>
                  <option value={1}>1 ⭐ (Very Poor)</option>
                </select>
              </div>

              <div>
                <label className="text-lg font-bold text-black block mb-2">
                  Your Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border-none text-lg font-medium placeholder:text-[#666666] p-4 rounded-xl text-black outline-none bg-[#D0E3FF] focus:ring-2 focus:ring-[#4681F4] min-h-[150px]"
                  placeholder="Tell us about your experience..."
                />
              </div>

              <div className="space-y-4 pt-4">
                <button
                  onClick={handlePostRating}
                  disabled={isSubmittingReview}
                  className={`w-full bg-[#4681F4] text-white py-4 rounded-full font-bold text-xl shadow-lg transition active:scale-95 ${isSubmittingReview ? "opacity-50 cursor-not-allowed" : "hover:bg-[#3570E3] cursor-pointer"}`}
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full border-none py-4 rounded-full font-bold text-xl bg-white text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ShipmentTravelDetail;
