import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTravelerProfileService,
  SearchTravelersService,
} from "../api/services/SearchTravelersService/SearchTravelers";
import { MessageIcon, ProfileLarge } from "../assets/icons";

const SearchTraveller = () => {
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [travelers, setTravelers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoadingId, setProfileLoadingId] = useState(null);

  const navigate = useNavigate();

  const fetchTravelers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await SearchTravelersService({ destination, date, page });
      setTravelers(res?.data?.travelers || []);
      setPagination(res?.data?.pagination || null);
    } catch (err) {
      console.error(err);
      setTravelers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchTravelers(1);
    setHasSearched(true);
  };

  const handlePageChange = (page) => {
    fetchTravelers(page);
  };

  const formatDateWithSuffix = (dateStr) => {
    const date = new Date(dateStr);

    const day = date.getDate();
    const year = date.getFullYear();

    const month = date.toLocaleString("en-GB", { month: "long" });

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

  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.total_pages ?? 1;
  const totalResults = pagination?.total ?? travelers.length;

  const getTravelerProfileIds = (traveler) => {
    const candidateIds = [
      traveler?.user_id,
      traveler?.traveller_id,
      traveler?.traveler_id,
      traveler?.profile_id,
      traveler?.user?.id,
      traveler?.traveller?.id,
      traveler?.traveler?.id,
      traveler?.profile?.id,
      traveler?.id,
    ].filter(Boolean);

    return [...new Set(candidateIds.map((id) => String(id)))];
  };

  const handleViewProfile = async (traveler) => {
    const { ...travelerData } = traveler;
    const profileIds = getTravelerProfileIds(traveler);

    if (profileIds.length === 0) {
      console.error("No traveler profile id found in search result:", traveler);
      return;
    }

    setProfileLoadingId(traveler.id);
    try {
      for (const profileId of profileIds) {
        const res = await getTravelerProfileService(profileId);
        if (res?.data?.success) {
          sessionStorage.setItem(
            "selectedTravellerProfile",
            JSON.stringify({
              travellerProfile: res.data.data,
              travellerId: profileId,
            }),
          );
          navigate("/dashboard/user-profile", {
            state: {
              travellerProfile: res.data.data,
              travellerId: profileId,
              travelerData: travelerData,
            },
          });
          return;
        }
      }

      console.error(
        "Traveller profile not found for any candidate ids:",
        profileIds,
        traveler,
      );
    } catch (error) {
      console.error("Error fetching traveller profile:", error);
    } finally {
      setProfileLoadingId(null);
    }
  };

  const handleMessageClick = () => {
    // Add your message functionality here
    // For example: navigate to messaging page or open chat modal
    // console.log("Message functionality goes here");
  };

  return (
    <section className="w-full flex flex-col items-center py-8 px-2">
      <div className="w-full mx-auto text-center md:text-left">
        <div className="text-left">
          <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
            Find a Traveller
          </h2>
          <p className="text-[#5F6C85] text-base md:text-lg mb-8">
            Search for travellers heading to your package’s destination.
          </p>
        </div>
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-6 mb-8 text-left"
        >
          <div className="flex-1">
            <label className="block text-black font-medium text-base mb-2">
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., 123 Southwood Hall"
              className="w-full bg-[#E6F0FF] rounded-xl px-4 py-3 text-black text-base outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-black font-medium text-base mb-2">
              Approximate Travel Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="DD-MM-YYYY"
                className="w-full bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none pr-5 uppercase placeholder:uppercase"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#4681F4] w-full md:w-[274px] h-[50px]  hover:bg-white hover:text-[#4681F4] border border-[#4681F4] text-white font-bold cursor-pointer rounded-full text-xl transition-all duration-300 mt-8 self-end md:self-auto"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        {hasSearched && (
          <div className="bg-[#E6F0FF] rounded-[20px] p-4 md:p-6">
            <h3 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
              Search Results({totalResults})
            </h3>
            <p className="text-[#5F6C85] text-base md:text-lg mb-6">
              Travellers matching your criteria.
            </p>
            {!loading && travelers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[#5F6C85] text-lg font-medium">
                  No travellers found
                </p>
              </div>
            ) : loading ? (
              <div className="text-center py-10">
                <p className="text-[#5F6C85] text-lg font-medium">
                  Loading travellers...
                </p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {travelers.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white rounded-xl border border-[#D6D6D6]  flex flex-col"
                    >
                      <div className="flex items-center px-2 md:px-[15px] py-3 border-b border-[#D6D6D6]  gap-2 md:gap-3">
                        {t.profile_pic ? (
                          <img
                            src={t.profile_pic}
                            alt={t.full_name}
                            className="w-20 h-20 min-w-[80px] min-h-[80px] rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 min-w-[80px] min-h-[80px] bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center text-2xl font-bold text-gray-600 uppercase">
                            {t.full_name ? t.full_name.substring(0, 1) : "UN"}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-black text-lg md:text-xl">
                            {t.full_name}
                          </span>
                          <div className="flex items-center gap-1.5 text-black text-sm">
                            <span className="flex gap-1">
                              <img
                                src="/star.svg"
                                alt="star"
                                className="w-[19px] h-[18px]"
                              />
                            </span>
                            <span>
                              {t.rating?.average_rating} (
                              {t.rating?.total_trips} Trips)
                            </span>
                          </div>
                          <div className="flex items-center text-black gap-1.5 text-sm mb-1">
                            <img src="/location.svg" alt="location" />

                            <div className="w-full flex gap-2 items-center overflow-hidden">
                              <p
                                className="font-medium text-base md:text-sm "
                                title={t.origin}
                              >
                                {t.origin?.split(",")[0]} , {t.origin_postcode}
                              </p>
                              <img
                                src="/black-right-arrow.svg"
                                alt="arrow"
                                className="flex-shrink-0 w-4 h-4"
                              />
                              <p
                                className="font-medium text-base md:text-sm "
                                title={t.destination}
                              >
                                {t.destination?.split(",")[0]} ,{" "}
                                {t.destination_postcode}
                              </p>
                            </div>
                          </div>
                          <div className="text-black flex items-center gap-1.5 text-sm">
                            <img src="/bluedate.svg" alt="date" />
                            Approx.{" "}
                            {t.estimated_arrival_date
                              ? formatDateWithSuffix(t.estimated_arrival_date)
                              : "—"}
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-[#D6D6D6] px-2 md:px-[15px] py-3">
                        <p className="text-base text-[#666666] mb-1">
                          £ Rates:
                        </p>
                        <div className="flex gap-2 mb-2">
                          <div className="flex-1 bg-[#E6F0FF] border-1 border-[#4681F4] rounded-xl h-[52px] flex items-center justify-center flex-col text-center text-black text-sm">
                            £ {t.rate_small || "N/A"}
                            <div className="text-xs font-normal text-[#666666]">
                              Small
                            </div>
                          </div>
                          <div className="flex-1 bg-[#E6F0FF] border-1 border-[#4681F4] rounded-xl h-[52px] flex items-center justify-center flex-col text-center text-black text-sm">
                            £ {t.rate_medium || "N/A"}
                            <div className="text-xs font-normal text-[#666666]">
                              Medium
                            </div>
                          </div>
                          <div className="flex-1 bg-[#E6F0FF] border-1 border-[#4681F4] rounded-xl h-[52px] flex items-center justify-center flex-col text-center text-black text-sm">
                            £ {t.rate_large || "N/A"}
                            <div className="text-xs font-normal text-[#666666]">
                              Large
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 md:gap-2 px-2 md:px-[15px] py-3">
                        <button
                          onClick={() => handleViewProfile(t)}
                          disabled={profileLoadingId === t.id}
                          className="w-full h-10 lg:h-[50px] bg-[#D0E3FF] md:gap-2 group hover:bg-[#4681F4] cursor-pointer text-base flex items-center justify-center font-bold hover:text-white text-black rounded-full duration-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <div
                            className=" text-black group-hover:text-white"
                            dangerouslySetInnerHTML={{ __html: ProfileLarge }}
                          />
                          {profileLoadingId === t.id
                            ? "Loading..."
                            : "View Profile"}
                        </button>
                        <button
                          onClick={handleMessageClick}
                          className="w-full h-10 lg:h-[50px] bg-[#A0BFFA] md:gap-2 hover:bg-[#4681F4] cursor-pointer text-base flex items-center justify-center font-bold hover:text-white text-white rounded-full duration-200 transition-all"
                        >
                          <div
                            className=" text-white"
                            dangerouslySetInnerHTML={{ __html: MessageIcon }}
                          />
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-6">
                    <button
                      disabled={loading || !pagination?.prev}
                      onClick={() => handlePageChange(pagination.prev)}
                      className="px-4 py-2 bg-[#4681F4] text-white rounded disabled:opacity-40"
                    >
                      Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        disabled={loading}
                        onClick={() => handlePageChange(i + 1)}
                        className={`px-4 py-2 rounded disabled:opacity-40 ${
                          currentPage === i + 1
                            ? "bg-[#4681F4] text-white"
                            : "bg-[#E6F0FF] text-black"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      disabled={loading || !pagination?.next}
                      onClick={() => handlePageChange(pagination.next)}
                      className="px-4 py-2 bg-[#4681F4] text-white rounded disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchTraveller;
