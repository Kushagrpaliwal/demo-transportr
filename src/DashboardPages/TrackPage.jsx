/* eslint-disable react-hooks/exhaustive-deps */
import Map from "../components/Track/Map";
import PackageTracker from "../components/Track/PackageTracker";
import TrackingHistory from "../components/Track/TrackingHistory";
import { useParams, useNavigate } from "react-router-dom";
import { ShipmentsTrackService } from "../api/services/TrackPackageService/TrackPackage";
import { useEffect, useState } from "react";
import { socket } from "../api/services/SocketIoService/Socket";
import { useProfile } from "../context/ProfileContext";
import OpenDisputeModal from "../components/Disputes/OpenDisputeModal";
import CreateFormalCaseModal from "../components/Disputes/CreateFormalCaseModal";

const TrackPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipmentData, setshipmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [travelerLocation, setTravelerLocation] = useState(null);
  const { profile } = useProfile();
  const [showOpenDisputeModal, setShowOpenDisputeModal] = useState(false);
  const [showFormalCaseModal, setShowFormalCaseModal] = useState(false);
  const [showReportButton, setShowReportButton] = useState(false);

  // const isTraveler = String(shipmentData?.traveller?.id) === String(profile?.data?.id);

  // Reset live traveler location whenever the tracked package changes so the
  // previous shipment's marker/trail doesn't leak into the new one.
  useEffect(() => {
    setTravelerLocation(null);
  }, [id]);

  // useEffect(() => {
  //     if (!isTraveler) return;

  //     const watchId = navigator.geolocation.watchPosition(
  //         (position) => {
  //             const loc = {
  //                 lat: position.coords.latitude,
  //                 lng: position.coords.longitude,
  //             };
  //             locationRef.current = loc;
  //             setTravelerLocation(loc);
  //         },
  //         (error) => console.error("Geolocation error:", error),
  //         { enableHighAccuracy: true }
  //     );
  //     return () => navigator.geolocation.clearWatch(watchId);
  // }, [isTraveler]);

  // useEffect(() => {
  //     if (!id || !isTraveler) return;

  //     const interval = setInterval(() => {
  //         if (!locationRef.current) return;
  //         if (document.visibilityState !== "visible") return;

  //         const { lat, lng } = locationRef.current;
  //         socket.emit("traveler_location", {
  //             packageIds: [id],
  //             lat,
  //             lng,
  //         });
  //         console.log("Sent location for package", id, lat, lng);
  //     }, 5000);

  //     return () => clearInterval(interval);
  // }, [id, isTraveler]);

  // Join socket room and listen for traveler location updates (for non-travelers)

  // Prefer numeric package_id for socket rooms; route :id is often tracking_number.
  const packageIdForSocket = shipmentData?.package_id ?? id;

  useEffect(() => {
    // console.log("packageIdForSocket in track page", packageIdForSocket);
    if (!shipmentData?.package_id) return;

    const joinRoom = () => {
      socket.emit("join_packages", { packageIds: [shipmentData?.package_id] });
      console.log("Joined package room:", shipmentData?.package_id);
    };

    const handleLocationUpdate = (data) => {
      // Backend: { packageId, lat, lng, timestamp }
      const { packageId, lat, lng, timestamp } = data || {};
      console.log("Location update received:", data);
      if (
        packageId != null &&
        String(packageId) !== String(packageIdForSocket)
      ) {
        return;
      }
      if (lat == null || lng == null) return;
      setTravelerLocation({ lat, lng, timestamp });
    };

    if (socket.connected) {
      joinRoom();
    }
    socket.on("connect", joinRoom);
    socket.on("traveler_location_update", handleLocationUpdate);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("traveler_location_update", handleLocationUpdate);
    };
  }, [shipmentData?.package_id, packageIdForSocket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let shipmentRes = null;
      shipmentRes = await ShipmentsTrackService(id);
      setshipmentData(shipmentRes?.data?.data);

      const disputeStatus = shipmentRes?.data?.data?.dispute?.status;
      if (
        shipmentRes?.data?.data?.dispute?.id &&
        disputeStatus === "Pending"
      ) {
        setShowReportButton(false);
      } else {
        setShowReportButton(true);
        checkReportButtonVisibility(shipmentRes?.data?.data);
      }
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  const checkReportButtonVisibility = (_shipmentData) => {
    if (!_shipmentData) return;

    if (_shipmentData?.trackingHistory[0]?.status == "Delivered") {
      const deliveredAt = new Date(
        _shipmentData?.trackingHistory[0]?.delivered_at,
      );
      const currentTime = new Date();
      const hoursDiff = (currentTime - deliveredAt) / (1000 * 60 * 60);

      if (hoursDiff <= 48) {
        setShowReportButton(true);
      } else {
        setShowReportButton(false);
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const isTraveler = () => {
    const travelerId = shipmentData?.traveller?.id;
    const profileId = profile?.data?.id;
    return String(travelerId) === String(profileId);
  };

  // console.log("travller is ", isTraveler());
  // console.log("sender is ", isSender());
  // console.log("profile id is", profile?.data?.id)

  const handleReportIssue = () => {
    setShowOpenDisputeModal(true);
  };

  const handleOpenFormalCase = () => {
    setShowOpenDisputeModal(false);
    setShowFormalCaseModal(true);
  };

  const handleFormalCaseSubmit = (responseData) => {
    setShowFormalCaseModal(false);
    const newDisputeId = responseData?.data?.id;
    if (newDisputeId) {
      navigate("/dashboard/dispute-detail", {
        state: { disputeId: newDisputeId },
      });
    } else {
      navigate("/dashboard/resolution-center");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <>
      <PackageTracker shipmentData={shipmentData} profile={profile} />
      <Map
        shipmentData={shipmentData}
        travelerLocation={travelerLocation}
        profile={profile}
      />
      <TrackingHistory shipmentData={shipmentData} />

      {showReportButton ? (
        <div className="mb-8 mt-4 flex justify-start">
          <button
            onClick={handleReportIssue}
            className={`px-6 py-2.5 w-full max-w-auto lg:max-w-[250px] bg-[#EF4444] text-white border-[#EF4444] rounded-full text-base justify-center font-semibold flex items-center gap-2 hover:bg-red-600 transition-colors cursor-pointer`}
          >
            Report an issue
          </button>
        </div>
      ) : null}

      <OpenDisputeModal
        isOpen={showOpenDisputeModal}
        onClose={() => setShowOpenDisputeModal(false)}
        travelerName={shipmentData?.traveller?.name || "the traveller"}
        travelerId={shipmentData?.traveller?.id}
        onOpenFormalCase={handleOpenFormalCase}
      />

      <CreateFormalCaseModal
        isOpen={showFormalCaseModal}
        onClose={() => setShowFormalCaseModal(false)}
        packageId={shipmentData?.package_id}
        trackingNumber={shipmentData?.tracking_number}
        userType={isTraveler() ? "traveler" : "sender"}
        senderId={profile?.data?.id}
        travelerId={shipmentData?.traveller?.id}
        onSubmit={handleFormalCaseSubmit}
        hasInsurance={Number(shipmentData?.insurance_premium) > 0}
      />
    </>
  );
};

export default TrackPage;
