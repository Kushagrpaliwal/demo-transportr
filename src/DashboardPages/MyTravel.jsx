import React, { useState, useEffect } from "react";
import { DeleteIcon, SendPackageIcon } from "../assets/icons";
import { useNavigate } from "react-router-dom";
import {
  TravelPlansService,
  TravelPlanCancelService,
  TravelPlanDeleteService,
} from "../api/services/TravelPlansService/Travelplan";
import ConfirmationModal from "../components/Common/ConfirmationModal";

const MyTravel = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("active");
  const [plans, Setplans] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [packageToCancel, setPackageToCancel] = useState(null);
  const [isDeletingTravelPlan, setIsDeletingTravelPlan] = useState(false);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  // const [packageData, SetpackageData] = useState();

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

  const formatTravelDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getTravelStatusBadge = (status) => {
    const isUpcoming = status === "Upcoming";
    return {
      className: isUpcoming
        ? "bg-[#F2F6FB] border border-[#D6D6D6] text-black"
        : "bg-[#D0E3FF] border border-[#4681F4] text-[#4681F4]",
      icon: isUpcoming ? "/upcoming.svg" : "/inprogtruck.svg",
    };
  };

  const confirmDelete = (id) => {
    setPlanToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmCancelPackage = (id, travel_plan_id) => {
    setPackageToCancel({ package_id: id, travel_plan_id });
    setIsCancelModalOpen(true);
  };

  const fetchtravelplans = async () => {
    try {
      const res = await TravelPlansService();
      const data = res?.data?.travel_plans;
      // console.log(data);
      Setplans(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchtravelplans();
  }, []);

  const handleTravelDelete = async () => {
    if (isDeletingTravelPlan || planToDelete == null) return;
    try {
      setIsDeletingTravelPlan(true);
      const res = await TravelPlanDeleteService(planToDelete);
      if (res.ok) {
        // console.log("Delete SuccessFully");
      } else {
        // console.log("Unable To Delete");
      }
      fetchtravelplans();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeletingTravelPlan(false);
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleTravelCancel = async () => {
    if (isCancellingBooking || !packageToCancel) return;

    try {
      setIsCancellingBooking(true);
      const res = await TravelPlanCancelService(packageToCancel);

      if (res.ok) {
        // console.log("Cancel SuccessFully");
      } else {
        console.log("Unable To Cancel");
      }
      fetchtravelplans();
    } catch (error) {
      console.error(error);
    } finally {
      setIsCancellingBooking(false);
      setIsCancelModalOpen(false);
      setPackageToCancel(null);
    }
  };

  const isPlanActive = (plan) => {
    const todaydate = new Date();
    todaydate.setHours(0, 0, 0, 0);
    const arrivalDate = new Date(plan.estimated_arrival_date);
    arrivalDate.setHours(0, 0, 0, 0);
    const departureDate = new Date(plan.departure_date);
    departureDate.setHours(0, 0, 0, 0);
    return arrivalDate >= todaydate || departureDate >= todaydate;
  };

  const filteredplans = plans?.filter((i) => {
    if (tab === "active") {
      return i.status !== "Completed";
    } else {
      return i.status === "Completed";
    }
  });

  const activecount = plans?.filter(
    (i) => i.status !== "Completed",
  ).length;
  const pastcount = plans?.filter(
    (i) => i.status === "Completed",
  ).length;

  return (
    <section className="w-full flex flex-col items-center py-8 px-2">
      <div className="w-full mx-auto text-center md:text-left">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
          Your Listed Travel
        </h2>
        <p className="text-[#5F6C85] text-base md:text-lg mb-8">
          Manage your upcoming, active, and past trips.
        </p>
        <div className="w-full flex items-center justify-between gap-5 flex-col md:flex-row mb-8">
          <div className="flex items-center rounded-[25px] p-2.5 h-[50px] w-[298px] bg-[#D6E2F5] gap-1">
            <button
              className={`w-[189px] h-8 rounded-full cursor-pointer text-base transition-all duration-300 ${tab === "active" ? "bg-[#E6F0FF] text-black" : "bg-transparent text-[#666666]"}`}
              onClick={() => setTab("active")}
            >
              Active & Upcoming ({activecount})
            </button>
            <button
              className={`w-[98px] h-8 rounded-full cursor-pointer text-base transition-all duration-300 ${tab === "past" ? "bg-[#E6F0FF] text-black" : "bg-transparent text-[#666666]"}`}
              onClick={() => setTab("past")}
            >
              Past ({pastcount})
            </button>
          </div>
          <button
            onClick={() => {
              navigate("/dashboard/new-travels");
            }}
            className="flex items-center justify-center gap-1 h-[50px] hover:bg-[white] hover:text-[#4681F4] cursor-pointer w-full md:w-[205px] border border-[#4681F4] group bg-[#4681F4] text-white rounded-full text-base transition-all duration-300"
          >
            <div
              className=" text-white group-hover:text-[#4681F4]"
              dangerouslySetInnerHTML={{ __html: SendPackageIcon }}
            />
            Add New Travel Plan
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
          {filteredplans?.map((card) => {
            const statusBadge = getTravelStatusBadge(card.status);
            const originCity =
              card.origin_city ||
              extractCityFromAddress(card.origin, card.origin_postcode);
            const destinationCity =
              card.destination_city ||
              extractCityFromAddress(
                card.destination,
                card.destination_postcode,
              );

            return (
            <div
              key={card?.id}
              className="bg-[#E6F0FF] rounded-2xl p-6 flex flex-col gap-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex w-fit items-center gap-1 text-xs px-4 py-1 rounded-full whitespace-nowrap ${statusBadge.className}`}
                >
                  <img
                    src={statusBadge.icon}
                    alt="status"
                    className="w-3 h-3"
                  />
                  {card.status}
                </span>
                <div className="flex items-center gap-2">
                  {isPlanActive(card) && card.status !== "Completed" && (
                    <button
                      onClick={() => {
                        navigate("/dashboard/new-travels", {
                          state: { travel_id: card.id },
                        });
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#4681F4] bg-white hover:bg-[#E6F0FF] transition-all duration-300 cursor-pointer"
                    >
                      <img src="/editblack.svg" alt="edit" className="w-4 h-4" />
                    </button>
                  )}
                  {card?.booked_packages?.length === 0 && (
                    <button
                      onClick={() => confirmDelete(card.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#EF4444] bg-white hover:bg-red-50 transition-all duration-300 cursor-pointer group"
                    >
                      <div
                        className="text-[#EF4444] flex items-center [&_svg]:w-4 [&_svg]:h-4 [&_path]:fill-[#EF4444]"
                        dangerouslySetInnerHTML={{ __html: DeleteIcon }}
                      />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-3">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4681F4]" />
                  <div className="w-0.5 flex-1 min-h-6 bg-[#4681F4]" />
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-[#4681F4] bg-transparent" />
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-gray-500">From</p>
                    <p className="font-semibold text-lg text-black">
                      {originCity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">To</p>
                    <p className="font-semibold text-lg text-black">
                      {destinationCity}
                    </p>
                  </div>
                </div>
              </div>

              {card?.departure_date ? (
                <div className="flex mt-4 gap-8 text-[#666666] text-sm">
                  <div>
                    <p className="text-gray-500">Departure</p>
                    <p className="font-semibold text-black text-base">
                      {formatTravelDate(card.departure_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Est. Arrival</p>
                    <p className="font-semibold text-black text-base">
                      {formatTravelDate(card.estimated_arrival_date)}
                    </p>
                  </div>
                </div>
              ) : null}

              {card?.rate_small || card?.rate_medium || card?.rate_large ? (
                <div className="flex flex-row gap-2 mt-2 flex-wrap">
                  {card?.rate_small && (
                    <span className="bg-[#E6F0FF] border border-[#B8D0F5] text-black text-sm px-3 py-1 rounded-full">
                      S: £{card?.rate_small}
                    </span>
                  )}
                  {card?.rate_medium && (
                    <span className="bg-[#E6F0FF] border border-[#B8D0F5] text-black text-sm px-3 py-1 rounded-full">
                      M: £{card?.rate_medium}
                    </span>
                  )}
                  {card?.rate_large && (
                    <span className="bg-[#E6F0FF] border border-[#B8D0F5] text-black text-sm px-3 py-1 rounded-full">
                      L: £{card?.rate_large}
                    </span>
                  )}
                </div>
              ) : null}

              {card?.booked_packages?.length > 0 ? (
                <div className="mt-2">
                  <div className="font-semibold text-black text-base mb-2">
                    Booked Packages
                  </div>
                  <div className="flex flex-col gap-2">
                    {card.booked_packages.map((i) => (
                      <div
                        key={i.id}
                        className="bg-[#D0E3FF] rounded-2xl p-4 flex flex-row justify-between items-center border border-[#B8D0F5]"
                      >
                        <div className="flex flex-col">
                          <div className="font-medium text-black text-base">
                            {i.contents}
                          </div>
                          <div className="text-[#666666] text-sm">
                            To:{" "}
                            <span className="font-medium text-black">
                              {i.recipient_name}
                            </span>
                          </div>
                        </div>
                        {i.status == "Pending" ||
                        i.status == "Accepted" ||
                        i.status == "Pending Pickup" ? (
                          <button
                            onClick={() =>
                              confirmCancelPackage(i.id, i.travel_plan_id)
                            }
                            className="flex items-center justify-center cursor-pointer flex-shrink-0 gap-1 bg-[#EF4444] hover:bg-white text-white hover:text-[#EF4444] border border-[#EF4444] transition-all duration-300 text-md px-4 py-2 rounded-full whitespace-nowrap font-semibold group"
                          >
                            <div className="text-white group-hover:text-[#EF4444] flex items-center" />
                            X Cancel
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                onClick={() => {
                  if (card.status !== "Completed") {
                    navigate("/dashboard/travel-detail", {
                      state: { travel_id: card.id },
                    });
                  } else {
                    navigate("/dashboard/new-travels", {
                      state: { travel_id: card.id, mode: "view" },
                    });
                  }
                }}
                className="mt-4 w-full h-[46px] bg-[#4681F4] hover:bg-white hover:text-[#4681F4] border border-[#4681F4] text-white font-semibold rounded-full text-base transition-all duration-300 cursor-pointer"
              >
                View Full Details
              </button>
            </div>
            );
          })}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeletingTravelPlan) {
            setIsDeleteModalOpen(false);
            setPlanToDelete(null);
          }
        }}
        onConfirm={handleTravelDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this travel plan? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-[#EF4444] text-white hover:bg-red-600"
        cancelButtonClass="bg-[#E6F0FF] text-black hover:bg-[#D0E3FF]"
        icon={DeleteIcon}
        isLoading={isDeletingTravelPlan}
      />

      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          if (!isCancellingBooking) {
            setIsCancelModalOpen(false);
            setPackageToCancel(null);
          }
        }}
        onConfirm={handleTravelCancel}
        title="Confirm Cancellation"
        message="Are you sure you want to cancel this package booking?"
        confirmText="Yes, Cancel"
        cancelText="Keep Booking"
        confirmButtonClass="bg-[#EF4444] text-white hover:bg-red-600"
        cancelButtonClass="bg-[#E6F0FF] text-black hover:bg-[#D0E3FF]"
        isLoading={isCancellingBooking}
      />
    </section>
  );
};

export default MyTravel;
