import React, { useState, useEffect } from "react";
import {
  notificationsService,
  readAllNotificationsService,
} from "../api/services/NotificationsService/Notifications";
import { getTravelerProfileService } from "../api/services/SearchTravelersService/SearchTravelers";
import { useNavigate } from "react-router-dom";
import { getDisputeService } from "../api/services/DisputeService/disputeService";

const routeMap = {
  VERIFICATION_UPDATE: "/dashboard",
  PASSWORD_CHANGED: "/dashboard/profile",
  PACKAGE_PICKUP: {
    path: "/dashboard/package-track/:id",
  },
  SHIPMENT_DECLINED: "/dashboard/send-requests",
  SHIPMENT_ACCEPTED: {
    path: "/dashboard/send-requests",
    state: { screen: "paymentscreen" },
  },
  PACKAGE_DELIVERED: {
    path: "/dashboard/package-track/:id",
  },
  DELIVERY_REVIEW_REMINDER: "/dashboard/shipment-history",
  TRAVELER_DELIVERY_COMPLETED: "/dashboard/shipment-history",
  NEW_BOOKING_REQUEST: "/dashboard/booking-request",
  PAYMENT_RECEIVED: {
    path: "/dashboard/travel-detail",
  },
  WITHDRAWAL_PROCESSED: "/dashboard/payments",
  SUBSCRIPTION_RENEWAL_REMINDER: "/dashboard/subscriptions",
  TRAVEL_PLAN_REMINDER: "/dashboard/my-travels",
  PACKAGE_CANCELED: {
    path: "/dashboard/send-requests",
    state: { screen: "canceledscreen" },
  },
  BOOKING_CANCELED: {
    path: "/dashboard/travel-detail",
  },
  SENDER_BOOKING_CANCELED: {
    path: "/dashboard/send-requests",
    state: { screen: "canceledscreen" },
  },
  SENDER_BOOKING_CANCELED_UNPAID: {
    path: "/dashboard/send-requests",
    state: { screen: "canceledscreen" },
  },
  NEW_DEVICE_LOGIN: "/dashboard/settings",
  NEW_MESSAGE: {
    path: "/dashboard/messages/:id",
  },
  PAYMENT_FAILED: "/dashboard/payments",
  BOOKING_CANCELED_UNPAID: {
    path: "/dashboard/travel-detail",
  },
  KYC_REMINDER: "/dashboard/verification/personal-details",

  DISPUTE_OPENED: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },
  DISPUTE_PARTIAL_REFUND_OFFERED: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },
  DISPUTE_PARTIAL_REFUND_RECEIVED: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },
  DISPUTE_REFUND_ACCEPTED_SENDER: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },
  DISPUTE_REFUND_ACCEPTED_TRAVELER: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },
  DISPUTE_REFUND_REJECTED_SENDER: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },
  DISPUTE_REFUND_REJECTED_TRAVELER: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },
  DISPUTE_FULL_REFUND_ACCEPTED_TRAVELER: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },
  DISPUTE_FULL_REFUND_ACCEPTED_SENDER: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },
  DISPUTE_RESOLVED: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },
  DISPUTE_CLAIMED: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },
  TRANSPORTR_STEPPED_IN: {
    path: "/dashboard/dispute-detail",
    disputeNotification: true,
  },

  FEATURE_PROMOTION: "/dashboard",
  REVIEW_RECEIVED: "/dashboard/profile",
  REVIEW_REPLY_RECEIVED: "/dashboard/user-profile",
};

const formatDate = (dateString) => {
  const date = new Date(dateString);

  const day = date.getDate();

  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  const month = date.toLocaleString("default", { month: "short" });

  const year = date.getFullYear();

  return `${day}${suffix} ${month}, ${year}`;
};

const NotificationItem = ({ item, onRedirect }) => (
  <div
    onClick={onRedirect}
    className="bg-white rounded-[20px] cursor-pointer border border-[#4681F4] p-4 md:p-6 flex justify-between items-start"
  >
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-3">
        {/* <div className=" flex items-center justify-center text-xl">{item.icon}</div> */}
        <p className="text-base text-black">{item.title}</p>
      </div>

      <div>
        <p className="text-sm text-[#666666] mt-1">{item.body}</p>
      </div>
    </div>
    <div className="text-xs text-[#666666] flex-shrink-0">
      {formatDate(item.created_at)}
    </div>
  </div>
);

const Notification = () => {
  const navigate = useNavigate();
  const [notifications, Setnotifications] = useState([]);

  const handleRedirect = async (type, notificationData) => {
    console.log("Notification data:", type, notificationData);

    const route = routeMap[type];

    if (type === "REVIEW_REPLY_RECEIVED" && notificationData?.reviewedUserId) {
      try {
        const res = await getTravelerProfileService(
          notificationData.reviewedUserId,
        );
        sessionStorage.setItem(
          "selectedTravellerProfile",
          JSON.stringify({
            travellerProfile: res?.data?.data,
            travellerId: notificationData.reviewedUserId,
          }),
        );
        navigate("/dashboard/user-profile", {
          state: {
            travellerProfile: res?.data?.data,
            travellerId: notificationData.reviewedUserId,
            hideBookButton: true,
          },
        });
      } catch (error) {
        console.error(
          "Error fetching traveller profile for review reply",
          error,
        );
        navigate("/dashboard/user-profile");
      }
      return;
    }

    if (route?.disputeNotification) {
      try {
        const packageId = notificationData?.packageId;
        const res = await getDisputeService();
        const disputes = res?.data?.data || [];
        const matched = disputes.find(
          (d) => String(d.package_id) === String(packageId),
        );
        if (matched?.id) {
          navigate("/dashboard/dispute-detail", {
            state: { disputeId: matched.id },
          });
        } else {
          navigate("/dashboard/resolution-center");
        }
      } catch (e) {
        console.error("Failed to find dispute by packageId", e);
        navigate("/dashboard/resolution-center");
      }
      return;
    }

    if (route) {
      if (typeof route === "object" && route.path) {
        let resolvedPath = route.path;

        // For PACKAGE_PICKUP and PACKAGE_DELIVERED, replace :id with the trackingNumber
        if (
          (type === "PACKAGE_PICKUP" || type === "PACKAGE_DELIVERED") &&
          notificationData?.trackingNumber
        ) {
          resolvedPath = route.path.replace(
            ":id",
            notificationData.trackingNumber,
          );
        }

        // For NEW_MESSAGE, replace :id with fromUserId
        if (type === "NEW_MESSAGE") {
          const fromUserId =
            notificationData?.fromUserId || notificationData?.data?.fromUserId;
          if (fromUserId) {
            resolvedPath = route.path.replace(":id", fromUserId);
          }
        }

        // For PAYMENT_RECEIVED, BOOKING_CANCELED, BOOKING_CANCELED_UNPAID replace :id with travelPlanId
        if (
          type === "PAYMENT_RECEIVED" ||
          type === "BOOKING_CANCELED" ||
          type === "BOOKING_CANCELED_UNPAID"
        ) {
          const travelPlanId =
            notificationData?.travelPlanId ||
            notificationData?.data?.travelPlanId ||
            notificationData?.travel_plan_id ||
            notificationData?.data?.travel_plan_id;
          if (travelPlanId) {
            resolvedPath = route.path.replace(":id", travelPlanId);
          }
        }

        const packageId =
          notificationData?.package_id || notificationData?.id || null;
        const travelId =
          notificationData?.travel_id ||
          notificationData?.travelPlanId ||
          notificationData?.data?.travelPlanId ||
          notificationData?.travel_plan_id ||
          notificationData?.data?.travel_plan_id ||
          null;

        navigate(resolvedPath, {
          state: {
            ...route.state,
            ...(packageId ? { package_id: packageId } : {}),
            ...(travelId ? { travel_id: travelId } : {}),
          },
        });
      } else {
        navigate(route);
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationsService();
      const list = res?.data?.data || [];
      Setnotifications(list);
      window.dispatchEvent(
        new CustomEvent("notifications-updated", {
          detail: { notifications: list },
        }),
      );
    } catch (error) {
      console.error("There is some Error When Fetching Notiifcations", error);
    }
  };

  useEffect(() => {
    const openNotificationPage = async () => {
      try {
        await readAllNotificationsService();
      } catch (error) {
        console.error("Error marking notifications as read", error);
      } finally {
        fetchNotifications();
      }
    };

    openNotificationPage();
  }, []);

  const today = notifications.filter((t) => {
    const today = new Date().toDateString();
    const notificationsDate = new Date(t.created_at).toDateString();

    return today === notificationsDate;
  });

  const earlier = notifications.filter((t) => {
    const earlier = new Date().toDateString();
    const notificationsDate = new Date(t.created_at).toDateString();

    return earlier !== notificationsDate;
  });

  return (
    <section className="w-full flex flex-col items-center py-8 px-4">
      <div className="w-full mx-auto">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
          Notifications
        </h2>
        <p className="text-[#5F6C85] text-base mb-6">
          A complete history of your account notifications.
        </p>

        <div className="bg-[#E6F0FF] rounded-2xl p-6 md:p-8">
          <h3 className="text-xl md:text-[28px] font-semibold text-black mb-4">
            Today
          </h3>
          <div className="flex flex-col gap-4 mb-6">
            {today.map((t, i) => (
              <NotificationItem
                key={i}
                item={t}
                onRedirect={() => handleRedirect(t.type, t.data)}
              />
            ))}
          </div>

          <h3 className="text-xl md:text-[28px] font-semibold text-black mb-4">
            Earlier
          </h3>
          <div className="flex flex-col gap-4">
            {earlier.map((t) => (
              <NotificationItem
                key={t.id}
                item={t}
                onRedirect={() => handleRedirect(t.type, t.data)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Notification;
