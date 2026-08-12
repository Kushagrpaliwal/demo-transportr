/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { SendPackageIcon } from "../assets/icons";
import { useNavigate, useLocation } from "react-router-dom";
import {
  packageFeeStatusService,
  SendRequestsService,
  deleteSendPackageService,
} from "../api/services/SendRequestsService/SendRequests";
import PaymentModal from "../components/Dashboard/PaymentModal";
import { parseInsuranceFeeConfig } from "../utils/insuranceCost";
import API from "../api";
import ConfirmationModal from "../components/Common/ConfirmationModal";
import { useProfile } from "../context/ProfileContext";

const tabs = [
  "Pending",
  "Awaiting Payment",
  "Pending Pickup",
  "In Transit",
  "Delivered",
  "Cancelled",
];

const MySendRequestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile() || {};
  const userProfile = profile?.data || profile || null;

  console.log("userProfile", userProfile);

  const getInitialTab = () => {
    // If a specific package_id is provided, don't trust the notification's screen hint
    // (the package may have moved to a different status since the notification was sent).
    // The useEffect will derive the correct tab from live API data once loaded.
    if (location.state?.package_id) return "Pending";

    if (location.state?.screen === "InTransitscreen") return "In Transit";
    if (location.state?.screen === "paymentscreen") return "Awaiting Payment";
    if (location.state?.screen === "Deliveryscreen") return "Delivered";
    if (location.state?.screen === "canceledscreen") return "Cancelled";
    return "Pending";
  };

  const [tab, setTab] = useState(getInitialTab());
  const [sendRequests, SetSendRequest] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rushFee, setRushFee] = useState(0);
  const [insuranceFee, setInsuranceFee] = useState({
    amount: 0,
    percentage: 0,
    hide: true,
  });
  const [welcomeCreditFee, setWelcomeCreditFee] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [isDeletingRequest, setIsDeletingRequest] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const extractCityFromAddress = (address, postcode) => {
    if (!address) return "";

    if (postcode) {
      const postcodeIndex = address.indexOf(postcode);
      if (postcodeIndex > 0) {
        const beforePostcode = address.substring(0, postcodeIndex).trim();
        const parts = beforePostcode.split(",");
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1].trim();
          if (
            lastPart &&
            !lastPart.includes("UK") &&
            !lastPart.includes("London")
          ) {
            return lastPart;
          }
        }
      }
    }

    const parts = address.split(",");
    if (parts.length >= 2) {
      let cityPart = parts[parts.length - 2].trim();
      if (cityPart.includes("UK")) {
        cityPart = parts[parts.length - 3]?.trim() || cityPart;
      }
      return cityPart;
    }

    return address.split(",")[0].trim();
  };

  const formatDestinationDisplay = (destination, postcode) => {
    const city = extractCityFromAddress(destination, postcode);
    return `${city} ${postcode || ""}`.trim();
  };

  const fetchsendRequest = async () => {
    try {
      const res = await SendRequestsService();
      const data = res?.data?.packages;
      SetSendRequest(data);
    } catch (error) {
      console.error("error fetching SendRequests", error);
    }
  };

  useEffect(() => {
    fetchsendRequest();
    fetchRushFee();
  }, []);

  useEffect(() => {
    if (userProfile?.first_shipment_credit_eligible) {
      fetchWelcomeCredit();
    }
  }, [userProfile]);

  const fetchWelcomeCredit = async () => {
    if (userProfile?.first_shipment_credit_eligible) {
      const res3 = await packageFeeStatusService("first_shipment_credit");
      setWelcomeCreditFee(res3?.data?.data || null);
    }
  };

  // Map actual API status → UI tab name
  const statusToTab = {
    Pending: "Pending",
    Accepted: "Awaiting Payment",
    "Pending Pickup": "Pending Pickup",
    "In Transit": "In Transit",
    Delivered: "Delivered",
    Cancelled: "Cancelled",
  };

  useEffect(() => {
    if (!location.state?.screen || sendRequests.length === 0) return;

    const packageId = location.state?.package_id;

    // If we have a specific package_id, find that package and jump to its real tab
    if (packageId) {
      const target = sendRequests.find((r) => r.id === packageId);
      if (target) {
        const correctTab = statusToTab[target.status];
        if (correctTab) setTab(correctTab);

        // Also auto-open payment modal if the package still needs payment
        if (target.status === "Accepted") {
          openPaymentModal(target);
        }

        // Clear location state so reload after payment doesn't re-open the modal
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }
    }

    // Fallback: no package_id — for paymentscreen open first Accepted request
    if (location.state?.screen === "paymentscreen") {
      const first = sendRequests.find((r) => r.status === "Accepted");
      if (first) openPaymentModal(first);
    }

    // Clear location state so reload after payment doesn't re-open the modal
    navigate(location.pathname, { replace: true, state: {} });
  }, [sendRequests]);

  const fetchRushFee = async () => {
    try {
      const res = await packageFeeStatusService("rush_fee");
      const data = res?.data?.data;
      setRushFee(data);
      const res2 = await packageFeeStatusService("insurance_fee");
      setInsuranceFee(parseInsuranceFeeConfig(res2?.data));
    } catch (error) {
      console.error("error fetching RushFee", error);
    }
  };

  const isWelcomeCreditActive = () => {
    if (
      Number(userProfile?.first_shipment_credit_eligible) !== 1 ||
      Number(welcomeCreditFee?.hide) === 1
    ) {
      return false;
    }
    const kycComplete =
      userProfile?.kycCompletedAt ||
      userProfile?.verification?.status === "Approved";
    if (!kycComplete) {
      return false;
    }
    if (
      userProfile?.first_shipment_credit_expires_at &&
      new Date(userProfile.first_shipment_credit_expires_at) < new Date()
    ) {
      return false;
    }
    return Number(welcomeCreditFee?.amount) > 0;
  };

  const welcomeCredit = {
    eligible: isWelcomeCreditActive(),
    amount: Number(welcomeCreditFee?.amount) || 0,
  };

  const confirmDelete = (id) => {
    setRequestToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteRequest = async () => {
    if (isDeletingRequest || requestToDelete == null) return;
    try {
      setIsDeletingRequest(true);
      const res = await deleteSendPackageService(requestToDelete);
      if (res.status === 200 || res.status === 204) {
        // console.log("Delete Successfully");
        await fetchsendRequest();
      } else {
        console.log("Unable To Delete");
      }
    } catch (error) {
      console.error("Error deleting package:", error);
    } finally {
      setIsDeletingRequest(false);
      setIsDeleteModalOpen(false);
      setRequestToDelete(null);
    }
  };

  const FilteredRequests = sendRequests.filter((req) =>
    tab === "Awaiting Payment" ? req.status === "Accepted" : req.status === tab,
  );

  const openPaymentModal = (request) => {
    setSelectedRequest(request);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedRequest(null);
  };

  const handlePayNow = async (request) => {
    if (request?.id) {
      let response = await API.post(`/ryft/payment-session`, {
        package_id: request.id,
      });
      // console.log("response", response);
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(response.data.message);
      }
    }
    return Promise.resolve(null);
  };

  return (
    <section className="w-full flex flex-col items-center py-8 px-2">
      <div className="w-full mx-auto text-center md:text-left">
        <div className="text-left">
          <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
            My Send Request
          </h2>
          <p className="text-[#5F6C85] text-base md:text-lg mb-8">
            View and manage all the packages you are sending.
          </p>
        </div>
        <div className="w-full flex items-center justify-between gap-5 flex-col lg:flex-row mb-8">
          <div className="w-full max-w-[540px] overflow-x-auto border border-[#D6E2F5] rounded-[25px] p-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex gap-3 min-w-max whitespace-nowrap">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    if (t == "Awaiting Payment") {
                      setTab("Accepted");
                    } else {
                      setTab(t);
                    }
                  }}
                  className={`flex-shrink-0 px-4 py-2 cursor-pointer hover:bg-[#E6F0FF] hover:text-black rounded-full transition-all duration-200 font-bold
       									 ${
                           tab == "Accepted"
                             ? t == "Awaiting Payment"
                               ? "bg-[#E6F0FF] text-black"
                               : ""
                             : tab === t
                               ? "bg-[#E6F0FF] text-black"
                               : "bg-white text-black"
                         }`}
                >
                  {t?.replace("Cancelled", "Cancelled")}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              navigate("/dashboard/send-package");
            }}
            className="flex items-center justify-center gap-1 h-[50px] hover:bg-[white] hover:text-[#4681F4] cursor-pointer w-full md:w-[191px] border border-[#4681F4] group bg-[#4681F4] text-white  rounded-full text-base transition-all duration-300"
          >
            <div
              className=" text-white group-hover:text-[#4681F4]"
              dangerouslySetInnerHTML={{ __html: SendPackageIcon }}
            />
            New Send Request
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 text-left">
          {FilteredRequests.map((r, i) => (
            <div
              key={i}
              className="bg-[#E6F0FF] rounded-[20px] p-5 flex flex-col gap-4"
            >
              <div className="flex-1">
                <div className="flex flex-row items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-base md:text-lg text-black">
                    To:{" "}
                    {formatDestinationDisplay(
                      r.destination,
                      r.destination_postalcode,
                    )}
                  </span>

                  {r.rush_fee ? (
                    <span className="flex-shrink-0 self-start flex items-center mt-0.5 ml-auto gap-1 bg-[#F3E8FF] rounded-full border border-[#8B5CF6] text-[#8B5CF6] text-[10px] sm:text-xs px-2 py-[2px] shadow-sm font-medium">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
                        />
                      </svg>
                      Boosted
                    </span>
                  ) : null}
                </div>

                <div className="text-[#666666] text-sm md:text-base mb-1">
                  {r.contents}
                </div>

                <div className="text-[#666666] text-sm">
                  Requested on: {formatDate(r.created_at)}
                </div>

                <div className="text-[#666666] text-sm">
                  Your Offer: £ <span className="text-black">{r.offer}</span>
                </div>

                {r.f_name && (
                  <div className="text-[#666666] text-sm">
                    Traveller:{" "}
                    <span className="text-black">
                      {r.f_name} {r.l_name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex flex-row items-center">
                  <div className="flex-row sm:flex-col items-start sm:items-end gap-2">
                    {r.status === "Pending" && (
                      <div>
                        <span className="px-3 py-1 rounded-full bg-[#FEF9C3] text-black border border-[#F4B846] text-xs flex items-center gap-1">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
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
                          Pending
                        </span>
                        <div className="flex flex-row items-center text-xs gap-1 mt-2">
                          <button
                            onClick={() => {
                              navigate("/dashboard/send-package", {
                                state: {
                                  id: r.id,
                                },
                              });
                            }}
                            className="bg-[#D0E3FF] rounded-full border border-white p-1.5 cursor-pointer"
                          >
                            <img
                              src="/editblack.svg"
                              className="w-6 h-6"
                              alt="edit"
                            />
                          </button>
                          <div
                            onClick={() => confirmDelete(r.id)}
                            className="bg-[#EF4444] p-2 cursor-pointer rounded-full hover:bg-red-600 transition-colors"
                          >
                            <img src="/bin.svg" alt="bin" />
                          </div>
                        </div>
                      </div>
                    )}

                    {r?.status == "Accepted" && (
                      <div className="flex flex-col">
                        <span className="px-3 py-1 rounded-full bg-[#FFEFD0] border border-[#E3C487] text-[#E8BF6F] text-xs flex items-center gap-1">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
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
                          {r.status}
                        </span>
                        <div className="flex flex-row items-center text-xs gap-1 mt-2">
                          <div className="flex flex-row items-center text-xs gap-1 mt-2 ">
                            <div
                              onClick={() => confirmDelete(r.id)}
                              className="bg-[#EF4444] cursor-pointer p-2 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <img src="/bin.svg" alt="bin" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {r.status === "Pending Pickup" && (
                      <div className="flex flex-col">
                        <span className="px-3 py-1 rounded-full bg-[#FFEFD0] border border-[#E3C487] text-[#E8BF6F] text-xs flex items-center gap-1">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
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
                          {r.status}
                        </span>
                      </div>
                    )}

                    {r.status === "In Transit" && (
                      <span className="px-3 py-1 rounded-full bg-[#EAD1FF] border border-[#B796DD] text-[#B796DD] text-xs flex items-center gap-1">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
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
                        {r.status}
                      </span>
                    )}

                    {r.status === "Delivered" && (
                      <span className="px-3 py-1 rounded-full bg-[#05B71A] border border-white text-white text-xs flex items-center gap-1">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
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
                        {r.status}
                      </span>
                    )}

                    {r.status === "Cancelled" && (
                      <span className="px-3 py-1 rounded-full bg-red-500 border border-red-800 text-white text-xs flex items-center gap-1">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
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
                        {r.status?.replace("Cancelled", "Canceled")}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex justify-end ">
                    {r.status == "Accepted" && (
                      <div
                        onClick={() => openPaymentModal(r)}
                        className="bg-[#4681F4] text-white rounded-full p-2 text-sm font-thin cursor-pointer hover:bg-blue-600 transition-colors"
                      >
                        Pay Now
                      </div>
                    )}
                    {["Pending Pickup", "In Transit", "Delivered"].includes(
                      r.status,
                    ) && (
                      <div
                        onClick={() =>
                          navigate(
                            `/dashboard/package-track/${r?.tracking_number}`,
                          )
                        }
                        className="bg-[#4681F4] text-white rounded-full px-4 py-1 text-sm font-thin w-fit cursor-pointer hover:bg-blue-600 transition-colors"
                      >
                        Track
                      </div>
                    )}
                  </div>
                </div>
                {["Pending Pickup"].includes(r.status) && (
                  <div className="flex flex-row items-center cursor-pointer text-xs gap-1 mt-2 ">
                    <div
                      onClick={() => confirmDelete(r.id)}
                      className="bg-[#EF4444] p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <img src="/bin.svg" alt="bin" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        request={selectedRequest}
        onPay={handlePayNow}
        rushFee={rushFee}
        insuranceFee={insuranceFee}
        welcomeCredit={welcomeCredit}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeletingRequest) {
            setIsDeleteModalOpen(false);
            setRequestToDelete(null);
          }
        }}
        onConfirm={handleDeleteRequest}
        title="Cancel Request"
        message="Are you sure you want to cancel this Send Request?"
        confirmText="Cancel Request"
        cancelText="Cancel"
        confirmButtonClass="bg-[#EF4444] text-white hover:bg-red-600"
        cancelButtonClass="bg-[#E6F0FF] text-black hover:bg-[#D0E3FF]"
        isLoading={isDeletingRequest}
      />
    </section>
  );
};

export default MySendRequestPage;
