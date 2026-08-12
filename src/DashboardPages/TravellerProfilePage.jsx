/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageIcon } from "../assets/icons";
import { useProfile } from "../context/ProfileContext";
import { AllTravellerReviewsService } from "../api/services/DashboardService/ShipmentHistory";
import { getMessageButton } from "../api/services/MessageService/MessageService";

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const day = date.getDate();
  const suffix = ["th", "st", "nd", "rd"][
    day % 10 > 3 || ~~((day % 100) / 10) === 1 ? 0 : day % 10
  ];

  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  return `${day}${suffix} ${month}, ${year}`;
}

const TravellerProfilePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [allReviews, setAllReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const profileContext = useProfile() || {};
  const currentUserProfile =
    profileContext.profile?.data || profileContext.profile || null;
  const [showmessagebutton, setShowMessageButton] = useState(false);

  let storedTravellerData = null;
  try {
    const rawStoredTravellerData = sessionStorage.getItem(
      "selectedTravellerProfile",
    );
    storedTravellerData = rawStoredTravellerData
      ? JSON.parse(rawStoredTravellerData)
      : null;
  } catch (error) {
    storedTravellerData = null;
  }

  const travelerData = location.state?.travelerData;
  // console.log("Traveler Data from Search:", travelerData);

  // console.log("currentUserProfile:", currentUserProfile);

  const travellerProfile =
    location.state?.travellerProfile || storedTravellerData?.travellerProfile;
  const publicProfile = travellerProfile?.profile;
  const about = travellerProfile?.about;
  const recentTravels = travellerProfile?.recent_travels || [];
  const reviews = travellerProfile?.reviews;
  // console.log(reviews);
  const displayProfile = publicProfile || currentUserProfile;
  const displayName =
    displayProfile?.full_name || displayProfile?.username || "Traveller";
  const reviewTotal = typeof reviews?.total === "number" ? reviews.total : 0;
  const reviewList = reviews?.list || [];
  const completedTrips = displayProfile?.trips_completed ?? 0;
  const ratingValue = displayProfile?.rating || "0.0";
  const memberSince =
    publicProfile?.member_since || formatDate(displayProfile?.created_at) || "";

  if (!displayProfile) {
    return (
      <section className="w-full flex flex-col items-center pt-8 px-2">
        <div className="w-full mx-auto text-center md:text-left">
          <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
            Traveller Profile
          </h2>
          <p className="text-[#5F6C85] text-base md:text-lg">
            Traveller profile data is unavailable. Please go back to search
            results and open the profile again.
          </p>
        </div>
      </section>
    );
  }

  const handleBookWith = () => {
    navigate("/dashboard/send-package", {
      state: { travelerData: travelerData },
    });

    // navigate("/dashboard/send-package");
  };

  const travelerId =
    displayProfile?.id ||
    displayProfile?.traveler_id ||
    travellerProfile?.traveler_id ||
    travelerData?.id ||
    travelerData?.traveler_id;

  const handleViewAllReviews = async () => {
    if (showAllReviews) {
      setShowAllReviews(false);
      return;
    }

    if (!travelerId) {
      setShowAllReviews(true);
      return;
    }

    try {
      setIsReviewsLoading(true);
      const response = await AllTravellerReviewsService(travelerId);
      const fetchedReviews = response?.data?.data || response?.data || [];
      setAllReviews(Array.isArray(fetchedReviews) ? fetchedReviews : []);
      setShowAllReviews(true);
    } catch (error) {
      console.error("Error fetching all traveler reviews", error);
      setShowAllReviews(true);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const handleShowmessagebutton = async () => {
    try {
      const showbtn = await getMessageButton(travelerId);
      setShowMessageButton(showbtn?.data);
    } catch (error) {
      console.error("There is some error fetching the api");
    }
  };

  useEffect(() => {
    handleShowmessagebutton();
  }, []);

  const displayedReviews = showAllReviews
    ? allReviews.length > 0
      ? allReviews
      : reviewList
    : reviewList.slice(0, 3);

  return (
    <>
      <section className="w-full flex flex-col items-center pt-8">
        <div className="w-full mx-auto text-left">
          <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-1">
            {displayName}'s Profile
          </h2>
          <p className="text-[#5F6C85] text-base md:text-lg mb-8">
            Public Profile and Activity History.
          </p>
          <div className="flex flex-col gap-6 mb-6">
            <div className="flex items-center gap-5">
              {displayProfile?.profile_pic ? (
                <img
                  src={displayProfile.profile_pic}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#4681F4] flex items-center justify-center text-white text-3xl font-bold uppercase transition-all duration-300">
                  {displayName?.charAt(0)}
                </div>
              )}
              <div className="text-left">
                <div className="flex items-center  gap-2 mb-1">
                  <span className="text-base md:text-xl font-bold text-black">
                    {displayProfile?.username || displayName}
                  </span>
                </div>
                <div className="">
                  <div className="flex md:items-center">
                    <div className="flex gap-1 md:pt-0 pt-1">
                      {Array(1)
                        .fill(0)
                        .map((_, i) => (
                          <img
                            key={i}
                            src="/star.svg"
                            alt="star"
                            className="w-[19px] h-[18px]"
                          />
                        ))}
                    </div>

                    <span className="text-base text-black ml-2">
                      {ratingValue} ({reviewTotal} Reviews, {completedTrips}{" "}
                      Trips Completed)
                    </span>
                  </div>
                </div>
                <div className=" text-base">Member Since: {memberSince}</div>
              </div>
            </div>
            <div className="w-full flex gap-2.5 sm:gap-5">
              {!location.state?.hideBookButton && (
                <button
                  onClick={handleBookWith}
                  className="group flex items-center justify-center gap-2 cursor-pointer bg-[#4681F4] border border-[#4681F4] h-[50px] px-4 text-white hover:bg-white hover:text-[#4681F4] rounded-full text-[14px] transition-all duration-300"
                >
                  <div
                    className="w-6 h-6 bg-white group-hover:bg-[#4681F4] transition-colors duration-300"
                    style={{
                      WebkitMaskImage: "url(/WhiteBook.svg)",
                      WebkitMaskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskImage: "url(/WhiteBook.svg)",
                      maskSize: "contain",
                      maskRepeat: "no-repeat",
                      maskPosition: "center",
                    }}
                  />
                  <span className="flex items-center">
                    Book With {displayProfile?.username || "Traveller"}
                  </span>
                </button>
              )}
              {showmessagebutton?.showMessageBtn === true ? (
                <button
                  onClick={() => navigate("/dashboard/messages")}
                  className="flex items-center justify-center cursor-pointer h-[50px] bg-[#4681F4] flex-1 md:flex-none md:w-32 gap-1 md:gap-2 hover:bg-blue-600 text-base font-bold hover:text-white text-white rounded-full duration-200 transition-all"
                >
                  <div
                    className="text-white"
                    dangerouslySetInnerHTML={{ __html: MessageIcon }}
                  />
                  Message
                </button>
              ) : null}
            </div>
          </div>
          <hr className="border-[#D6D6D6] mb-8" />

          {/* Personal Information Section */}
          <div className="w-full">
            <h3 className="text-2xl md:text-[32px] font-semibold text-black mb-6">
              About {displayProfile?.username || "Traveller"}'s Profile
            </h3>
            <form className="flex flex-col gap-4 md:gap-6 text-left">
              <div>
                <textarea
                  rows={3}
                  value={
                    about?.bio || displayProfile?.bio || "No bio added yet."
                  }
                  readOnly
                  className="w-full bg-[#E6F0FF] rounded-[12px] px-4 py-3 text-black text-base outline-none resize-none"
                />
              </div>
            </form>
          </div>

          <hr className="border-[#D6D6D6] mb-8" />

          <div className="w-full">
            <h3 className="text-2xl md:text-[32px] font-semibold text-black mb-6">
              Recent Travels
            </h3>
            {recentTravels.length === 0 ? (
              <div className="text-[#666666] text-base">
                No recent travels found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {recentTravels.map((travel) => (
                  <div
                    key={travel.id}
                    className="w-full border border-[#D6D6D6] rounded-[20px] p-[15px] flex flex-col gap-5"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start text-black gap-2 text-sm md:text-base font-semibold">
                        <img
                          src="/location.svg"
                          alt="Route"
                          className="w-5 h-5 md:w-6 md:h-6 object-contain mt-0.5"
                        />
                        <span>{travel.route || "Route not available"}</span>
                      </div>
                      <div className="text-[#666666] flex items-start gap-2 text-sm md:text-base">
                        <img
                          src="/bluedate.svg"
                          alt="Date"
                          className="w-4 h-4 md:w-5 md:h-5 object-contain mt-0.5"
                        />
                        <span>
                          {travel.date || formatDate(travel.date_raw) || ""}
                        </span>
                      </div>
                    </div>
                    {/* <hr className="border-[#D6D6D6]" />

                    <div className="w-full flex items-start flex-col gap-2.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <p className="text-[#666666] text-sm">S: {travel.pricing?.small ? `GBP ${travel.pricing.small}` : "N/A"}</p>
                        <p className="text-[#666666] text-sm">M: {travel.pricing?.medium ? `GBP ${travel.pricing.medium}` : "N/A"}</p>
                        <p className="text-[#666666] text-sm">L: {travel.pricing?.large ? `GBP ${travel.pricing.large}` : "N/A"}</p>
                      </div>
                    </div> */}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="w-full mt-12">
            <div className="bg-[#E6F0FF] rounded-2xl p-6 md:p-8">
              <div className="flex flex-row justify-between items-center mb-2">
                <h3 className="text-2xl md:text-[32px] font-semibold text-black">
                  Reviews ({reviewTotal})
                </h3>
                <button
                  onClick={handleViewAllReviews}
                  disabled={isReviewsLoading}
                  className="px-5 py-2 md:px-8 md:py-3 bg-[#4681F4] text-white rounded-full font-semibold hover:bg-[#3572e3] transition-colors duration-300 shadow-md text-sm md:text-base"
                >
                  {isReviewsLoading
                    ? "Loading..."
                    : showAllReviews
                      ? "Show Less Reviews"
                      : "View All Reviews"}
                </button>
              </div>
              <p className="text-black text-lg mb-6">
                Public feedback received from other users.
              </p>
              {reviewList.length === 0 ? (
                <div className="text-black text-base">No reviews yet.</div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row flex-wrap gap-6">
                    {displayedReviews.map((review, index) => {
                      const rating = Number(review.rating || 0);

                      return (
                        <div
                          key={review.id || index}
                          className="bg-white rounded-xl border border-[#E6E6E6] text-left p-4 flex flex-col md:flex-row gap-4 md:gap-2 shadow-sm min-w-[300px] flex-1"
                        >
                          <div className="w-full flex flex-col">
                            <div className="flex items-start flex-col gap-1 mb-1">
                              <div className="flex items-center">
                                <span className="flex gap-1 text-yellow-400">
                                  {Array(Math.max(rating, 1))
                                    .fill(0)
                                    .map((_, starIndex) => (
                                      <img
                                        key={starIndex}
                                        src="/star.svg"
                                        alt="star"
                                        className="w-[19px] h-[18px]"
                                      />
                                    ))}
                                </span>
                                <span className="text-base text-black ml-2">
                                  {review.rating || "0"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <img src={currentUserProfile?.profile_pic} alt="" className="w-10 h-10 rounded-full object-cover" />
                                <span className="font-bold text-lg text-[#4681F4] ml-2">
                                {review.reviewer_name || "Anonymous"}
                              </span>
                              </div>
                              
                            </div>
                            <div className="text-black text-base">
                              {review.comment || "No review comment provided."}
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
                                  Reply
                                  {/* {review.reply || "You"} */}
                                </div>
                                <p className="mt-2 text-[#1F2937]">
                                  {review.reply}
                                </p>
                                <div className="mt-2 text-base">
                                  {formatDate(review.replied_at)}
                                </div>
                              </div>
                            )}

                            <div className="text-base mt-3">
                              {review.created_at ||
                                formatDate(review.created_at_raw) ||
                                ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TravellerProfilePage;
