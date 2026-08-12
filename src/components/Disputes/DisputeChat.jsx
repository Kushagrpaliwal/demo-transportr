import React, { useEffect, useRef, useState } from "react";
import ConfirmationModal from "../Common/ConfirmationModal";
import { memo } from "react";

const DisputeChat = ({
  disputeMessages,
  myId,
  dispute,
  handleOfferDecision,
  canRespond,
  isResolved,
  sendDisputeMessage,
  myProfilePic,
  myUsername,
}) => {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [offerConfirm, setOfferConfirm] = useState({
    open: false,
    action: null,
    offer: null,
  });
  const [isUpdatingRefundOffer, setIsUpdatingRefundOffer] = useState(false);
  const [message, setMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [disputeMessages]);

  const openOfferModal = (action, offer) => {
    setOfferConfirm({ open: true, action, offer });
  };

  const closeOfferModal = () => {
    setOfferConfirm({ open: false, action: null, offer: null });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount, currency) => {
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency || "GBP",
        maximumFractionDigits: 2,
      }).format(Number(amount || 0));
    } catch {
      return `${currency || "GBP"} ${amount}`;
    }
  };

  const handleOfferConfirm = async () => {
    const action = offerConfirm?.action;
    const offer = offerConfirm?.offer;
    if (!action || !offer?.id || isUpdatingRefundOffer) {
      closeOfferModal();
      return;
    }
    try {
      setIsUpdatingRefundOffer(true);
      await handleOfferDecision(action, offer);
    } finally {
      setIsUpdatingRefundOffer(false);
      closeOfferModal();
    }
  };

  const handleSendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSendingMessage) return;
    try {
      setIsSendingMessage(true);
      await sendDisputeMessage(trimmed);
      setMessage("");
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="bg-[#E6F0FF] rounded-[20px] p-6 md:p-8 h-full flex flex-col min-h-0">
      <h3 className="text-xl md:text-2xl font-bold text-black mb-4">
        Timeline &amp; Communication
      </h3>
      <div className="space-y-4 flex flex-col flex-1 min-h-0">
        <div
          ref={chatContainerRef}
          className="h-[300px] overflow-y-auto flex flex-col gap-3 pr-1 shrink-0"
        >
          {disputeMessages?.length === 0 ? (
            <p className="text-center text-[#5F6C85] text-sm mt-8">
              No messages yet. Start the conversation!
            </p>
          ) : null}

          {disputeMessages?.map((msg, idx) => {
            if (msg?.kind === "refund_offer") {
              const isPending =
                String(msg?.status || "").toUpperCase() === "PENDING";
              const showActions = isPending && myId === dispute?.initiator;
              return (
                <div
                  key={`offer-${idx}`}
                  className="w-full flex justify-center"
                >
                  <div className="bg-[#FFF3D6] border border-[#FCE7B2] rounded-[14px] px-4 py-3 w-fit max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[#333] text-sm font-semibold">
                        Partial Refund Offer:{" "}
                        {formatCurrency(msg?.refund_amount, msg?.currency)}
                      </p>
                    </div>

                    {!showActions ? (
                      <p className="text-xs text-[#666666]">
                        Status:{" "}
                        <span className="font-semibold">{msg?.status}</span>
                        {msg?.updated_at && (
                          <> on {formatDate(msg.updated_at)}</>
                        )}
                      </p>
                    ) : null}

                    {showActions ? (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          disabled={isUpdatingRefundOffer}
                          className="bg-[#EF4444] hover:bg-red-600 text-white rounded-full px-3 py-1 text-xs font-semibold cursor-pointer"
                          onClick={() => openOfferModal("decline", msg)}
                        >
                          Decline
                        </button>
                        <button
                          disabled={isUpdatingRefundOffer}
                          className="bg-[#4681F4] hover:bg-blue-600 text-white rounded-full px-3 py-1 text-xs font-semibold cursor-pointer"
                          onClick={() => openOfferModal("accept", msg)}
                        >
                          Accept Offer
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            }

            const isMyMessage = myId && msg?.sender_id === myId;

            return (
              <div
                key={idx}
                className={`flex items-end gap-2 ${isMyMessage ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#D0E3FF] flex-shrink-0 flex items-center justify-center overflow-hidden text-[#4681F4] font-bold text-xs relative">
                  {(() => {
                    const avatarSrc = isMyMessage
                      ? myProfilePic
                      : msg?.sender_profile_pic;
                    const avatarName = isMyMessage
                      ? myUsername
                      : msg?.sender_name || "?";
                    const initial = (avatarName?.trim() || "U")
                      .charAt(0)
                      .toUpperCase();
                    return (
                      <>
                        {initial}
                        {avatarSrc &&
                          avatarSrc !== "/dashboard/participants.svg" && (
                            <img
                              src={avatarSrc}
                              alt={avatarName}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                      </>
                    );
                  })()}
                </div>

                <div
                  className={`max-w-[70%] rounded-[14px] px-4 py-2.5 ${
                    isMyMessage
                      ? "bg-[#4681F4] text-white rounded-br-none"
                      : "bg-[#D0E3FF] text-black rounded-bl-none"
                  }`}
                >
                  {!isMyMessage ? (
                    <p className="text-xs font-semibold mb-1 opacity-70">
                      {msg?.sender_name || "User"}
                    </p>
                  ) : null}
                  <p className="text-sm leading-snug break-words break-all">
                    {msg?.message || ""}
                  </p>
                  <p
                    className={`text-[10px] mt-1 text-right ${
                      isMyMessage ? "text-blue-100" : "text-[#5F6C85]"
                    }`}
                  >
                    {formatDateTime(msg?.created_at)}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {canRespond ? (
          <>
            <div className="p-3 border-t border-gray-100 flex items-center gap-2">
              <div className="w-full flex gap-2 bg-[#D0E3FF] rounded-[12px] px-4 py-2 focus:ring-2 focus:ring-[#4681F4]">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 w-full h-18 placeholder:text-[#666666] text-base focus:outline-none border-none bg-transparent resize-none"
                />
              </div>

              <button
                disabled={isSendingMessage}
                onClick={handleSendMessage}
                className="bg-[#4681F4] flex items-center w-[38px] h-[38px] md:w-[41px] md:h-[42px] justify-center cursor-pointer rounded-xl transition-all duration-200 text-white hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
              >
                <img
                  src="/send-icon.svg"
                  alt="send"
                  className="mr-[2px] mt-[2px] w-4 h-4 md:w-auto md:h-auto"
                />
              </button>
            </div>
          </>
        ) : null}

        {isResolved ? (
          <div className="bg-[#D0E3FF] rounded-[12px] p-4 flex gap-2">
            <img
              src="/dashboard/case_closed.svg"
              alt="message"
              className="w-[20px] h-[20px]"
            />
            <p className="text-[#05B71A] text-sm md:text-base ">
              This case is closed. Chat is no longer available.
            </p>
          </div>
        ) : null}
      </div>

      <ConfirmationModal
        isOpen={offerConfirm.open}
        onClose={closeOfferModal}
        onConfirm={handleOfferConfirm}
        title={
          offerConfirm.action === "accept"
            ? "Accept Refund Offer?"
            : "Decline Refund Offer?"
        }
        message={
          offerConfirm.action === "accept"
            ? "This will accept the refund offer. The case will reflect the accepted amount."
            : "This will decline the refund offer. The sender will be notified."
        }
        confirmText={
          offerConfirm.action === "accept" ? "Accept Offer" : "Decline Offer"
        }
        cancelText="Cancel"
        isLoading={isUpdatingRefundOffer}
      />
    </div>
  );
};

export default memo(DisputeChat);
