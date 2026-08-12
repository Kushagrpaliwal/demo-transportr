import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  TrackPackageService,
  ShipmentsTrackService,
} from "../api/services/TrackPackageService/TrackPackage";

const PackageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [shipmentData, setShipmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("No package ID provided");
      setLoading(false);
      return;
    }
    fetchPackageDetails();
  }, [id]);

  const fetchPackageDetails = async () => {
    setLoading(true);
    try {
      const packageRes = await TrackPackageService(id);
      const currentPackage = packageRes?.data?.shipment;
      setPackageData(currentPackage);

      if (currentPackage?.tracking_number) {
        const shipmentRes = await ShipmentsTrackService(
          currentPackage.tracking_number,
        );
        setShipmentData(shipmentRes?.data?.data);
      }
    } catch {
      setError("Error fetching package details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = date.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${formattedDate} - ${formattedTime}`;
  };

  if (loading)
    return <div className="p-10 text-center">Loading p ackage details...</div>;
  if (error) return <p className="text-red-500 p-10 text-center">{error}</p>;
  if (!packageData) return null;

  return (
    <section className="w-full px-4 py-8 font-inter">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#4681F4] hover:text-blue-700 mb-6 transition-colors cursor-pointer"
        >
          <svg
            width="35"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col gap-6 items-start">
          <div className="w-full bg-[#EAF3FF] rounded-[20px] p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-[28px] font-bold text-black">
                Package Details
              </h2>
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border-2 border-yellow-400 text-yellow-600 bg-yellow-100`}
              >
                {packageData.status}
              </span>
            </div>

            <div className="bg-white/60 rounded-[16px] p-5 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-black mb-4">
                Package Information
              </h3>

              <div className="space-y-2 text-base text-black">
                <p>
                  <strong className="font-bold">Tracking #:</strong>{" "}
                  {packageData.tracking_number}
                </p>
                <p>
                  <strong className="font-bold">Contents:</strong>{" "}
                  {packageData.contents || shipmentData?.contents}
                </p>
                <p>
                  <strong className="font-bold">Origin:</strong>{" "}
                  {shipmentData?.from || packageData.origin}
                </p>
                <p>
                  <strong className="font-bold">Destination:</strong>{" "}
                  {shipmentData?.to || packageData.destination}
                </p>
              </div>

              <hr className="my-4 border-[#D6D6D6]" />

              <div className="space-y-1 text-base text-black">
                <p>
                  <strong className="font-bold">Sender:</strong>{" "}
                  {shipmentData?.sender_name ||
                    `${packageData.sender_first_name || ""} ${packageData.sender_last_name || ""}`.trim()}
                </p>
                <p>
                  <strong className="font-bold">Recipient:</strong>{" "}
                  {shipmentData?.recipient || packageData.recipient_name}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 w-full">
            <div className="w-full bg-[#EAF3FF] rounded-[20px] p-6 md:p-8 shadow-sm h-fit">
              <h3 className="text-xl md:text-2xl font-bold text-black mb-6">
                Tracking History
              </h3>

              <div className="space-y-0">
                <div className="flex flex-row ">
                  <div className=" rounded-full bg-yellow-500 w-3 h-3 mt-2" />
                  <div className="flex flex-col items-start">
                    <div className="font-semibold text-xl">
                      <div className="flex flex-row">
                        <div className="ml-2">{packageData.status}</div>
                      </div>
                    </div>
                    <div className="text-sm">
                      {formatDate(packageData.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PackageDetailPage;
