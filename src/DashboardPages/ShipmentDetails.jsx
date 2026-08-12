import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ProFile, MessageIcon } from "../assets/icons";
import ShipmentMap from "../components/Dashboard/ShipmentMap";
import { useProfile } from "../context/ProfileContext";
import { ShipmentsService, RatingsService } from "../api/services/DashboardService/ShipmentHistory";

const ShipmentDetails = () => {
    const [shipmentDetails, setShipmentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const profileContext = useProfile() || {};
    const currentUserProfile = profileContext.profile?.data || profileContext.profile || null;
    const location = useLocation();
    const pkg = location.state?.pkg;
    const pkgId = pkg?.id || pkg?.package_id;
    
    console.log("user profile in shipment details", currentUserProfile);

    const getShipmentDetails = async () => {
        if (!pkgId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const res = await ShipmentsService(pkgId)
            setShipmentDetails(res?.data?.shipment);
            console.log("shipmentdetails", res?.data?.shipment)
        } catch (error) {
            console.error("There is some error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (rating === 0) {
            alert("Please select a rating");
            return;
        }
        try {
            setIsSubmitting(true);
            const res = await RatingsService({
                rating: rating,
                comment: comment,
                pkg_id: shipmentDetails?.package_id || pkgId
            });
            if (res && (res.status === 200 || res.status === 201)) {
                setHasReviewed(true);
                // Refresh shipment details to get the new review
                await getShipmentDetails();
                setRating(0);
                setComment("");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        getShipmentDetails();
    }, [pkgId]);

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

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "delivered":
                return "text-[#4CAF50]";
            case "pending":
                return "text-[#FF9800]";
            case "cancelled":
                return "text-[#F44336]";
            case "in transit":
            case "in-transit":
                return "text-[#2196F3]";
            default:
                return "text-[#4681F4]";
        }
    };

    const formatShortDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!shipmentDetails) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <p className="text-xl text-gray-500">No shipment details found.</p>
            </div>
        );
    }

    // Get reviews from shipment details
    const reviews = shipmentDetails?.reviews || [];
    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 6);
    
    // Get current user ID
    const currentUserId = currentUserProfile?.id;
    
    // Check if current user has already reviewed this shipment
    const hasUserReviewed = reviews.some(review => review.reviewer_id === currentUserId);
    
    // Check if current user is the reviewer (their ID matches any reviewer_id in reviews)
    const isCurrentUserReviewer = reviews.some(review => review.reviewer_id === currentUserId);
    
    // Check if there are any reviews and get the reviewer_id from the first review
    // (you can adjust this logic based on which review you want to check)
    const reviewerIdFromShipment = reviews.length > 0 ? reviews[0].reviewer_id : null;
    
    // Condition to show Add Review form:
    // 1. If there are no reviews yet, OR
    // 2. If the current user is NOT the reviewer (reviewer_id !== currentUserId)
    const shouldShowReviewForm = !hasUserReviewed || (reviews.length > 0 && !isCurrentUserReviewer);

    console.log("Current User ID:", currentUserId);
    console.log("Reviewer ID from shipment:", reviewerIdFromShipment);
    console.log("Has user reviewed:", hasUserReviewed);
    console.log("Is current user reviewer:", isCurrentUserReviewer);
    console.log("Should show review form:", shouldShowReviewForm);

    return (
        <div className="min-h-screen bg-white md:bg-gray-50 flex justify-center items-start py-8 px-4 font-inter">
            <div className="w-full max-w-6xl space-y-8">
                {/* Title Section */}
                <div className="text-center md:text-left">
                    <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-1">
                        Shipment Details: <span className="font-bold">#{shipmentDetails.tracking_number || `PKG${shipmentDetails.id}`}</span>
                    </h2>
                    <p className="text-[#5F6C85] text-base md:text-lg">
                        {shipmentDetails.contents}
                    </p>
                </div>

                {/* Main Content Section */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Shipment Information Card */}
                    <div className="bg-[#EAF3FF] rounded-[24px] p-6 md:p-10 shadow-sm">
                        <h3 className="text-[22px] md:text-[28px] font-bold text-black mb-6">
                            Shipment Information
                        </h3>

                        <div className="flex flex-col gap-5 text-lg md:text-xl">
                            <div className="space-y-3">
                                <p className="text-black">
                                    <span className="font-bold mr-2">From:</span>
                                    <span className="text-[#5F6C85]">{shipmentDetails.origin}</span>
                                </p>
                                <p className="text-black">
                                    <span className="font-bold mr-2">To:</span>
                                    <span className="text-[#5F6C85]">{shipmentDetails.destination}</span>
                                </p>
                            </div>

                            <hr className="border-[#D1D1D1] my-1" />

                            <div className="space-y-3">
                                <p className="text-black">
                                    <span className="font-bold mr-2">Traveller:</span>
                                    <span className="text-[#5F6C85]">{shipmentDetails.full_name || "N/A"}</span>
                                </p>
                                <p className="text-black">
                                    <span className="font-bold mr-2">Delivered On:</span>
                                    <span className="text-[#5F6C85]">{formatShortDate(shipmentDetails.delivered_at)}</span>
                                </p>
                            </div>

                            <hr className="border-[#D1D1D1] my-1" />

                            <div className="flex flex-wrap gap-x-8 gap-y-3">
                                <p className="text-black">
                                    <span className="font-bold mr-2">Status:</span>
                                    <span className={`${getStatusColor(shipmentDetails.status)} font-bold`}>
                                        {shipmentDetails.status}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review Section */}
                <div className="w-full">
                    {/* Show Add Review Form if current user is NOT the reviewer */}
                    {shouldShowReviewForm && (
                        <div className="bg-[#EAF3FF] rounded-[24px] p-6 md:p-10 shadow-sm border border-transparent mb-8">
                            <div className="space-y-4">
                                <h2 className="text-[22px] md:text-[28px] font-bold text-black">
                                    Add Review
                                </h2>
                                <p className="text-xl md:text-2xl font-bold text-black">
                                    Rate your experience with {shipmentDetails.full_name}
                                </p>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <span
                                            key={i}
                                            onClick={() => setRating(i)}
                                            className={`${i <= rating ? 'text-[#FFC107]' : 'text-[#D1D1D1]'} text-[32px] cursor-pointer transition-transform hover:scale-110`}
                                        >
                                            {i <= rating ? "★" : "☆"}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Write your review here..."
                                        className="w-full h-32 p-4 rounded-[16px] border border-transparent bg-white text-lg outline-none focus:ring-2 focus:ring-[#4681F4] transition-all placeholder:text-[#BBBBBB]"
                                    />
                                </div>
                                <button
                                    onClick={handleSubmitReview}
                                    disabled={isSubmitting}
                                    className={`w-full py-4 mt-6 rounded-full bg-[#4681F4] text-white text-xl font-bold transition-all active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#356ACF]'}`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Show message if user has already reviewed */}
                    {hasUserReviewed && (
                        <div className="bg-[#E6F0FF] rounded-2xl p-6 md:p-8 text-center mb-8">
                            <p className="text-black text-lg">You have already submitted a review for this shipment.</p>
                        </div>
                    )}

                    {/* Show Reviews Section if there are reviews */}
                    {reviews.length > 0 && (
                        <div className="bg-[#E6F0FF] rounded-2xl p-6 md:p-8">
                            <div className="flex flex-row justify-between items-center mb-2">
                                <h3 className="text-2xl md:text-[32px] font-semibold text-black">
                                    Reviews ({reviews.length})
                                </h3>
                            </div>
                            <p className="text-black text-lg mb-6">
                                Public feedback received from other users.
                            </p>
                            
                            {/* Responsive Grid for Review Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedReviews.map((review, index) => {
                                    const ratingValue = Number(review.rating || 0);
                                    const isOwnReview = review.reviewer_id === currentUserId;
                                    
                                    return (
                                        <div
                                            key={review.id || index}
                                            className={`bg-white rounded-xl border border-[#E6E6E6] text-left p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full ${isOwnReview ? 'border-blue-300 ring-1 ring-blue-200' : ''}`}
                                        >
                                            <div className="w-full flex flex-col flex-grow">
                                                {/* Rating */}
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <div className="flex items-center">
                                                        <span className="flex gap-1">
                                                            {[1, 2, 3, 4, 5].map((i) => (
                                                                <img
                                                                    key={i}
                                                                    src="/star.svg"
                                                                    alt="star"
                                                                    className={`w-[19px] h-[18px] ${i <= ratingValue ? "opacity-100" : "opacity-20"}`}
                                                                />
                                                            ))}
                                                        </span>
                                                        <span className="text-base text-black ml-2">
                                                            {review.rating || "0"}
                                                        </span>
                                                    </div>
                                                    {isOwnReview && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                            Your Review
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Reviewer Info */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    {review.reviewer_profile_pic ? (
                                                        <img 
                                                            src={review.reviewer_profile_pic} 
                                                            alt={review.reviewer_name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-[#4681F4] flex items-center justify-center text-white font-bold">
                                                            {review.reviewer_name?.charAt(0).toUpperCase() || "U"}
                                                        </div>
                                                    )}
                                                    <span className="font-bold text-base md:text-lg text-[#4681F4] break-words flex-1">
                                                        {review.reviewer_name || "Anonymous"}
                                                        {isOwnReview && " (You)"}
                                                    </span>
                                                </div>

                                                {/* Review Comment */}
                                                <div className="text-black text-sm md:text-base mb-3 line-clamp-4">
                                                    {review.comment || "No review comment provided."}
                                                </div>

                                                {/* Review Date */}
                                                <div className="text-xs md:text-sm text-gray-500 mb-3">
                                                    {formatDate(review.created_at)}
                                                </div>

                                                {/* Reply Section */}
                                                {review.reply && (
                                                    <div className="mt-2 rounded-xl border-l-[3px] border-[#4681F4] bg-[#D0E3FF] p-3">
                                                        <div className="flex items-center gap-2 font-semibold text-[#1F2937] text-sm">
                                                            <div
                                                                className="text-[#4681F4]"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: MessageIcon,
                                                                }}
                                                            />
                                                            Reply from {shipmentDetails.full_name || "Traveller"}
                                                        </div>
                                                        <p className="mt-2 text-[#1F2937] text-sm line-clamp-3">
                                                            {review.reply}
                                                        </p>
                                                        <div className="mt-2 text-xs text-gray-600">
                                                            {formatDate(review.replied_at)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Load More / Show Less Buttons */}
                            {reviews.length > 6 && (
                                <div className="mt-6 text-center">
                                    {!showAllReviews ? (
                                        <button
                                            onClick={() => setShowAllReviews(true)}
                                            className="px-6 py-2 bg-[#4681F4] text-white rounded-full font-semibold hover:bg-[#3572e3] transition-colors duration-300"
                                        >
                                            Load All Reviews ({reviews.length})
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowAllReviews(false)}
                                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors duration-300"
                                        >
                                            Show Less
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Show message when no reviews exist */}
                    {reviews.length === 0 && !shouldShowReviewForm && (
                        <div className="bg-[#E6F0FF] rounded-2xl p-6 md:p-8 text-center">
                            <p className="text-black text-lg">No reviews yet for this shipment.</p>
                        </div>
                    )}
                </div>

                {/* Route Map Section */}
                <div className="space-y-6">
                    <h3 className="text-[22px] md:text-[28px] font-bold text-black">
                        Route Map
                    </h3>
                    <div className="w-full rounded-[24px] overflow-hidden shadow-sm border border-gray-200">
                        <ShipmentMap
                            origin={shipmentDetails.origin}
                            destination={shipmentDetails.destination}
                            originCity={shipmentDetails.origin_city}
                            destinationCity={shipmentDetails.destination_city}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShipmentDetails;