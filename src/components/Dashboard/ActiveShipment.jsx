import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { shipmentsActiveService } from "../../api/services/DashboardService/ActiveShipments";

const ActiveShipment = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [viewmore, setViewmore] = useState(true);
  const [packageId, setPackageId] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await shipmentsActiveService();
        const data = res?.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.shipments)
              ? data.shipments
              : [];

        setShipments(list);
      } catch (err) {
        console.error("Error fetching active shipments:", err);
        setError("An error occurred while fetching shipments");
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getWidth = (status) => {
    const s = status?.toLowerCase();
    if (s === "accepted") return "25%";
    if (s === "pending pickup") return "50%";
    if (s === "in transit") return "75%";
    if (s === "delivered") return "100%";
    return "0%";
  };

  if (loading)
    return (
      <section className="w-full bg-[#E6F0FF] rounded-[20px] my-10 flex justify-center items-center py-20">
        <p className="text-[#5F6C85] text-lg font-medium">
          Loading active shipments...
        </p>
      </section>
    );

  if (error)
    return (
      <section className="w-full bg-[#E6F0FF] rounded-[20px] my-10 flex justify-center items-center py-20">
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </section>
    );

  return (
    <section className="w-full bg-[#E6F0FF] rounded-[20px] my-10 flex justify-center items-center">
      <div className="w-full p-5 md:p-7.5 lg:p-10 text-center md:text-left">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-3">
          Active Shipments
        </h2>
        <p className="text-[#5F6C85] text-base md:text-lg mb-6">
          Overview of your ongoing package deliveries.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shipments.length === 0 ? (
            <p className="text-[#5F6C85] text-base py-4">
              No active shipments found.
            </p>
          ) : (
            (viewmore ? shipments.slice(0, 10) : shipments).map(
              (shipment, idx) => (
                <div
                  key={shipment.id || idx}
                  className="bg-white rounded-[18px] shadow flex flex-col gap-2 p-5 md:p-6 min-h-[170px]"
                >
                  <div className="flex flex-col items-center md:flex-row md:items-start gap-4">
                    <div className="bg-[#4681F4] rounded-full w-15 h-15 flex items-center justify-center flex-shrink-0">
                      <img
                        src="/truck.svg"
                        alt="truck"
                        className="w-[34px] h-[34px]"
                      />
                    </div>
                    <div className="flex-1 w-full text-left overflow-hidden">
                      <div className="flex items-start justify-between">
                        <span
                          className="text-lg md:text-xl font-medium mt-[-5px] text-black truncate pr-2 scrollbar-hide"
                          title={
                            shipment.destination_city || shipment.destination
                          }
                        >
                          Package to{" "}
                          {shipment.destination_city || shipment.destination}
                        </span>
                        <button
                          onClick={() => {
                            navigate(
                              `/dashboard/package-track/${shipment.tracking_number}`,
                            );
                          }}
                          className="border border-[#4681F4] text-[#4681F4] font-bold h-[34px] w-[75px] rounded-full hover:bg-[#4681F4] hover:text-white transition-all cursor-pointer text-base md:text-lg flex-shrink-0"
                        >
                          Track
                        </button>
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[#4681F4] font-bold text-base">
                          {shipment.status}
                        </span>
                        <span className="text-[#666666] text-[14px]">
                          via {shipment.traveler_name || "—"}
                        </span>
                      </div>
                      <div className="text-sm mt-1 text-[#666666]">
                        Recipient:{" "}
                        <span className=" text-black">
                          {shipment.recipient_name}
                        </span>
                      </div>
                      <div className="text-sm mt-1 text-[#666666]">
                        Est. Delivery:{" "}
                        {formatDate(
                          shipment.estimated_arrival_date ||
                            shipment.pickup_date,
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="w-full h-2 bg-[#E6F0FF] rounded-full">
                          <div
                            className="h-2 bg-[#4681F4] rounded-full"
                            style={{
                              width: getWidth(shipment.status),
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-[#4681F4] font-semibold mt-1 inline-block">
                          {getWidth(shipment.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            )
          )}
        </div>

        {shipments.length >= 10 ? (
          <div className="flex justify-center item-center p-4 mt-4">
            <button
              onClick={() => setViewmore(!viewmore)}
              className="bg-[#4681F4] hover:bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-full transition-all duration-300"
            >
              {viewmore === true ? "View More" : "View Less"}
            </button>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </section>
  );
};

export default ActiveShipment;
