import React from "react";
import { useState, useEffect } from "react";
import {
  PlansService,
  PlanStatusService,
  SubscriptionPaymentSessionService,
  SubscriptionDowngradeService,
  SubscriptionSwitchPlanService,
} from "../api/services/SubscriptionsService/plans";
import SubscriptionPaymentModal from "../components/dashboard/SubscriptionPaymentModal";
import VerificationModal from "../components/Dashboard/VerificationModal";
import { usePopup } from "../context/PopupContext";

const SubscriptionPage = () => {
  const { showPopup } = usePopup();

  const [Allplans, SetAllplans] = useState([]);
  const [planStatus, setPlanStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDowngradeConfirmOpen, setIsDowngradeConfirmOpen] = useState(false);
  const [isSwitchConfirmOpen, setIsSwitchConfirmOpen] = useState(false);
  const [switchPlanTarget, setSwitchPlanTarget] = useState(null);
  const [isSwitchingPlan, setIsSwitchingPlan] = useState(false);

  const fetchplan = async () => {
    try {
      const res = await PlansService();
      SetAllplans(res?.data?.data || []);
    } catch (error) {
      console.error("Error Fetching Plans", error);
    }
  };

  const fetchstatus = async () => {
    try {
      const res = await PlanStatusService();
      setPlanStatus(res?.data?.data || null);
      // console.log("status", res?.data)
    } catch (error) {
      console.error("Error Fetching status", error);
    }
  };

  useEffect(() => {
    fetchplan();
    fetchstatus();
  }, []);

  const openPaymentModal = (plan) => {
    if (!plan || plan.id === planStatus?.plan_id) return;
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPlan(null);
  };

  const handleSubscriptionPaymentInit = async (plan) => {
    if (!plan?.id) return Promise.resolve(null);
    const response = await SubscriptionPaymentSessionService(plan?.id);
    if (response?.status === 200) return response.data;
    throw new Error(
      response?.data?.message ||
        "Unable to initialize subscription payment session.",
    );
  };

  const handleSubscriptionPaymentSuccess = async () => {
    await fetchstatus();
    await fetchplan();
  };

  const openDowngradeConfirm = () => {
    setIsDowngradeConfirmOpen(true);
  };

  const closeDowngradeConfirm = () => {
    setIsDowngradeConfirmOpen(false);
  };

  const handleConfirmDowngrade = async () => {
    try {
      await SubscriptionDowngradeService();
      await fetchstatus();
      await fetchplan();
      closeDowngradeConfirm();
      showPopup(
        "Subscription downgraded successfully. Your Pro features have been removed.",
        "success",
      );
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (error) {
      console.error("Error downgrading subscription", error);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";
    return new Date(dateValue).toLocaleDateString("en-GB");
  };

  const formatUnixDate = (timestampInSeconds) => {
    if (!timestampInSeconds) return "—";
    return new Date(Number(timestampInSeconds) * 1000).toLocaleDateString(
      "en-GB",
    );
  };

  const parseRyftResponse = (rawValue) => {
    if (!rawValue) return null;
    try {
      return typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
    } catch (error) {
      console.error("Invalid ryft_response JSON", error);
      return null;
    }
  };

  const getUpcomingBillingPeriod = (interval) => {
    const unit = interval?.unit?.toLowerCase();
    const count = Number(interval?.count || 0);
    if (unit?.includes("month")) {
      if (count === 12) return "yearly";
      return "monthly";
    }
    if (unit?.includes("year")) return "yearly";
    return null;
  };

  const formatAmount = (value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "0.00";
    return parsed.toFixed(2);
  };

  const getRyftPriceInMajorUnits = (price) => {
    if (price?.amount == null) return null;
    const amount = Number(price.amount);
    if (Number.isNaN(amount)) return null;
    return amount / 100;
  };

  const getUpcomingPlanTitle = (price) => {
    if (!price) return null;
    return price?.interval?.count == 1 ? Allplans?.find((plan) => plan.billingPeriod === "monthly")?.title : Allplans?.find((plan) => plan.billingPeriod === "yearly")?.title;
  };

  const isActiveSubscription =
    (planStatus?.ryft_status || planStatus?.status)?.toLowerCase() === "active";
  const currentPlan = Allplans?.find((plan) => plan.id === planStatus?.plan_id);
  const parsedRyftResponse = parseRyftResponse(planStatus?.ryft_response);
  const upcomingPlanTitle = getUpcomingPlanTitle(parsedRyftResponse?.price);
  const upcomingBillingPeriod = getUpcomingBillingPeriod(
    parsedRyftResponse?.price?.interval,
  );
  const upcomingBillingTimestamp =
    parsedRyftResponse?.billingDetail?.nextBillingTimestamp;
  const upcomingPlanStartsFrom = upcomingBillingTimestamp
    ? formatUnixDate(upcomingBillingTimestamp)
    : null;
  const upcomingPlanAmount = getRyftPriceInMajorUnits(parsedRyftResponse?.price);
  const upcomingPlanCurrency =
    parsedRyftResponse?.price?.currency || planStatus?.currency || "GBP";
  const currentPlanName = (currentPlan?.title || "").toLowerCase().trim();
  const isDifferentUpcomingPlanName = upcomingPlanTitle
    ? !upcomingPlanTitle.toLowerCase().includes(currentPlanName)
    : false;
  const isDifferentUpcomingBilling = upcomingBillingPeriod
    ? upcomingBillingPeriod !== (planStatus?.billing_period || "").toLowerCase()
    : false;
  const currentAmount = Number(planStatus?.amount);
  const isDifferentUpcomingPrice =
    upcomingPlanAmount != null &&
    !Number.isNaN(currentAmount) &&
    Math.abs(upcomingPlanAmount - currentAmount) >= 0.01;
  const showUpcomingPlanCard = Boolean(
    parsedRyftResponse &&
    upcomingBillingTimestamp &&
    (isDifferentUpcomingPlanName ||
      isDifferentUpcomingBilling ||
      isDifferentUpcomingPrice) &&
    (upcomingPlanTitle || isDifferentUpcomingPrice),
  );

  const openSwitchPlanConfirm = (plan) => {
    setSwitchPlanTarget(plan);
    setIsSwitchConfirmOpen(true);
  };

  const closeSwitchPlanConfirm = () => {
    setIsSwitchConfirmOpen(false);
    setSwitchPlanTarget(null);
  };

  const handleConfirmSwitchPlan = async () => {
    if (!switchPlanTarget?.id || isSwitchingPlan) return;
    try {
      setIsSwitchingPlan(true);
      await SubscriptionSwitchPlanService(switchPlanTarget.id);
      closeSwitchPlanConfirm();
      await fetchstatus();
      await fetchplan();
      showPopup("Plan switch scheduled successfully.", "success");
    } catch (error) {
      console.error("Error switching subscription plan", error);
      showPopup(
        error?.response?.data?.message || "Unable to switch plan right now.",
        "error",
      );
    } finally {
      setIsSwitchingPlan(false);
    }
  };

  return (
    <section className="w-full flex flex-col items-start py-8">
      <div className="w-full text-left">
        <div className="text-left">
          <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
            Manage Subscription
          </h2>
          <p className="text-[#5F6C85] text-base md:text-lg mb-8">
            Choose the plan that works best for you. Your current plan is
            highlighted.
          </p>
        </div>
        {planStatus && (
          <div className="mb-8 flex flex-col gap-4 max-w-sm">
            <div className="inline-flex items-start gap-3 bg-[#EBF3FF] border-2 border-[#4681F4] rounded-2xl px-5 py-4 min-w-[260px]">
              <svg
                className="mt-0.5 flex-shrink-0"
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2l2.09 6.26H21l-5.47 3.97 2.09 6.26L12 14.52l-5.62 3.97 2.09-6.26L3 8.26h6.91L12 2z"
                  fill="#4681F4"
                />
              </svg>
              <div className="flex flex-col gap-1">
                <p className="text-[#4681F4] font-bold text-base">
                  Your Current Plan
                </p>
                <p className="text-black text-sm">
                  <span className="font-semibold">Billing:</span>{" "}
                  {planStatus.billing_period?.toUpperCase()}
                </p>
                <p className="text-black text-sm">
                  <span className="font-semibold">Last Renewal:</span>{" "}
                  {formatDate(planStatus.last_renewal)}
                </p>
                {upcomingPlanStartsFrom && (
                  <p className="text-black text-sm">
                    <span className="font-semibold">Next Renewal:</span>{" "}
                    {upcomingPlanStartsFrom}
                  </p>
                )}
                {planStatus.cancelled_at && (
                  <p className="text-black text-sm">
                    <span className="font-semibold">Canceled at:</span>{" "}
                    {formatDate(planStatus.cancelled_at)}
                  </p>
                )}
                <p className="text-black text-sm">
                  <span className="font-semibold">Amount:</span> £{" "}
                  {planStatus.amount} {planStatus.currency}
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color:
                      (
                        planStatus.ryft_status || planStatus.status
                      )?.toLowerCase() === "active"
                        ? "#22C55E"
                        : "#EF4444",
                  }}
                >
                  Status:{" "}
                  {(planStatus.ryft_status || planStatus.status)?.toUpperCase()}
                </p>
              </div>
            </div>
            {showUpcomingPlanCard && (
              <div className="inline-flex items-start gap-3 bg-[#F0F6FF] border border-[#BFD7FF] rounded-2xl px-5 py-4 min-w-[260px]">
                <svg
                  className="mt-0.5 flex-shrink-0"
                  width="22"
                  height="22"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4 12h16M12 4v16"
                    stroke="#4681F4"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col gap-1">
                  <p className="text-[#4681F4] font-bold text-base">
                    Upcoming Plan
                  </p>
                  <p className="text-black text-sm">
                    <span className="font-semibold">Plan:</span>{" "}
                    {upcomingPlanTitle || currentPlan?.title || "—"}
                  </p>
                  <p className="text-black text-sm">
                    <span className="font-semibold">Billing:</span>{" "}
                    {(upcomingBillingPeriod || "—").toUpperCase()}
                  </p>
                  {upcomingPlanStartsFrom && (
                    <p className="text-black text-sm">
                      <span className="font-semibold">Starts from:</span>{" "}
                      {upcomingPlanStartsFrom}
                    </p>
                  )}
                  {upcomingPlanAmount != null && (
                    <p className="text-black text-sm">
                      <span className="font-semibold">Amount:</span> £{" "}
                      {formatAmount(upcomingPlanAmount)} {upcomingPlanCurrency}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col xl:flex-row gap-8 justify-start items-stretch xl:items-stretch w-full">
          {Allplans?.map((plan) => (
            <div
              key={plan.id}
              className={`flex-1 rounded-[20px] h-[460px] flex flex-col justify-between items-center px-6 pb-8 w-full min-w-[260px] md:max-w-[350px] transition-all duration-200
								${
                  plan.id === planStatus?.plan_id
                    ? "border-2 border-[#4681F4]"
                    : "border bg-white"
                }`}
            >
              <div className="w-full flex flex-col text-left items-center">
                <div
                  className={`w-full rounded-b-[20px] max-w-[147px] h-[91px] justify-center flex flex-col items-center mb-4
									${
                    plan.id === planStatus?.plan_id
                      ? "bg-[#BFD7FF] text-white"
                      : plan.billingPeriod === "free"
                        ? "bg-[#F4B846] text-black"
                        : "bg-[#4681F4] text-white"
                  }`}
                >
                  <div className="font-semibold text-xl">{plan.title}</div>
                  <div className="text-base">{plan.subtitle}</div>
                </div>
                <div
                  className={`font-bold text-lg lg:text-2xl mb-4 ${plan.billingPeriod === "free" ? "text-[#F5A623]" : "text-[#4681F4]"}`}
                >
                  £{plan.amount}
                </div>
                <ul className="w-full mb-6 flex flex-col gap-2 md:gap-5">
                  {plan.points?.split(",").map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-[#5F6C85] text-sm"
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="text-green-500"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="#22C55E"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {feature.replace(/'/g, "")}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => {
                  if (plan.billingPeriod === "free") {
                    openDowngradeConfirm();
                    return;
                  }
                  if (isActiveSubscription) {
                    openSwitchPlanConfirm(plan);
                    return;
                  }
                  openPaymentModal(plan);
                }}
                className={`w-full rounded-full h-[50px] font-semibold text-xl transition-all duration-300
						${
              plan.id === planStatus?.plan_id
                ? "bg-[#BFD7FF] text-white cursor-not-allowed"
                : plan.billingPeriod === "free"
                  ? planStatus == null
                    ? "bg-[#f5d08a] text-gray-500 hover:bg-[#f5e8c9] cursor-not-allowed"
                    : "bg-[#F4B846] text-black hover:bg-[#FFD36E] cursor-pointer"
                  : "bg-[#4681F4] text-white hover:bg-[#A0BFFA] cursor-pointer"
            }`}
                disabled={
                  (plan.billingPeriod == "free" && planStatus == null) ||
                  plan.id === planStatus?.plan_id
                }
              >
                {plan.id === planStatus?.plan_id ||
                (planStatus == null && plan.billingPeriod == "free")
                  ? "Current Plan"
                  : plan.billingPeriod === "free"
                    ? "Downgrade to free"
                    : "Switch Plan"}
              </button>
            </div>
          ))}
        </div>
      </div>
      <SubscriptionPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        plan={selectedPlan}
        onPay={handleSubscriptionPaymentInit}
        onSuccess={handleSubscriptionPaymentSuccess}
      />
      <VerificationModal
        isOpen={isDowngradeConfirmOpen}
        onClose={closeDowngradeConfirm}
        title="Confirm Downgrade"
        description="This will cancel your recurring subscription payments immediately and downgrade you to the free plan right away. Your Pro features will be removed instantly, and no refund will be issued."
        steps={[]}
        primaryAction={{
          label: "Downgrade for Free",
          onClick: handleConfirmDowngrade,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: closeDowngradeConfirm,
        }}
      />
      {isSwitchConfirmOpen && switchPlanTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#E6F0FF] p-6 text-center">
            <button
              onClick={closeSwitchPlanConfirm}
              disabled={isSwitchingPlan}
              className="absolute top-4 right-4 text-xl font-bold cursor-pointer text-[#5F6C85] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              ✕
            </button>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#4681F4] text-[#4681F4]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 7H4m0 0l2.5-2.5M4 7l2.5 2.5M15 17h5m0 0l-2.5 2.5M20 17l-2.5-2.5"
                  stroke="#4681F4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-black">
              Confirm Plan Switch
            </h3>
            <p className="mt-2 text-[#5F6C85] text-sm md:text-base">
              When you switch plans, your current subscription will continue
              until the end of its billing period. The new plan will
              automatically start after that.
            </p>

            <div className="mt-5 rounded-2xl border border-[#CCD7E6] bg-white p-4 text-left">
              <div className="flex items-center justify-between border-b border-[#D9E1EC] pb-3">
                <div>
                  <p className="text-sm font-semibold text-[#5F6C85]">
                    From Current Plan
                  </p>
                  <p className="text-lg font-bold text-black">
                    {(
                      currentPlan?.title ||
                      planStatus?.billing_period ||
                      "Current"
                    )
                      .toString()
                      .toUpperCase()}
                  </p>
                </div>
                <p className="text-2xl font-bold text-black">
                  £{formatAmount(planStatus?.amount)}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-sm font-semibold text-[#5F6C85]">
                    To New Plan
                  </p>
                  <p className="text-lg font-bold text-[#4681F4]">
                    {(
                      switchPlanTarget?.title ||
                      switchPlanTarget?.billingPeriod ||
                      "New Plan"
                    )
                      .toString()
                      .toUpperCase()}
                  </p>
                </div>
                <p className="text-2xl font-bold text-[#4681F4]">
                  £{formatAmount(switchPlanTarget?.amount)}
                </p>
              </div>
            </div>

            <button
              onClick={handleConfirmSwitchPlan}
              disabled={isSwitchingPlan}
              className="mt-6 w-full rounded-full h-[46px] bg-[#4681F4] text-base font-semibold text-white hover:bg-[#A0BFFA] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSwitchingPlan ? "Switching..." : "Confirm & Switch"}
            </button>
            <button
              onClick={closeSwitchPlanConfirm}
              disabled={isSwitchingPlan}
              className="mt-4 w-full rounded-full h-[46px] border border-white bg-[#D0E3FF] text-base font-semibold text-black hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default SubscriptionPage;
