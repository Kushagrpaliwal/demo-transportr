import React, { useState } from "react";
import { MessageIcon, ProfileLarge } from "../assets/icons";
import { FindShipmentsService } from "../api/services/FindShipmentsService/FindShipments";
import { BookingRequestAccept } from "../api/services/BookingRequestService/BookingRequest";
import CompleteVerficationBanner from "../components/Dashboard/CompleteVerficationBanner";
import { useProfile } from "../context/ProfileContext";
import { useNavigate } from "react-router-dom";
import { getTravelerProfileService } from "../api/services/SearchTravelersService/SearchTravelers";

const FindShipments = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [shipments, setShipments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [profileLoadingId, setProfileLoadingId] = useState(null);

  const navigate = useNavigate();
  const { profile } = useProfile();

  const needsVerification = () => {
    const userData = profile?.data;
    return (
      !userData?.verification ||
      userData?.verification?.status === "PendingVerification" ||
      userData?.verification?.status === "Pending"
    );
  };

  const handleVerificationRequired = () => {
    setShowVerificationBanner(true);
    setTimeout(() => {
      const bannerElement = document.getElementById("verification-banner");
      if (bannerElement) {
        bannerElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const fetchShipments = async (page = 1) => {
    const trimOrigin = origin.trim();
    const trimDest = destination.trim();

    setLoading(true);
    setError(null);
    setShowVerificationBanner(false);

    try {
      const res = await FindShipmentsService({
        origin: trimOrigin || undefined,
        destination: trimDest || undefined,
        page,
      });
      setShipments(res?.data?.shipments || []);
      setPagination(res?.data?.pagination || null);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Something went wrong. Please try again.",
      );
      setShipments([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const trimOrigin = origin.trim();
    const trimDest = destination.trim();

    if (!trimOrigin && !trimDest) {
      setValidationError(
        "Please enter at least an Origin or a Destination to search.",
      );
      return;
    }

    setValidationError("");
    await fetchShipments(1);
    setSearched(true);
  };

  const handlePageChange = (page) => {
    fetchShipments(page);
  };

  const handleViewProfile = async (shipment) => {
    const userId = shipment.user_id || shipment.sender_id;
    if (!userId) {
      setToastMessage("User ID not found for this profile.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setProfileLoadingId(shipment._id);

    try {
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
            travelerData: shipment,
            hideBookButton: true,
          },
        });
      } else {
        setToastMessage("Failed to load profile details.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setToastMessage("Error fetching profile details.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setProfileLoadingId(null);
    }
  };

  const handleAcceptClick = (shipment) => {
    if (needsVerification()) {
      handleVerificationRequired("accept");
      return;
    }

    setSelectedShipment(shipment);
    setIsAcceptOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedShipment?._id) {
      setToastMessage("Error: Shipment ID not found");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setAccepting(true);

    try {
      await BookingRequestAccept(selectedShipment._id);

      setIsAcceptOpen(false);
      setToastMessage("Request Accepted successfully");

      setTimeout(() => {
        setToastMessage(null);
        fetchShipments(pagination?.page ?? 1);
      }, 3000);
    } catch (err) {
      console.error("Error accepting request:", err);
      setToastMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to accept request. Please try again.",
      );
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setAccepting(false);
      setSelectedShipment(null);
    }
  };

  const handleCancelAccept = () => {
    setIsAcceptOpen(false);
    setSelectedShipment(null);
  };

  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.total_pages ?? 1;
  const totalResults = pagination?.total ?? shipments.length;

  const displayList = shipments.map((s, idx) => ({
    name: s.full_name ?? "Unknown Sender",
    desc: s.pickup_date
      ? `Wants to ship by ${new Date(s.pickup_date)
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-")}`
      : "—",
    profile: s.profile_pic,
    origin: s.origin ?? "—",
    origin_city: s.origin_city ?? "—",
    origin_postalcode: s.origin_postalcode ?? "—",
    destination_city: s.destination_city ?? "—",
    destination_postalcode: s.destination_postalcode ?? "—",
    destination: s.destination ?? "—",
    offer: s.offer ?? "0.00",
    size: s.size ?? "—",
    contents: s.contents ?? "—",
    _id: s.id ?? idx,
    user_id: s.user_id || s.sender_id || s.userId || null,
  }));

  return (
    <section className="w-full flex flex-col items-center py-8 px-2">
      {showVerificationBanner && (
        <div id="verification-banner" className="mb-6 w-full">
          <CompleteVerficationBanner />
        </div>
      )}

      <div className="w-full mx-auto text-center md:text-left">
        <div className="text-left">
          <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
            Find Shipments
          </h2>
          <p className="text-[#5F6C85] text-base md:text-lg mb-8">
            Search for available package requests to carry along your route.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-6 mb-8 text-left"
        >
          <div className="flex-1">
            <label className="block text-black font-medium text-base mb-2">
              Origin
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => {
                setOrigin(e.target.value);
                setValidationError("");
              }}
              placeholder="e.g., London"
              className="w-full bg-[#E6F0FF] rounded-xl px-4 py-3 text-black text-base outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-black font-medium text-base mb-2">
              Destination
            </label>
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setValidationError("");
                }}
                placeholder="e.g., Manchester"
                className="w-full bg-[#E6F0FF] rounded-xl h-10 md:h-[50px] px-4 py-2 md:py-3 text-black text-base outline-none pr-5"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#4681F4] w-full md:w-[274px] h-[50px] hover:bg-white hover:text-[#4681F4] border border-[#4681F4] text-white font-bold cursor-pointer rounded-full text-xl transition-all duration-300 mt-8 self-end md:self-auto disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Searching…" : "Search Requests"}
          </button>
        </form>

        {validationError && (
          <p className="text-red-500 text-sm -mt-6 mb-4">{validationError}</p>
        )}

        {searched && (
          <div className="bg-[#E6F0FF] rounded-[20px] p-4 md:p-6">
            {error ? (
              <p className="text-red-500 text-base py-8 text-center">{error}</p>
            ) : !loading && displayList.length === 0 ? (
              <p className="text-[#5F6C85] text-base py-8 text-center">
                No shipments found. Try a different search.
              </p>
            ) : loading ? (
              <p className="text-[#5F6C85] text-base py-8 text-center">
                Searching…
              </p>
            ) : (
              <>
                <h3 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
                  Available Shipments ({totalResults})
                </h3>
                <p className="text-[#5F6C85] text-base md:text-lg mb-6">
                  Public requests from senders looking for a traveller.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {displayList.map((t, idx) => (
                    <div
                      key={t._id ?? idx}
                      className="bg-white rounded-xl border border-[#D6D6D6] flex flex-col"
                    >
                      <div className="flex flex-col px-2 md:px-[15px] py-3 md:py-4 border-b border-[#D6D6D6] gap-2">
                        <div className="w-full flex gap-2 items-center overflow-hidden">
                          <img
                            src="/send-package.svg"
                            alt="send-package"
                            className="flex-shrink-0 w-5 h-5"
                          />
                          <p
                            className="font-medium text-base md:text-lg "
                            title={t.origin_city}
                          >
                            {t.origin_city},{t.origin_postalcode}
                          </p>
                          <img
                            src="/black-right-arrow.svg"
                            alt="black-right-arrow"
                            className="flex-shrink-0 w-4 h-4"
                          />
                          <p
                            className="font-medium text-base md:text-lg "
                            title={t.destination_city}
                          >
                            {t.destination_city},{t.destination_postalcode}
                          </p>
                        </div>
                        <span className="h-[24px] text-black text-xs pl-2 gap-1">
                          {t.contents}
                        </span>
                        <span className="w-[78px] h-[24px] rounded-full bg-[#FEF9C3] text-black border-[0.4px] border-[#F4B846] text-xs flex justify-center items-center gap-1">
                          <img src="/pending.svg" alt="pending" />
                          Pending
                        </span>
                      </div>

                      <div className="flex justify-between items-center px-2 md:px-[15px] py-3">
                        <div className="flex flex-col items-center">
                          <p className="text-[#65A34A] text-base lg:text-xl font-bold">
                            £ {t.offer}
                          </p>
                          <p className="text-[#666666] font-sm">
                            Sender's Offer
                          </p>
                        </div>
                        <div className="flex flex-col items-center">
                          <p className="font-base">{t.size}</p>
                          <p className="text-[#666666] font-sm">Package Size</p>
                        </div>
                      </div>
                      <div className="w-full px-2 md:px-[15px]">
                        <hr className="text-[#D6D6D6]" />
                      </div>

                      <div className="border-b flex items-center gap-2 border-[#D6D6D6] px-2 md:px-[15px] py-3">
                        {t?.profile ? (
                          <img
                            src={t.profile}
                            alt={t.name}
                            className="w-[50px] h-[50px] rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-[50px] h-[50px] rounded-full bg-gray-200 flex items-center justify-center">
                            {t.name?.substring(0, 1)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-black text-base">
                            {t.name}
                          </p>
                          <p className="text-[#666666] text-sm">{t.desc}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 md:gap-2 px-2 md:px-[15px] py-3">
                        <button
                          onClick={() => handleViewProfile(t)}
                          disabled={profileLoadingId === t._id}
                          className="w-full h-10 lg:h-[50px] bg-[#D0E3FF] md:gap-2 group hover:bg-[#4681F4] cursor-pointer text-base flex items-center justify-center font-bold hover:text-white text-black rounded-full duration-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <div
                            className=" text-black group-hover:text-white"
                            dangerouslySetInnerHTML={{ __html: ProfileLarge }}
                          />
                          {profileLoadingId === t._id
                            ? "Loading..."
                            : "View Profile"}
                        </button>
                        <button
                          onClick={() => handleAcceptClick(t)}
                          className="w-full h-10 lg:h-[50px] bg-[#4681F4] md:gap-2 hover:bg-[#4681F4] cursor-pointer text-base flex items-center justify-center font-bold hover:text-white text-white rounded-full duration-200 transition-all"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                          >
                            <path
                              d="M12.7172 5.83321C12.9836 7.14063 12.7937 8.49987 12.1793 9.68425C11.5648 10.8686 10.5629 11.8066 9.34057 12.3416C8.11826 12.8767 6.74947 12.9766 5.46244 12.6246C4.17542 12.2726 3.04796 11.49 2.2681 10.4074C1.48823 9.32472 1.10309 8.00743 1.17691 6.67518C1.25072 5.34293 1.77903 4.07626 2.67373 3.08639C3.56843 2.09652 4.77544 1.44329 6.09347 1.23564C7.41151 1.02798 8.76089 1.27846 9.9166 1.94529"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M5.25 6.41683L7 8.16683L12.8333 2.3335"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Accept Request
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
              </>
            )}
          </div>
        )}

        {isAcceptOpen && selectedShipment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-[20px] p-6 w-full text-center max-w-[400px] shadow-lg flex flex-col items-center">
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-black mb-4">
                Accept This Shipment Request
              </h3>
              <p className="text-[#666666] text-center mb-6">
                You are about to accept carrying a {selectedShipment.size}{" "}
                package from {selectedShipment.origin_city},{" "}
                {selectedShipment.origin_postalcode} to{" "}
                {selectedShipment.destination_city},{" "}
                {selectedShipment.destination_postalcode} for an agreed price of
                £{selectedShipment.offer}. The sender will be notified to
                proceed with payment.
              </p>
              <div className="flex w-full flex-col items-center gap-4">
                <button
                  onClick={handleConfirmAccept}
                  disabled={accepting}
                  className="w-full h-10 lg:h-[50px] bg-[#4681F4] md:gap-2 hover:bg-[#4681F4] cursor-pointer text-base flex items-center justify-center font-bold hover:text-white text-white rounded-full duration-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {accepting ? "Accepting..." : "Confirm and Accept"}
                </button>
                <button
                  onClick={handleCancelAccept}
                  disabled={accepting}
                  className="flex-1 w-full h-10 lg:h-[50px] py-3 bg-[#E6F0FF] text-black font-semibold rounded-full hover:bg-[#D0E3FF] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {toastMessage && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
            <div className="bg-white text-[#4681F4] px-6 py-3 rounded-[20px] shadow-lg flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
              >
                <path
                  d="M12.7172 5.83321C12.9836 7.14063 12.7937 8.49987 12.1793 9.68425C11.5648 10.8686 10.5629 11.8066 9.34057 12.3416C8.11826 12.8767 6.74947 12.9766 5.46244 12.6246C4.17542 12.2726 3.04796 11.49 2.2681 10.4074C1.48823 9.32472 1.10309 8.00743 1.17691 6.67518C1.25072 5.34293 1.77903 4.07626 2.67373 3.08639C3.56843 2.09652 4.77544 1.44329 6.09347 1.23564C7.41151 1.02798 8.76089 1.27846 9.9166 1.94529"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.25 6.41683L7 8.16683L12.8333 2.3335"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>{" "}
              {toastMessage}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </section>
  );
};

export default FindShipments;
