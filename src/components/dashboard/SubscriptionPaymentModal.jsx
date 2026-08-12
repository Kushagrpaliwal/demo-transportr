import { useEffect, useRef, useState } from "react";
import API from "../../api";

const RYFT_SDK_URL = "https://embedded.ryftpay.com/v2/ryft.min.js";
const RYFT_PAY_FORM_ID = "ryft-pay-form";
const RYFT_PAY_BTN_ID = "pay-btn";
const RYFT_PAY_ERROR_ID = "ryft-pay-error";

const formatAmount = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "0.00";
  return parsed.toFixed(2);
};

const isPaymentApproved = (status) => status === "Approved" || status === "Captured";

const loadRyftSdk = () =>
  new Promise((resolve, reject) => {
    if (window.Ryft) {
      resolve(window.Ryft);
      return;
    }

    const existingScript = document.querySelector(`script[src="${RYFT_SDK_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Ryft), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Ryft SDK.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RYFT_SDK_URL;
    script.async = true;
    script.onload = () => resolve(window.Ryft);
    script.onerror = () => reject(new Error("Failed to load Ryft SDK."));
    document.body.appendChild(script);
  });

const SubscriptionPaymentModal = ({ isOpen, onClose, plan, onPay, onSuccess }) => {
  const [showPayButton, setShowPayButton] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isRyftReady, setIsRyftReady] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [ryftSession, setRyftSession] = useState(null);
  const [hasAcceptedRecurring, setHasAcceptedRecurring] = useState(false);
  const isPayingRef = useRef(isPaying);

  useEffect(() => {
    isPayingRef.current = isPaying;
  }, [isPaying]);

  useEffect(() => {
    if (!isOpen) return;
    setShowPayButton(false);
    setIsInitializing(false);
    setIsPaying(false);
    setIsRyftReady(false);
    setPaymentError("");
    setRyftSession(null);
    setHasAcceptedRecurring(false);
  }, [isOpen, plan?.id]);

  const handleInitializePayment = async () => {
    if (!plan || isInitializing || isPaying || !hasAcceptedRecurring) return;

    setIsInitializing(true);
    setPaymentError("");

    try {
      const session = await onPay?.(plan);
      if (!session?.publicKey || !session?.clientSecret) {
        throw new Error("Unable to initialize subscription payment session.");
      }
      setRyftSession(session);
      setShowPayButton(true);
    } catch (error) {
      setPaymentError(error?.message || "Unable to initialize subscription payment.");
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !showPayButton || !ryftSession) return;

    let cancelled = false;

    const initRyft = async () => {
      try {
        const Ryft = await loadRyftSdk();
        const ryftConfig = {
          publicKey: ryftSession?.publicKey,
          clientSecret: ryftSession?.clientSecret,
          paymentType: 'Recurring',
          customerPaymentMethods: {
            allowStorage: {
              enabled: true
            }
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

        ryftConfig.subscription = {
          rawJson: JSON.stringify(ryftSession.ryft_obj) // The full Subscription object from the API
        };

        if (ryftSession?.savedCardDetails?.length) {
          ryftConfig.customerPaymentMethods = {
            rawJson: JSON.stringify({ items: ryftSession.savedCardDetails }),
            allowStorage: {
              enabled: true
            },
          };
        }

        Ryft.init(ryftConfig);

        Ryft.addEventHandler("cardValidationChanged", (event) => {
          const payButton = document.getElementById(RYFT_PAY_BTN_ID);
          if (payButton) payButton.disabled = !event?.isValid || isPayingRef.current;
        });

        Ryft.addEventHandler("paymentMethodSelectionChanged", (event) => {
          const payButton = document.getElementById(RYFT_PAY_BTN_ID);
          if (payButton) payButton.disabled = !event?.paymentMethod || isPayingRef.current;
        });

        if (!cancelled) setIsRyftReady(true);
      } catch (error) {
        if (!cancelled) setPaymentError(error?.message || "Unable to initialize payment.");
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
        if (paymentSession?.paymentMethod && paymentSession?.paymentMethod?.tokenizedDetails?.id && ryftSession?.savedCardDetails?.filter(card => card?.id == paymentSession?.paymentMethod?.tokenizedDetails?.id).length == 0) {
          await API.post("/payments/payment-method", {
            paymentMethod: paymentSession.paymentMethod,
          });
        }
        window.alert("Payment Successful! Redirecting...");
        await onSuccess?.(paymentSession);
        onClose?.();
        return;
      }

      if (paymentSession?.lastError && window.Ryft?.getUserFacingErrorMessage) {
        setPaymentError(window.Ryft.getUserFacingErrorMessage(paymentSession.lastError) || "Payment failed.");
      } else {
        setPaymentError("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Ryft payment error:", error);
      setPaymentError(error?.message || "An unexpected error occurred while processing payment.");
    } finally {
      setIsPaying(false);
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#D7E3F3] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-black">Subscription Payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 cursor-pointer rounded-full bg-white text-lg leading-none text-black hover:bg-gray-100"
            aria-label="Close subscription payment modal"
          >
            ×
          </button>
        </div>

        <div className="rounded-2xl border border-[#CCD7E6] bg-white p-4 text-[#333]">
          <div className="flex items-center justify-between text-base font-medium">
            <span>Subscription plan:</span>
            <span>{plan?.billing_period || plan?.title || "Plan"}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-base font-medium">
            <span>Subscription amount:</span>
            <span>£{formatAmount(plan?.amount)}</span>
          </div>
          <div className="mt-3 border-t border-[#D9E1EC] pt-2 flex items-center justify-between text-[18px] font-semibold text-black">
            <span>Total:</span>
            <span>£{formatAmount(plan?.amount)}</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#CCD7E6] bg-white p-4">
          {!showPayButton && (
            <>
              <p className="mb-2 text-sm font-bold text-black">This is a recurring payment subscription.</p>
              <label className="mb-4 flex items-start gap-2 text-sm text-black">
                <input
                  type="checkbox"
                  checked={hasAcceptedRecurring}
                  onChange={(event) => setHasAcceptedRecurring(event.target.checked)}
                  className="mt-1 h-4 w-4 cursor-pointer"
                />
                <span>I understand this payment is recurring and will be charged automatically.</span>
              </label>
              <button
                type="button"
                onClick={handleInitializePayment}
                disabled={isInitializing || !hasAcceptedRecurring}
                className="w-full cursor-pointer rounded-full bg-[#4681F4] py-3 text-xl font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isInitializing ? "Initialising..." : `Pay £${formatAmount(plan?.amount)}`}
              </button>
            </>
          )}

          {showPayButton && (
            <div className="Ryft--paysection">
              <form id={RYFT_PAY_FORM_ID} className="Ryft--payform" onSubmit={handleSubmitPayment}>
                <button
                  id={RYFT_PAY_BTN_ID}
                  type="submit"
                  disabled={!isRyftReady || isPaying}
                  className="w-full cursor-pointer rounded-full bg-[#4681F4] py-3 text-xl font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPaying ? "Processing..." : `Pay £${formatAmount(plan?.amount)}`}
                </button>
                <div id={RYFT_PAY_ERROR_ID} className="mt-3 text-center text-sm text-red-600">
                  {paymentError}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentModal;
