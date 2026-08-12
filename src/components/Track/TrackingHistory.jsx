import React from "react";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${formattedDate} at ${formattedTime}`;
};

const TrackingHistory = ({ shipmentData }) => {
  const statusTimeline = [
    {
      key: "delivered",
      date: shipmentData?.trackingHistory[0]?.delivered_at,
      title: shipmentData?.message || "Delivered to recipient",
      description:
        shipmentData?.destination || shipmentData?.delivery_address || "",
      isDelivered: true,
    },
    {
      key: "pickup",
      date: shipmentData?.trackingHistory[0]?.pickup_at,
      title: "Pickup by Traveller, Delivery code generated.",
      description: shipmentData?.pickup_address || shipmentData?.origin || "",
      isDelivered: false,
    },
    {
      key: "paid",
      date: shipmentData?.trackingHistory[0]?.paid_at,
      title: "Payment confirmed and hold applied.",
      description: shipmentData?.origin || "",
      isDelivered: false,
    },
    {
      key: "accepted",
      date: shipmentData?.trackingHistory[0]?.accepted_at,
      title: "Shipment accepted by traveller.",
      description: shipmentData?.origin || "",
      isDelivered: false,
    },
  ].filter((item) => item.date);

  const fallbackHistory = (shipmentData?.trackingHistory || []).map(
    (item, idx) => ({
      key: `fallback-${idx}`,
      date: item?.created_at || item?.updated_at,
      title: item?.message || "Package update",
      description: item?.location || "",
      isDelivered: String(item?.status || "").toLowerCase() === "delivered",
      status: item?.status,
    }),
  );

  const trackingItems = (
    statusTimeline.length > 0 ? statusTimeline : fallbackHistory
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <section className="w-full flex flex-col items-center pt-8">
      <div className="w-full text-center md:text-left">
        <div className="bg-[#E6F0FF] rounded-[20px] p-6 md:p-8">
          <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-6">
            Tracking History
          </h2>
          <div className="flex flex-col gap-6 text-left">
            {trackingItems?.map((item) => (
              <div
                key={item.key}
                className="bg-white rounded-[20px] border border-[#D6D6D6] p-6 flex flex-row gap-2"
              >
                <div className="flex items-start mt-1">
                  {item.isDelivered ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#05B71A"
                        strokeWidth="2"
                      />
                      <path
                        d="M7 12.5L10.2 15.5L17 8.8"
                        stroke="#05B71A"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <img src="/await.svg" alt="await" />
                  )}
                </div>
                <div className="">
                  <div className="font-bold text-black text-base md:text-lg">
                    {item.title}
                  </div>
                  {item.description ? (
                    <div className="text-[#666666] text-sm">
                      {item.description}
                    </div>
                  ) : null}
                  {item.status ? (
                    <div className="text-[#666666] text-sm">
                      Status: {item.status}
                    </div>
                  ) : null}
                  <div className="text-[#666666] text-sm">
                    {formatDate(item.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrackingHistory;
