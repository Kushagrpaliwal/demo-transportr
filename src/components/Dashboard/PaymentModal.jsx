import { useEffect, useRef, useState } from "react";
import API from "../../api";
import { PackageQuoteService } from "../../api/services/sendrequestsService/sendrequests";
import { calcInsuranceFee } from "../../utils/insuranceCost";

const formatAmount = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "0.00";
  return parsed.toFixed(2);
};

const parseServerAmount = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDateToDDMMYYYY = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

const RYFT_SDK_URL = "https://embedded.ryftpay.com/v2/ryft.min.js";

// Ryft SDK expects these exact DOM ids/classes (matching the working HTML example).
const RYFT_PAY_FORM_ID = "ryft-pay-form";
const RYFT_PAY_BTN_ID = "pay-btn";
const RYFT_PAY_ERROR_ID = "ryft-pay-error";

const isPaymentApproved = (status) =>
  status === "Approved" || status === "Captured";

const loadRyftSdk = () =>
  new Promise((resolve, reject) => {
    if (window.Ryft) {
      resolve(window.Ryft);
      // console.log("Ryft SDK already loaded");
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${RYFT_SDK_URL}"]`,
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Ryft), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Ryft SDK.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RYFT_SDK_URL;
    script.async = true;
    script.onload = () => resolve(window.Ryft);
    script.onerror = () => reject(new Error("Failed to load Ryft SDK."));
    document.body.appendChild(script);
  });

const PaymentModal = ({
  isOpen,
  onClose,
  request,
  onPay,
  rushFee,
  insuranceFee,
  welcomeCredit,
}) => {
  const [showPayButton, setShowPayButton] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isRyftReady, setIsRyftReady] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [ryftSession, setRyftSession] = useState(null);
  const [quotedPremium, setQuotedPremium] = useState(0);
  const isPayingRef = useRef(isPaying);

  useEffect(() => {
    isPayingRef.current = isPaying;
  }, [isPaying]);

  useEffect(() => {
    if (isOpen) {
      setShowPayButton(false);
      setRyftSession(null);
      setIsInitializing(false);
      setIsPaying(false);
      setIsRyftReady(false);
      setPaymentError("");
      setQuotedPremium(0);
    }
  }, [isOpen, request?.id]);

  useEffect(() => {
    if (
      !isOpen ||
      !request?.declared_value ||
      !Number(request?.insurance_premium)
    ) {
      setQuotedPremium(0);
      return;
    }

    let cancelled = false;

    PackageQuoteService({ declared_value: request.declared_value })
      .then((res) => {
        if (!cancelled) {
          setQuotedPremium(Number(res?.data?.quote?.premium) || 0);
        }
      })
      .catch(() => {
        if (!cancelled) setQuotedPremium(0);
      });

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    request?.id,
    request?.declared_value,
    request?.insurance_premium,
  ]);

  const packageCost = Number(request?.offer) || 0;
  const hasInsurance = Number(request?.insurance_premium) > 0;
  const insurancePremiumBase = quotedPremium;
  const insuranceFeeCalc =
    hasInsurance && quotedPremium > 0
      ? calcInsuranceFee(quotedPremium, insuranceFee)
      : null;
  const insuranceTotal = insuranceFeeCalc?.total ?? 0;
  const shouldShowRushFee =
    Number(rushFee?.hide) != 1 && request?.rush_fee == 1;
  const rushFeeAmount = shouldShowRushFee ? Number(rushFee?.amount) || 0 : 0;
  const estimatedSubtotal =
    packageCost +
    (hasInsurance ? insurancePremiumBase : 0) +
    (hasInsurance ? insuranceTotal : 0) +
    rushFeeAmount;

  const serverPackage = ryftSession?.package;
  const serverCreditDiscount = serverPackage
    ? parseServerAmount(serverPackage.creditDiscount)
    : 0;
  const estimatedCredit =
    !serverPackage && welcomeCredit?.eligible
      ? Math.min(Number(welcomeCredit?.amount) || 0, estimatedSubtotal)
      : 0;
  const creditDiscount =
    serverCreditDiscount > 0 ? serverCreditDiscount : estimatedCredit;
  const total = serverPackage
    ? parseServerAmount(serverPackage.totalAmount)
    : Math.max(0, estimatedSubtotal - estimatedCredit);

  const handleInitializePayment = async () => {
    if (!request || isInitializing || isPaying) return;

    setIsInitializing(true);
    setPaymentError("");

    try {
      const ryftSession = await onPay?.(request);

      if (!ryftSession?.publicKey || !ryftSession?.clientSecret) {
        throw new Error("Unable to initialize payment session.");
      }
      setShowPayButton(true);
      setRyftSession(ryftSession);
    } catch (error) {
      console.error("Failed to initialize Ryft payment:", error);
      setPaymentError(error?.message || "Unable to initialize payment.");
      setIsInitializing(false);
    }
  };

  // Important: Ryft.init must run only after the SDK can find its target DOM elements.
  // We do that here (after `showPayButton` mounts the form).
  useEffect(() => {
    if (!isOpen || !showPayButton || !ryftSession) return;

    let cancelled = false;

    const initRyft = async () => {
      try {
        const Ryft = await loadRyftSdk();

        const ryftConfig = {
          publicKey: ryftSession?.publicKey,
          clientSecret: ryftSession?.clientSecret,
          customerPaymentMethods: {
            allowStorage: {
              enabled: true,
            },
          },
          style: {
            backgroundColor: "#E6F0FF",
            borderRadius: "12px",
            fontSize: "14px",
            color: "#666666",
            transition: "border-color 0.3s ease",
            outline: "none",
            border: "1px solid #ddd",
            padding: "12px",
            marginBottom: "16px",
          },
        };

        if (
          ryftSession?.savedCardDetails &&
          ryftSession?.savedCardDetails?.length
        ) {
          ryftConfig.customerPaymentMethods = {
            rawJson: JSON.stringify({ items: ryftSession?.savedCardDetails }),
            allowStorage: {
              enabled: true,
            },
          };
        }

        Ryft.init(ryftConfig);

        Ryft.addEventHandler("cardValidationChanged", (event) => {
          const payButton = document.getElementById(RYFT_PAY_BTN_ID);
          if (payButton) {
            payButton.disabled = !event?.isValid || isPayingRef.current;
          }
        });

        Ryft.addEventHandler("paymentMethodSelectionChanged", (event) => {
          const payButton = document.getElementById(RYFT_PAY_BTN_ID);
          if (payButton) {
            payButton.disabled = !event?.paymentMethod || isPayingRef.current;
          }
        });

        if (!cancelled) setIsRyftReady(true);
      } catch (error) {
        console.error("Failed to initialize Ryft payment:", error);
        if (!cancelled)
          setPaymentError(error?.message || "Unable to initialize payment.");
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    initRyft();

    return () => {
      cancelled = true;
    };
  }, [isOpen, showPayButton, ryftSession]);

  const handleSubmitPayment = async (event) => {
    event.preventDefault();
    if (!window.Ryft || isPaying) return;

    setPaymentError("");
    setIsPaying(true);

    try {
      const paymentSession = await window.Ryft.attemptPayment();

      if (isPaymentApproved(paymentSession?.status)) {
        if (
          paymentSession?.paymentMethod &&
          paymentSession?.paymentMethod?.tokenizedDetails?.id &&
          ryftSession?.savedCardDetails?.filter(
            (card) =>
              card?.id == paymentSession?.paymentMethod?.tokenizedDetails?.id,
          ).length == 0
        ) {
          await API.post(`/payments/payment-method`, {
            paymentMethod: paymentSession.paymentMethod,
          });
        }
        window.alert("Payment Successful! Redirecting...");
        onClose?.();
        window.location.reload();
        return;
      }

      if (paymentSession?.lastError && window.Ryft?.getUserFacingErrorMessage) {
        const userError = window.Ryft.getUserFacingErrorMessage(
          paymentSession.lastError,
        );
        setPaymentError(userError || "Payment failed.");
        window.alert(userError || "Payment failed.");
      } else {
        const msg = "Payment failed. Please try again.";
        setPaymentError(msg);
        window.alert(msg);
      }
    } catch (error) {
      console.error("Ryft payment error:", error);
      const msg = "An unexpected error occurred while processing payment.";
      setPaymentError(msg);
      window.alert(msg);
    } finally {
      setIsPaying(false);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#D7E3F3] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-black">Payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 cursor-pointer rounded-full bg-white text-lg leading-none text-black hover:bg-gray-100"
            aria-label="Close payment modal"
          >
            ×
          </button>
        </div>

        <div className="rounded-2xl text-[#333] border border-[#CCD7E6] bg-white p-4">
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold">
              {request?.origin_city}, {request?.origin_postalcode}
            </p>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.16683 10L15.8335 10"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.99968 4.16634L15.833 9.99968L9.99968 15.833"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-lg font-bold">
              {request?.destination_city}, {request?.destination_postalcode}
            </p>
          </div>
          <p className="mt-2 text-sm text-[#666666]">
            {request?.contents}, {request?.weight}kg
          </p>
          <p className="mt-1 text-xs text-[#666666]">
            Deliver By: {formatDateToDDMMYYYY(request?.pickup_date)}
          </p>

          <div className="mt-4 space-y-2 text-[14px] font-medium">
            <div className="flex items-center justify-between">
              <span>Package Cost:</span>
              <span>£{formatAmount(packageCost)}</span>
            </div>
            {hasInsurance ? (
              <div className="flex items-center justify-between">
                <span>
                  Insurance:
                  {/* {insuranceFeeCalc ? (
                    <span className="block text-xs font-normal text-[#888888]">
                      {insuranceFeeCalc.percentage}% of £
                      {formatAmount(insurancePremiumBase)} + £{" "}
                      {formatAmount(insuranceFeeCalc.amount)}
                    </span>
                  ) : null} */}
                </span>
                <span>
                  £{formatAmount(insurancePremiumBase + insuranceTotal)}
                </span>
              </div>
            ) : null}
            {shouldShowRushFee ? (
              <div className="flex items-center justify-between">
                <span>Priority Rush Fee:</span>
                <span>£{formatAmount(rushFeeAmount)}</span>
              </div>
            ) : null}
            {creditDiscount > 0 ? (
              <div className="flex items-center justify-between text-[#05B71A]">
                <span>Welcome Credit:</span>
                <span>-£{formatAmount(creditDiscount)}</span>
              </div>
            ) : null}
            <div className="mt-1 border-t border-[#D9E1EC] pt-2 flex items-center justify-between text-[18px] font-semibold text-black">
              <span>Total:</span>
              <span>£{formatAmount(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#CCD7E6] bg-white p-4">
          {!showPayButton && (
            <button
              type="button"
              onClick={handleInitializePayment}
              disabled={isInitializing}
              className="w-full cursor-pointer rounded-full bg-[#4681F4] py-3 text-xl font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isInitializing ? "Initialising..." : "Continue"}
            </button>
          )}

          {showPayButton && (
            <div className="rounded-2xl border border-[#CCD7E6] bg-white p-4">
              <div className="Ryft--paysection">
                <form
                  id={RYFT_PAY_FORM_ID}
                  className="Ryft--payform"
                  onSubmit={handleSubmitPayment}
                >
                  <button
                    id={RYFT_PAY_BTN_ID}
                    type="submit"
                    disabled={!isRyftReady || isPaying}
                    className="w-full cursor-pointer rounded-full bg-[#4681F4] py-3 text-xl font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isPaying ? "Processing..." : `Pay £${formatAmount(total)}`}
                  </button>
                  <div
                    id={RYFT_PAY_ERROR_ID}
                    className="mt-3 text-center text-sm text-red-600"
                  >
                    {paymentError}
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
