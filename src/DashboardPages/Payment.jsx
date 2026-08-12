import React, { useState, useEffect } from "react";
import { AddNewIcon, DeleteIcon } from "../assets/icons";
import {
  PaymentsService,
  TransactionsHistoryService,
  TransactionsHistoryDownloadService,
  PaymentCardsService,
  deletePayoutService,
  checkPayoutService,
} from "../api/services/PaymentsService/Payments";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CreatePayouMethod from "../components/Common/CreatePayoutMethod";

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

/** Pounds (decimal). Puts minus before £, e.g. -£56.66 not £-56.66 */
const formatGbp = (pounds) => {
  if (pounds == null || pounds === "") return "—";
  const n = Number(pounds);
  if (Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}£${abs.toFixed(2)}`;
};

const formatGbpFromPence = (pence) => {
  if (pence == null || pence === "") return "—";
  return formatGbp(Number(pence) / 100);
};

const Payment = () => {
  const [balance, setBalance] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hasPayoutMethod, setHasPayoutMethod] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [payoutToDelete, setPayoutToDelete] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [subscriptionInfoCardId, setSubscriptionInfoCardId] = useState(null);

  const fetchpayments = async () => {
    try {
      const res = await PaymentsService();
      const data = res?.data?.data?.items || res?.data;
      setBalance(data);
      // console.log("Balance data:", data);
    } catch (error) {
      console.error("There is some problem fetching the payements", error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await PaymentCardsService();
      const data = res?.data?.data;
      setPaymentMethods(data);
      // console.log("Payment Methods:", data);
    } catch (error) {
      console.error(
        "There is some problem fetching the payment methods",
        error,
      );
    }
  };

  const checkPayoutStatus = async () => {
    try {
      const res = await checkPayoutService();
      if (res.data.success) {
        setHasPayoutMethod(res.data.hasPayoutMethod);
        if (res.data.hasPayoutMethod && res.data.payoutMethods) {
          setPayoutMethods(res.data.payoutMethods);
        }
      }
    } catch (error) {
      console.error("Error checking payout status:", error);
    }
  };

  const fetchHistory = async (year, month) => {
    try {
      if (!year || !month) return;
      setHistory([]);
      const res = await TransactionsHistoryService(year, month);
      setHistory(res?.data?.data || []);
    } catch (error) {
      console.error("There is some problem fetching the payements", error);
    }
  };

  useEffect(() => {
    fetchpayments();
    fetchPaymentMethods();
    checkPayoutStatus();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (subscriptionInfoCardId == null) return;
    const onDocMouseDown = (e) => {
      const wrap = document.querySelector(
        `[data-subscription-tip="${subscriptionInfoCardId}"]`,
      );
      if (wrap && !wrap.contains(e.target)) {
        setSubscriptionInfoCardId(null);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setSubscriptionInfoCardId(null);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [subscriptionInfoCardId]);

  const handleSearch = () => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      fetchHistory(year, month);
    } else {
      fetchHistory();
    }
  };

  const handleEditClick = (method) => {
    setSelectedPayoutMethod(method);
    setIsEditMode(true);
    setShowPayoutModal(true);
  };

  const handleDeleteClick = (method) => {
    setPayoutToDelete(method);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!payoutToDelete) return;

    setIsLoading(true);
    try {
      await deletePayoutService(payoutToDelete.id);
      await checkPayoutStatus();
      setShowDeleteModal(false);
      setPayoutToDelete(null);
    } catch (error) {
      console.error("Error deleting payout method:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayoutModalClose = () => {
    setShowPayoutModal(false);
    setSelectedPayoutMethod(null);
    setIsEditMode(false);
  };

  const handlePayoutSuccess = async () => {
    await checkPayoutStatus();
    setShowPayoutModal(false);
    setSelectedPayoutMethod(null);
    setIsEditMode(false);
  };

  return (
    <section className="w-full flex flex-col items-center py-8 px-4">
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[20px] p-6 w-full max-w-[400px] shadow-lg flex flex-col items-center">
            <h3 className="text-xl font-bold text-black mb-4">
              Confirm Deletion
            </h3>
            <p className="text-[#666666] text-center mb-6">
              Are you sure you want to delete this payout method? This action
              cannot be undone.
            </p>
            <div className="flex w-full gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPayoutToDelete(null);
                }}
                className="flex-1 py-3 bg-[#E6F0FF] text-black font-semibold rounded-full hover:bg-[#D0E3FF] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isLoading}
                className="flex-1 py-3 bg-[#EF4444] text-white font-semibold rounded-full hover:bg-red-600 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div
                  dangerouslySetInnerHTML={{ __html: DeleteIcon }}
                  className="scale-[0.8] invert brightness-0"
                />
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreatePayouMethod
        isOpen={showPayoutModal}
        onClose={handlePayoutModalClose}
        onSuccess={handlePayoutSuccess}
        editMode={isEditMode}
        payoutMethod={selectedPayoutMethod}
      />

      <div className="w-full mx-auto">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
          Payment Management
        </h2>
        <p className="text-[#5F6C85] text-base md:text-lg mb-6">
          View your transaction history and manage payment methods.
        </p>

        <div className="bg-[#E6F0FF] rounded-[20px] p-2 md:p-8 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-[20px] border border-[#D6E2F5] p-5 md:p-6 shadow-sm">
              <div className="text-sm md:text-base font-semibold text-gray-600">
                Available Balance
              </div>
              <span className="text-xs text-[#666666]">Ready for payout</span>
              <div className="text-3xl font-bold text-[#4681F4] mt-2">
                {formatGbpFromPence(balance[0]?.available?.amount)}
              </div>
            </div>

            <div className="bg-white rounded-[20px] border border-[#D6E2F5] p-5 md:p-6 shadow-sm">
              <div className="text-sm md:text-base font-semibold text-gray-600">
                Pending Balance
              </div>
              <span className="text-xs text-[#666666]">
                Funds being processed
              </span>
              <div className="text-3xl font-bold text-[#F59E0B] mt-2">
                {formatGbpFromPence(balance[0]?.pending?.amount)}
              </div>
            </div>
          </div>

          {payoutMethods?.length > 0 && payoutMethods[0]?.freeze == 1 ? (
            <p className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#EF4444] md:text-base">
              Your payouts are currently disabled due to an open dispute.
            </p>
          ) : null}

          <div className="mb-6">
            <div className="bg-white rounded-[20px] border border-[#D6E2F5] p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-sm md:text-base font-semibold text-gray-600">
                  Total Balance
                </div>
              </div>
              <div className="text-3xl font-bold text-black sm:text-right">
                {formatGbpFromPence(
                  (Number(balance[0]?.available?.amount) || 0) +
                    (Number(balance[0]?.pending?.amount) || 0),
                )}
              </div>
            </div>
          </div>

          <h3 className="text-xl md:text-[32px] font-semibold text-black mb-4">
            Payment Methods
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {paymentMethods.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-[#D6D6D6] rounded-xl p-4 flex flex-col"
              >
                <div className="w-full flex items-center justify-between">
                  <img src="/visa.svg" alt="visa" />
                  {c?.used_in_subscription == 0 ? (
                    <button className="w-[82px] h-[34px] gap-1 group rounded-full bg-[#EF4444] border-1 border-[#EF4444] hover:bg-white flex items-center justify-center text-xs font-bold text-white hover:text-[#EF4444] transition-all duration-300 cursor-pointer">
                      <div
                        className="text-white group-hover:text-[#EF4444]"
                        dangerouslySetInnerHTML={{ __html: DeleteIcon }}
                      />
                      Delete
                    </button>
                  ) : (
                    <div
                      className="relative shrink-0"
                      data-subscription-tip={c.id}
                    >
                      <button
                        type="button"
                        aria-expanded={subscriptionInfoCardId === c.id}
                        aria-label="Recurring subscription information"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubscriptionInfoCardId((prev) =>
                            prev === c.id ? null : c.id,
                          );
                        }}
                        className="cursor-pointer"
                      >
                        <img src="/await.svg" alt="await" className="h-5 w-5" />
                      </button>
                      {subscriptionInfoCardId === c.id && (
                        <div
                          role="tooltip"
                          className="absolute right-0 z-20 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-[#D6E2F5] bg-white px-3 py-2.5 text-left text-xs font-medium text-[#444444] shadow-lg"
                        >
                          This card is currently in use for your recurring
                          subscription.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 mt-5">
                  <div className="text-base font-bold text-black">
                    {c.card_scheme} ending in
                  </div>
                  <div className="text-sm text-[#666666]">{c.card_last4}</div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-xl md:text-[32px] font-semibold text-black mb-4">
            Payout Method
          </h3>

          {hasPayoutMethod && payoutMethods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {payoutMethods.map((method) => (
                <div
                  key={method.id}
                  className="bg-white border border-[#D6D6D6] rounded-xl p-4 flex flex-col"
                >
                  <div className="w-full flex items-center justify-between">
                    <img src="/bank.svg" alt="Bank" />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(method)}
                        className="bg-[#D0E3FF] w-[82px] h-[34px] hover:border-[#4681F4] hover:bg-white hover:text-[#4681F4] cursor-pointer text-black font-bold rounded-full text-xs transition-all duration-300 border border-[#FBFBFB] flex items-center justify-center gap-1"
                      >
                        <img src="/editblack.svg" alt="Edit" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(method)}
                        className="w-[82px] h-[34px] gap-1 group rounded-full bg-[#EF4444] border-1 border-[#EF4444] hover:bg-white flex items-center justify-center text-xs font-bold text-white hover:text-[#EF4444] transition-all duration-300 cursor-pointer"
                      >
                        <div
                          className="text-white group-hover:text-[#EF4444]"
                          dangerouslySetInnerHTML={{ __html: DeleteIcon }}
                        />
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-5">
                    <div className="text-base font-bold text-black">
                      Bank Account
                    </div>
                    <div className="text-sm text-[#666666]">
                      Sort Code: {method.bank_id} | Account:{" "}
                      {method.account_number}
                    </div>
                    <div className="text-xs text-[#999999] mt-1">
                      Added: {formatDate(method.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <button
                onClick={() => {
                  setIsEditMode(false);
                  setSelectedPayoutMethod(null);
                  setShowPayoutModal(true);
                }}
                className="bg-[#4681F4] w-full md:w-[311px] h-[50px] flex items-center justify-center border border-[#4681F4] gap-2 font-bold text-xl text-white cursor-pointer transition-all duration-200 hover:bg-white hover:text-[#4681F4] group rounded-full"
              >
                <div
                  className="text-white group-hover:text-[#4681F4]"
                  dangerouslySetInnerHTML={{ __html: AddNewIcon }}
                />
                Add New Payout Method
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-6 gap-4">
          <h3 className="text-xl md:text-[32px] font-semibold text-black">
            Transaction History
          </h3>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="w-full sm:w-[220px]">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="MM/yyyy"
                showMonthYearPicker
                placeholderText="Select Month & Year"
                className="w-full h-[50px] border border-[#D6D6D6] px-5 py-2 rounded-full text-base focus:outline-none focus:border-[#4681F4] text-black bg-white transition-colors cursor-pointer"
                wrapperClassName="w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={handleSearch}
                className="w-full sm:w-auto h-[50px] px-8 flex items-center justify-center border border-[#4681F4] bg-[#4681F4] text-white font-bold rounded-full transition-all duration-200 hover:bg-white hover:text-[#4681F4] cursor-pointer"
              >
                Search
              </button>

              <button
                onClick={async () => {
                  try {
                    const year = selectedDate ? selectedDate.getFullYear() : "";
                    const month = selectedDate
                      ? String(selectedDate.getMonth() + 1).padStart(2, "0")
                      : "";
                    const res = await TransactionsHistoryDownloadService(
                      year,
                      month,
                    );

                    const data = res?.data?.data || res?.data;

                    if (typeof data === "string" && data.startsWith("http")) {
                      window.location.href = data;
                    } else {
                      const csvContent =
                        typeof data === "string" ? data : JSON.stringify(data);
                      const url = window.URL.createObjectURL(
                        new Blob([csvContent], { type: "text/csv" }),
                      );
                      const link = document.createElement("a");
                      link.href = url;
                      link.setAttribute("download", "transactions_history.csv");
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    }
                  } catch (error) {
                    console.error("Error downloading CSV:", error);
                  }
                }}
                className="w-full sm:w-auto h-[50px] px-6 flex items-center justify-center gap-2 bg-[#D0E3FF] border border-[#D0E3FF] text-base font-bold text-black rounded-full transition-all duration-200 hover:bg-white hover:text-[#4681F4] hover:border-[#4681F4] cursor-pointer"
              >
                <img
                  src="/export.svg"
                  alt="Export"
                  className="w-5 h-5 flex-shrink-0"
                />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-xl border border-[#D6D6D6]">
          <table className="min-w-[800px] w-full table-fixed divide-y divide-[#D6D6D6]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="w-[15%] px-4 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                  Date
                </th>
                <th className="w-[35%] px-4 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                  Description
                </th>
                <th className="w-[20%] px-4 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                  Type
                </th>
                <th className="w-[15%] px-4 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                  Amount
                </th>
                {/* <th className="w-[15%] px-4 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                  Status
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#D6D6D6]">
              {history.map((t) => {
                if (!t) return null;
                const isReceived = t.Type != "Sent" && t.Type != "Fees";
                const isRefundedOrVoided =
                  t.Type == "Refunded" || t.Type == "Voided";

                return (
                  <tr key={t.id}>
                    <td className="px-4 py-4 whitespace-normal break-words text-xs text-black align-top">
                      {formatDate(t.Date)}
                    </td>
                    <td className="px-4 py-4 whitespace-normal break-words text-xs text-black align-top">
                      {t.Description}
                    </td>
                    <td className="px-4 py-4 whitespace-normal align-top">
                      <div
                        className={`px-3 h-[34px] flex items-center justify-center rounded-full text-xs font-bold w-max border ${isRefundedOrVoided ? "border-[#4681F4] text-[#4681F4]" : isReceived ? "border-[#05B71A] text-[#05B71A]" : "border-[#EF4444] text-[#EF4444]"}`}
                      >
                        {t.Type}
                      </div>
                    </td>
                    <td
                      className={`px-4 py-4 whitespace-normal align-top text-xs font-bold ${isRefundedOrVoided ? "text-[#4681F4]" : isReceived ? "text-[#05B71A]" : "text-[#EF4444]"}`}
                    >
                      {formatGbp(parseFloat(t.Amount))}
                    </td>
                    {/* <td className="px-4 py-4 whitespace-normal align-top text-sm">
                      <div className="bg-[#DCFCE7] border-[#05B71A] border text-[#05B71A] flex items-center justify-center h-[34px] px-3 rounded-full text-sm font-bold w-max">
                        {t.type == "Voided" ? "Voided" : status}
                      </div>
                    </td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Payment;
