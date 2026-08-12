import React, { useState, useEffect } from "react";
import { User, Package, MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingButton from "../components/Common/LoadingButton";
import { DeleteIcon, SendPackageIcon } from "../assets/icons";
import {
  BookingRequest,
  BookingRequestAccept,
  BookingRequestDecline,
} from "../api/services/BookingRequestService/BookingRequest";
import { getTravelerProfileService } from "../api/services/SearchTravelersService/SearchTravelers";

export default function BookingRequests() {
  const [bookings, SetBookings] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchbookings = async () => {
    try {
      const res = await BookingRequest();
      SetBookings(res?.data?.data);
      // console.log("booking data", res?.data?.data)
      // console.log("Bookings Fetched Success")
    } catch (error) {
      console.error("There some error accessing the bookings", error);
    }
  };

  const handleAccept = async () => {
    if (!selectedBookingId || loading) return;

    try {
      setLoading(true);
      const res = await BookingRequestAccept(selectedBookingId);
      await fetchbookings();
      // console.log("Bookings Accepted Success", res, selectedBookingId)
      setSelectedBookingId(null);
      setModalType(null);
    } catch (error) {
      console.error("There some error accessing the bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedBookingId || loading) return;

    try {
      setLoading(true);
      const res = await BookingRequestDecline(selectedBookingId);
      await fetchbookings();
      // console.log("Bookings Decline Success", res, selectedBookingId)
      setSelectedBookingId(null);
      setModalType(null);
    } catch (error) {
      console.error("There some error accessing the bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchbookings();
  }, []);

  const travellerProfile = async (item) => {
    const senderid = item.sender_id;
    try {
      const res = await getTravelerProfileService(senderid);
      sessionStorage.setItem(
        "selectedTravellerProfile",
        JSON.stringify({
          travellerProfile: res?.data?.data,
          travellerId: senderid,
        }),
      );
      navigate("/dashboard/user-profile", {
        state: {
          travellerProfile: res?.data?.data,
          travellerId: senderid,
          travelerData: item,
          hideBookButton: true,
        },
      });
    } catch (error) {
      console.error(
        "There is Some Error while fetching the traveller profile",
        error,
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString);

    const day = date.getDate();
    const year = date.getFullYear();

    const month = date.toLocaleString("en-US", { month: "short" });

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

    return `${month} ${day}${getSuffix(day)}, ${year}`;
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Booking Requests</h1>
        <p className="text-gray-500 mt-2">
          Review and respond to package delivery requests from senders who want
          to book with you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {bookings.map((item) => (
          <div
            key={item.package_id}
            className="bg-gray-50 rounded-xl border p-6 space-y-5"
          >
            <div className="flex items-center gap-4">
              {item.sender_profile ? (
                <img
                  src={item.sender_profile}
                  alt="profile"
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-2xl font-bold text-gray-600 uppercase">
                  {item.sender_name ? item.sender_name.substring(0, 1).toUpperCase() : "U"}
                </div>
              )}

              <div className="flex-1">
                <h2 className="text-xl font-semibold">{item.sender_name}</h2>

                <div className="flex items-center gap-1 text-yellow-500 text-sm">
                  <Star size={16} fill="currentColor" />
                  <span className="text-gray-700">
                    {item?.rating?.average_rating}
                  </span>
                  {/* <span className="text-gray-700">({item?.total_trips} Trips)</span> */}
                </div>
              </div>

              <button
                onClick={() => travellerProfile(item)}
                className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm hover:bg-blue-200"
              >
                <User size={16} />
                View Profile
              </button>
            </div>
            {/* 
                        <div className="bg-blue-50 rounded-lg p-3 text-sm font-medium">
                            For Your Trip: T-FUT-03
                        </div> */}

            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="text-blue-600" size={18} />
                <h3 className="font-semibold">Package Details</h3>
              </div>

              <p className="text-gray-500 text-sm mb-3">{item.contents}</p>

              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="border rounded-full px-3 py-1 text-sm bg-white text-black">
                  {item.size}
                </span>

                <span className="text-sm text-gray-500">
                  Pickup by: {formatDate(item.pickup_date)}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="text-blue-600" size={18} />
                <h3 className="font-semibold">Route</h3>
              </div>

              <div className="flex flex-row">
                <div className="flex flex-col">
                  <div>{item.origin_city}</div>
                  <div className="text-gray-500 text-sm">
                    {item.origin_postalcode}
                  </div>
                </div>
                <div className="px-4 text-gray-500">to</div>
                <div className="flex flex-col">
                  <div>{item.destination_city}</div>
                  <div className="text-gray-500 text-sm">
                    {item.destination_postalcode}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Sender's Offer</span>

              <span className="text-green-600 text-xl font-semibold">
                £{item.offer}
              </span>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => {
                  setModalType("Decline");
                  setSelectedBookingId(item.package_id);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-full"
              >
                Decline
              </button>

              <button
                onClick={() => {
                  setModalType("Accept");
                  setSelectedBookingId(item.package_id);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full"
              >
                Accept Request
              </button>
            </div>

            {modalType === "Decline" &&
              selectedBookingId === item.package_id && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 px-4">
                  <div className="bg-white rounded-[20px] p-6 w-full max-w-[400px] shadow-lg flex flex-col items-center">
                    <h3 className="text-xl font-bold text-black mb-4">
                      Decline this shipment request?
                    </h3>
                    <p className="text-[#666666] text-center mb-6">
                      Are you sure you want to decline the booking request from{" "}
                      {item.sender_name}? This action cannot be undone.
                    </p>
                    <div className="flex w-full gap-4">
                      <LoadingButton
                        loading={loading}
                        onClick={() => setModalType(null)}
                        className="flex-1 py-3 bg-[#E6F0FF] text-black font-semibold rounded-full hover:bg-[#D0E3FF] transition-all cursor-pointer"
                      >
                        Cancel
                      </LoadingButton>

                      <LoadingButton
                        loading={loading}
                        onClick={handleDecline}
                        className="flex-1 py-3 bg-[#EF4444] text-white font-semibold rounded-full hover:bg-red-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Decline
                      </LoadingButton>
                    </div>
                  </div>
                </div>
              )}

            {modalType === "Accept" &&
              selectedBookingId === item.package_id && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 px-4">
                  <div className="bg-white rounded-[20px] p-6 w-full max-w-[400px] shadow-lg flex flex-col items-center">
                    <h3 className="text-xl font-bold text-black mb-4">
                      Accept this shipment request?
                    </h3>
                    <p className="text-[#666666] text-center mb-6">
                      You are about to accept carrying a {item.size} package
                      from {item.origin} to {item.destination}.
                    </p>
                    <div className="flex w-full gap-4">
                      <LoadingButton
                        loading={loading}
                        onClick={() => setModalType(null)}
                        className="flex-1 py-3 bg-[#E6F0FF] text-black font-semibold rounded-full hover:bg-[#D0E3FF] transition-all cursor-pointer"
                      >
                        Cancel
                      </LoadingButton>
                      <LoadingButton
                        loading={loading}
                        onClick={handleAccept}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Accept
                      </LoadingButton>
                    </div>
                  </div>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
