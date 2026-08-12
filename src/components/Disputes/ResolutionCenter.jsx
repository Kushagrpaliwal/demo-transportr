import React, { useState, useEffect } from "react";
// import { DeleteIcon, EditIcon, SendPackageIcon } from "../../assets/icons";
import { Link, useNavigate } from "react-router-dom";
import { getDisputeService } from "../../api/services/DisputeService/disputeService";

const ResolutionCenter = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Open Cases");
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await getDisputeService();
      const data = res?.data?.data || [];
      console.log("First dispute object:", data[0]);
      setDisputes(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching disputes", error);
      setError("Failed to load disputes. Please try again.");
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const availableTabs = ["Open Cases", "Closed Cases"];

  const isClosedStatus = (dispute) => {
    const s = dispute.status?.toLowerCase();
    return s === "resolved" || s === "rejected";
  };

  const openCount = disputes.filter((d) => !isClosedStatus(d)).length;
  const closedCount = disputes.filter((d) => isClosedStatus(d)).length;

  const filteredDisputes = disputes.filter((dispute) => {
    const resolved = isClosedStatus(dispute);
    return tab === "Closed Cases" ? resolved : !resolved;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "—";
    const day = d.getDate();
    const j = day % 10;
    const k = day % 100;
    const suffix =
      j === 1 && k !== 11
        ? "st"
        : j === 2 && k !== 12
          ? "nd"
          : j === 3 && k !== 13
            ? "rd"
            : "th";
    const month = d.toLocaleDateString("en-GB", { month: "long" });
    const year = d.getFullYear();
    return `${day}${suffix} ${month}, ${year}`;
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Pending":
      case "Rejected":
        return "bg-[#EF4444] text-white border-[#EF4444]";
      case "In Review":
        return "bg-[#FFEFD0] text-[#F4B846] border-[#F4B846]";
      case "Resolved":
        return "bg-[#05B71A] text-white border-white";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  };

  return (
    <section className="w-full flex flex-col items-center py-8 px-2">
      <div className="w-full mx-auto text-center md:text-left">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
          Resolution Center
        </h2>
        <p className="text-[#5F6C85] text-base md:text-lg mb-8">
          Manage and resolve disputes for your shipments.
        </p>

        <div className="w-full flex items-center sm:items-start justify-between gap-5 flex-col lg:flex-row mb-8">
          <div className="w-full max-w-[540px] overflow-x-auto border border-[#D6E2F5] rounded-[25px] p-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="grid grid-cols-2 gap-3  whitespace-nowrap">
              {availableTabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-shrink-0 px-4 py-2 cursor-pointer hover:bg-[#E6F0FF] rounded-full transition-all duration-200 font-bold
										${tab === t ? "bg-[#E6F0FF] text-black" : "bg-white text-black"}`}
                >
                  {t}{" "}
                  <span className="text-black">
                    ({t === "Open Cases" ? openCount : closedCount})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-[#E6F0FF] rounded-[20px] p-4 md:p-6 text-center text-[#5F6C85] text-lg py-12">
            Loading disputes...
          </div>
        )}

        {error && !loading && (
          <div className="bg-[#E6F0FF] rounded-[20px] p-4 md:p-6 text-center">
            <p className="text-red-500 text-base py-8 text-center">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 text-left">
            {filteredDisputes?.length === 0 ? (
              <div className="col-span-full bg-[#E6F0FF] rounded-[20px] p-8 text-center">
                <p className="text-[#5F6C85] text-base">
                  No {tab.toLowerCase()} found.
                </p>
              </div>
            ) : (
              filteredDisputes?.map((dispute) => (
                <div
                  key={dispute.id}
                  className="bg-[#E6F0FF] rounded-[20px] p-5 flex flex-col gap-4"
                >
                  <div className="flex-1">
                    <div className="flex flex-row sm:items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-base md:text-xl text-black">
                        Case #{dispute.id}
                      </span>

                      <div>
                        <div
                          className={`px-3 py-1 rounded-full border text-[10px] flex items-center gap-1 ${getStatusBadgeStyle(dispute.status)}`}
                        >
                          {dispute?.status === "Pending" ? (
                            <img
                              src="/dashboard/pending.png"
                              alt="pending"
                              className="w-[14px] h-[14px]"
                            />
                          ) : null}
                          {dispute?.status === "In Review" ? (
                            <img
                              src="/pending_status.svg"
                              alt="in review"
                            />
                          ) : null}
                          {dispute?.status === "Resolved" || dispute?.status === "Rejected" ? (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4"
                            >
                              <path
                                d="M12.7172 5.83321C12.9836 7.14063 12.7937 8.49987 12.1793 9.68425C11.5648 10.8686 10.5629 11.8066 9.34057 12.3416C8.11826 12.8767 6.74947 12.9766 5.46244 12.6246C4.17542 12.2726 3.04796 11.49 2.2681 10.4074C1.48823 9.32472 1.10309 8.00743 1.17691 6.67518C1.25072 5.34293 1.77903 4.07626 2.67373 3.08639C3.56843 2.09652 4.77544 1.44329 6.09347 1.23564C7.41151 1.02798 8.76089 1.27846 9.9166 1.94529"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M5.25 6.41683L7 8.16683L12.8333 2.3335"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : null}

                          {
                            dispute?.status === "Awaiting Insurance Claim" ? <img src="/pending.svg" alt="awaiting insurance claim" /> : null
                          }

                          <div>{dispute.status}</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[#666666] text-sm mb-3 md:mb-4">
                      Opened On {formatDate(dispute.created_at)}
                    </div>

                    <div className="text-[#666666] text-sm mb-1">
                      Reason:{" "}
                      <span className="text-black  font-bold">
                        {dispute.reason}
                      </span>
                    </div>

                    <div className="text-[#666666] text-sm mb-1">
                      Regarding Package:{" "}
                      <Link className="text-[#4681F4] hover:underline">
                        {" "}
                        {dispute.tracking_number}
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        navigate("/dashboard/dispute-detail", {
                          state: { disputeId: dispute.id },
                        });
                      }}
                      className="hover:bg-[#4681F4] max-w-[120px] px-1 py-1 hover:text-[#F8FAFC] bg-white text-[#4681F4] font-bold flex items-center justify-center cursor-pointer transition-all duration-200 border border-[#4681F4] rounded-full"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ResolutionCenter;
