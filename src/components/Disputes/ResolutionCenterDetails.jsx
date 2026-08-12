/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getDisputeSingleService,
  getDisputeMessagesService,
  sendDisputeMessagesService,
  askTransportrToStepInService,
  getRefundOffersService,
  createRefundOfferService,
  acceptRefundOfferService,
  rejectRefundOfferService,
  closeDisputeService,
  acceptResponsibilityService,
  getInsuranceDetailsService,
  downloadEvidenceService,
} from "../../api/services/DisputeService/disputeService";
import { socket } from "../../api/services/SocketIoService/Socket";
import { useProfile } from "../../context/ProfileContext";
import ConfirmationModal from "../Common/ConfirmationModal";
import DisputeChat from "./DisputeChat";

const ResolutionCenterDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [disputeMessages, setDisputeMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isCloseDisputeModalOpen, setIsCloseDisputeModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [isAcceptRespModalOpen, setIsAcceptRespModalOpen] = useState(false);
  const [isAskingTransportr, setIsAskingTransportr] = useState(false);
  const [isClosingDispute, setIsClosingDispute] = useState(false);
  const [isAcceptingResponsibility, setIsAcceptingResponsibility] =
    useState(false);
  const [isCreatingRefundOffer, setIsCreatingRefundOffer] = useState(false);
  const [isDownloadingEvidence, setIsDownloadingEvidence] = useState(false);
  const [askModalMode, setAskModalMode] = useState("ask"); // 'ask' | 'dispute'
  const [insuranceDetails, setInsuranceDetails] = useState(null);

  const myIdRef = useRef(null);

  const result = useProfile() || {};
  const profile = result?.profile || {};
  const myId = profile?.data?.id;
  const myProfilePic = profile?.data?.profile_pic;
  const myUsername = profile?.data?.username || profile?.data?.name || "You";

  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  const disputeId = location.state?.disputeId;

  useEffect(() => {
    // console.log("socket.connected", socket.connected);
    if (!disputeId) return;

    const joinRoom = () => {
      // console.log("Emitting join_issue for room:", `issue:${disputeId}`);
      // Backend may expect either `issue_id` or `issueId`.
      socket.emit("join_issue", {
        issueId: disputeId,
      });
    };

    // socket.connect();

    if (socket.connected) {
      joinRoom();
    }

    socket.on("connect", joinRoom);

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [disputeId]);

  const fetchInsuranceDetails = async () => {
    const res = await getInsuranceDetailsService(disputeId);
    const data = res?.data?.data || null;
    setInsuranceDetails(data);
  };

  const downloadEvidence = async () => {
    if (!disputeId || isDownloadingEvidence) return;
    try {
      setIsDownloadingEvidence(true);
      const res = await downloadEvidenceService(disputeId);
      const blob = res?.data;
      if (!blob) return;

      const contentDisposition = res?.headers?.["content-disposition"] || "";
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
      const fileName =
        fileNameMatch?.[1] || `dispute-evidence-${disputeId}.pdf`;

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error("Failed to download evidence", e);
      alert("Failed to download evidence. Please try again.");
    } finally {
      setIsDownloadingEvidence(false);
    }
  };

  const fetchDispute = async () => {
    if (!disputeId) {
      setError("No dispute ID provided");
      return;
    }

    setLoading(true);
    try {
      const res = await getDisputeSingleService(disputeId);

      const data = res?.data?.data || null;
      setDispute(data);
      if (data?.insuranceData || data?.insurance_premium) {
        // console.log("data", data, myId, data?.initiator)
        if (myId == data?.initiator) {
          fetchInsuranceDetails();
        }
      }
      setError(null);
    } catch (error) {
      // console.error("Error fetching dispute", error);
      setError(
        error?.response?.data?.message ||
          "Failed to load dispute. Please try again.",
      );
      setDispute(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!disputeId) {
      navigate("/dashboard/resolution-center");
      return;
    }
    if (!myId) return;
    fetchDispute();
  }, [disputeId, myId]);

  useEffect(() => {
    const handleNewMessages = (data) => {
      // console.log("New socket message received:", data);

      const incomingIssueId = data?.issue_id ?? data?.issueId;
      if (incomingIssueId !== undefined && disputeId !== undefined) {
        if (Number(incomingIssueId) !== Number(disputeId)) return;
      }

      const incomingMessage = data?.message;
      if (incomingMessage?.sender_id == myIdRef.current) return;
      const normalizedMessage =
        typeof incomingMessage === "string"
          ? {
              id: Date.now(),
              kind: "message",
              message: incomingMessage,
              sender_id: -1,
              sender_name: data?.sender_name || "User",
              sender_profile_pic:
                data?.sender_profile_pic || "/dashboard/participants.svg",
              created_at: new Date().toISOString(),
            }
          : {
              ...incomingMessage,
              kind: "message",
            };

      setDisputeMessages((prev) => [...prev, normalizedMessage]);

      // console.log("Emitting issue_messages_read for:", disputeId);
      // socket.emit("issue_messages_read", { issueId: disputeId });
    };

    socket.on("new_issue_message", handleNewMessages);

    return () => {
      socket.off("new_issue_message", handleNewMessages);
    };
  }, [disputeId]);

  useEffect(() => {
    if (!disputeId) return;

    const fetchDisputeMessages = async () => {
      try {
        const [messagesRes, offersRes] = await Promise.all([
          getDisputeMessagesService(disputeId),
          getRefundOffersService(disputeId),
        ]);

        const rawMessages = messagesRes?.data?.data || [];
        const refundOffers = offersRes?.data?.data || [];

        const firstMessage = {
          id: -1,
          message: dispute?.description,
          sender_id: -1,
          sender_name: "Dispute Reason",
          sender_profile_pic: "/dashboard/participants.svg",
          created_at: dispute?.created_at,
          kind: "message",
        };

        const normalizedMessages = [
          firstMessage,
          ...rawMessages.map((m) => ({
            ...m,
            kind: "message",
          })),
        ];

        const normalizedOffers = refundOffers.map((o) => ({
          ...o,
          kind: "refund_offer",
          created_at:
            o?.created_at ||
            o?.updated_at ||
            o?.decided_at ||
            o?.timestamp ||
            null,
        }));

        const combined = [...normalizedMessages, ...normalizedOffers].sort(
          (a, b) => {
            const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return ta - tb;
          },
        );

        setDisputeMessages(combined);
      } catch (error) {
        console.error("Error fetching dispute messages", error);
      }
    };

    if (dispute?.id) {
      fetchDisputeMessages();
    }
  }, [dispute?.id]);

  const sendDisputeMessage = async (_message) => {
    if (!dispute) return;
    const trimmed = _message ? _message.trim() : "";
    if (!trimmed) return;

    const receiverId =
      myId === dispute.initiator ? dispute.respondent : dispute.initiator;

    try {
      const payload = {
        message: trimmed,
        receiver_id: receiverId,
      };
      const res = await sendDisputeMessagesService(disputeId, payload);

      const sentMessage = res?.data?.data || {
        id: Date.now(),
        message: trimmed,
        sender_id: myId,
        sender_name: profile?.data?.username || "You",
        sender_profile_pic: profile?.data?.sender_profile_pic,
        created_at: new Date().toISOString(),
      };
      setDisputeMessages((prev) => [...prev, sentMessage]);
    } catch (error) {
      console.error("Error sending dispute message", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-[#EF4444] text-white border-[#EF4444]";
      case "In Review":
        return "bg-[#FFEFD0] text-[#F4B846] border-[#F4B846]";
      case "Resolved":
        return "bg-[#05B71A] text-white border-white";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    if (status === "Pending") {
      return (
        <img src="/dashboard/pending.png" alt="pending" className="w-4 h-4" />
      );
    } else if (status === "In Review") {
      return <img src="/pending_status.svg" alt="in review" className="" />;
    } else if (status === "Resolved") {
      return (
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
      );
    }
    return null;
  };

  const handleAskTransportrConfirm = async () => {
    if (isAskingTransportr) return;
    try {
      setIsAskingTransportr(true);
      if (askModalMode === "dispute") {
        await askTransportrToStepInService(disputeId, {
          dispute_claim_by: myId,
        });
        await sendDisputeMessage(
          "The claim has been formally disputed. waiting for next steps from Transportr Support",
        );
      } else {
        await askTransportrToStepInService(disputeId, { dispute_claim_by: "" });
        await sendDisputeMessage(
          "The case has been submitted for review. waiting for next steps from Transportr Support",
        );
      }
      alert("Request submitted successfully. Transportr has been notified.");
      await fetchDispute();
    } catch (e) {
      console.error("Failed to request Transportr to step in", e);
    } finally {
      setIsAskingTransportr(false);
      setIsAskModalOpen(false);
    }
  };

  const handleCloseDisputeConfirm = async () => {
    if (isClosingDispute) return;
    try {
      setIsClosingDispute(true);
      await closeDisputeService(disputeId);
      await fetchDispute();
      alert("Success! The dispute has been closed.");
    } catch (e) {
      console.error("Failed to close dispute", e);
    } finally {
      setIsClosingDispute(false);
      setIsCloseDisputeModalOpen(false);
    }
  };

  const handleAcceptResponsibilityConfirm = async () => {
    if (isAcceptingResponsibility || !disputeId) return;
    try {
      setIsAcceptingResponsibility(true);
      await acceptResponsibilityService(disputeId);
      await fetchDispute();
      alert(
        "You accepted responsibility. The case will be closed and a refund will be processed to the sender (minus any non-refundable fees), as applicable.",
      );
    } catch (e) {
      console.error("Failed to accept responsibility", e);
      alert(
        e?.response?.data?.message ||
          "Failed to accept responsibility. Please try again.",
      );
    } finally {
      setIsAcceptingResponsibility(false);
      setIsAcceptRespModalOpen(false);
    }
  };

  const handleCreateRefundOffer = async () => {
    if (!offerAmount || Number(offerAmount) <= 0 || isCreatingRefundOffer)
      return;
    try {
      setIsCreatingRefundOffer(true);
      await createRefundOfferService({
        issue_id: disputeId,
        refund_amount: Number(offerAmount),
      });
      // refresh combined timeline (messages + offers)
      if (dispute?.id) {
        const [messagesRes, offersRes] = await Promise.all([
          getDisputeMessagesService(disputeId),
          getRefundOffersService(disputeId),
        ]);
        const rawMessages = messagesRes?.data?.data || [];
        const refundOffers = offersRes?.data?.data || [];
        const firstMessage = {
          id: -1,
          message: dispute?.description,
          sender_id: -1,
          sender_name: "T",
          sender_profile_pic: "/dashboard/participants.svg",
          created_at: dispute?.created_at,
          kind: "message",
        };
        const normalizedMessages = [
          firstMessage,
          ...rawMessages.map((m) => ({ ...m, kind: "message" })),
        ];
        const normalizedOffers = refundOffers.map((o) => ({
          ...o,
          kind: "refund_offer",
          created_at:
            o?.created_at ||
            o?.updated_at ||
            o?.decided_at ||
            o?.timestamp ||
            null,
        }));
        const combined = [...normalizedMessages, ...normalizedOffers].sort(
          (a, b) => {
            const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return ta - tb;
          },
        );
        setDisputeMessages(combined);
      }
      alert("Success! Partial refund offer sent.");
    } catch (e) {
      console.error("Failed to create refund offer", e);
    } finally {
      setIsCreatingRefundOffer(false);
      setIsOfferModalOpen(false);
      setOfferAmount("");
    }
  };

  const handleOfferDecision = async (action, offer) => {
    if (!action || !offer?.id) {
      return;
    }
    try {
      if (action === "accept") {
        await acceptRefundOfferService(offer.id);
      } else if (action === "decline") {
        await rejectRefundOfferService(offer.id);
      }
      // Refresh combined timeline after action
      if (dispute?.id) {
        const [messagesRes, offersRes] = await Promise.all([
          getDisputeMessagesService(disputeId),
          getRefundOffersService(disputeId),
        ]);
        const rawMessages = messagesRes?.data?.data || [];
        const refundOffers = offersRes?.data?.data || [];
        const firstMessage = {
          id: -1,
          message: dispute?.description,
          sender_id: -1,
          sender_name: "T",
          sender_profile_pic: "/dashboard/participants.svg",
          created_at: dispute?.created_at,
          kind: "message",
        };
        const normalizedMessages = [
          firstMessage,
          ...rawMessages.map((m) => ({ ...m, kind: "message" })),
        ];
        const normalizedOffers = refundOffers.map((o) => ({
          ...o,
          kind: "refund_offer",
          created_at:
            o?.created_at ||
            o?.updated_at ||
            o?.decided_at ||
            o?.timestamp ||
            null,
        }));
        const combined = [...normalizedMessages, ...normalizedOffers].sort(
          (a, b) => {
            const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return ta - tb;
          },
        );
        setDisputeMessages(combined);
      }
      alert(
        action === "accept"
          ? "Success! Refund offer accepted."
          : "Success! Refund offer declined.",
      );
    } catch (e) {
      console.error("Failed to update refund offer", e);
    }
  };

  if (loading) {
    return (
      <section className="w-full flex flex-col items-center py-8 px-2">
        <div className="w-full max-w-5xl bg-[#E6F0FF] rounded-[20px] p-8 text-center text-[#5F6C85] text-lg">
          Loading dispute details...
        </div>
      </section>
    );
  }

  if (error || !dispute || !myId) {
    return (
      <section className="w-full flex flex-col items-center py-8 px-2">
        <div className="w-full max-w-5xl bg-[#E6F0FF] rounded-[20px] p-8 text-center">
          <p className="text-red-500 text-base mb-4">
            {error || "No dispute found"}
          </p>
          <button
            onClick={() => navigate("/dashboard/resolution-center")}
            className="bg-[#4681F4] text-white px-6 py-2 rounded-full hover:bg-[#3570d4] transition-all"
          >
            Back to Resolution Center
          </button>
        </div>
      </section>
    );
  }

  const isPending = dispute.status === "Pending";
  const isResolved = dispute.status === "Resolved";
  const canRespond = isPending;
  const isInitiator = Number(myId) === Number(dispute?.initiator);

  const showInsuranceCard = Boolean(insuranceDetails && isInitiator);
  const showCloseDisputeCard =
    isInitiator &&
    dispute?.status !== "In Review" &&
    dispute?.status !== "Awaiting Insurance Claim" &&
    dispute?.status !== "Rejected" &&
    !isResolved;

  const topSectionCardCount =
    1 +
    (showInsuranceCard ? 1 : 0) +
    (canRespond ? 1 : 0) +
    (isResolved ? 1 : 0);
  const topGridColsClass =
    topSectionCardCount >= 3
      ? "lg:grid-cols-3"
      : topSectionCardCount === 2
        ? "lg:grid-cols-2"
        : "lg:grid-cols-1";

  const bottomSectionCardCount =
    1 + (canRespond ? 1 : 0) + (showCloseDisputeCard ? 1 : 0);
  const bottomGridColsClass =
    bottomSectionCardCount >= 3
      ? "lg:grid-cols-3"
      : bottomSectionCardCount === 2
        ? "lg:grid-cols-2"
        : "lg:grid-cols-1";

  return (
    <section className="w-full flex flex-col items-center py-8 px-2 md:px-4">
      <div className="w-full">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
          Dispute Case #CASE-{disputeId}
        </h2>
        <p className="text-[#5F6C85] text-base md:text-lg mb-8">
          Opened On : {formatDate(dispute?.created_at)}
        </p>

        <div className="mb-8 flex justify-start">
          <span
            className={`px-6 py-2.5 w-full max-w-[280px] rounded-full text-base justify-center font-semibold flex items-center gap-2 ${getStatusBadgeStyle(
              dispute.status,
            )}`}
          >
            {getStatusIcon(dispute.status)}
            {dispute.status}
          </span>
        </div>

        <div className={`grid grid-cols-1 ${topGridColsClass} gap-6 mb-8`}>
          <div className="bg-[#E6F0FF] rounded-[20px] p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-black mb-4">
              Case Summary
            </h3>
            <div className="space-y-4">
              <div className="mb-5 lg:mb-7.5">
                <p className="text-black font-semibold text-sm md:text-base">
                  Reason:{" "}
                  <span className="font-medium">{dispute.reason}</span>{" "}
                </p>
              </div>
              <div>
                <div className="bg-[#D0E3FF] rounded-[16px] p-4 border border-[#E6F0FF]">
                  <p className="text-black text-sm md:text-base">
                    "{dispute?.description || "No description provided"}"
                  </p>
                </div>
              </div>
              {dispute?.evidence_image && (
                <div>
                  <p className="text-black font-semibold text-sm md:text-base mb-2">
                    Evidence:
                  </p>
                  <img
                    src={dispute.evidence_image}
                    alt="Evidence"
                    className="w-full max-w-[300px] rounded-[12px] border border-[#D0E3FF] cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() =>
                      window.open(dispute.evidence_image, "_blank")
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {showInsuranceCard ? (
            <div className="bg-[#E6F0FF] rounded-[20px] p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-black mb-4">
                Insurance Details
              </h3>
              {insuranceDetails?.status == "Pending Claim" ? (
                <>
                  <p className="  text-sm md:text-base lg:text-lg mb-4">
                    The insurance claim is pending. Download the evidence from
                    clicking below Then Visit the third party insurance provider
                    to submit the claim.
                  </p>
                  <div className="text-black text-sm md:text-base">
                    Insurance Provider:{" "}
                    <a
                      className="text-[#4681F4] hover:underline"
                      href={import.meta.env.VITE_APP_INSURER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Click here to visit the insurance provider
                    </a>
                    <br />
                    Insurance Policy Number:{" "}
                    <span className="font-bold">
                      {insuranceDetails?.policy_number}
                    </span>
                  </div>
                  <button
                    className="w-full mt-5 bg-[#D0E3FF] border-[#D0E3FF] text-[#4681F4] py-3 px-4 rounded-full font-bold text-base hover:bg-white border hover:border-[#4681F4] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={downloadEvidence}
                    disabled={isDownloadingEvidence}
                  >
                    {isDownloadingEvidence
                      ? "Downloading..."
                      : "Download Evidence"}
                  </button>
                </>
              ) : insuranceDetails?.status == "pending" ? (
                <>
                  <p className="text-sm md:text-base lg:text-lg mb-4">
                    You have already submitted the claim. Please wait for the
                    response from the insurance provider.
                    <br />
                    Insurance Policy Number:{" "}
                    <span className="font-bold">
                      {insuranceDetails?.policy_number}
                    </span>
                    <br />
                    <a
                      className="text-[#4681F4] hover:underline"
                      href={import.meta.env.VITE_APP_INSURER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Click here to see the details
                    </a>
                  </p>
                </>
              ) : insuranceDetails?.status == "approved" ? (
                <>
                  <p className="text-sm md:text-base lg:text-lg mb-4">
                    <span className="text-[#05B71A]">
                      {" "}
                      The insurance claim has been approved.
                    </span>
                    <br />
                    <a
                      className="text-[#4681F4] hover:underline"
                      href={import.meta.env.VITE_APP_INSURER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Click here to see the details
                    </a>
                    <br />
                    Insurance Policy Number:{" "}
                    <span className="font-bold">
                      {insuranceDetails?.policy_number}
                    </span>
                  </p>
                </>
              ) : insuranceDetails?.status == "rejected" ? (
                <>
                  <p className="text-sm md:text-base lg:text-lg mb-4">
                    <span className="text-[#EF4444]">
                      The insurance claim has been rejected.
                    </span>
                    <br />
                    <a
                      className="text-[#4681F4] hover:underline"
                      href={import.meta.env.VITE_APP_INSURER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Click here to see the details
                    </a>
                    <br />
                    Insurance Policy Number:{" "}
                    <span className="font-bold">
                      {insuranceDetails?.policy_number}
                    </span>
                  </p>
                </>
              ) : insuranceDetails?.status == "closed" ? (
                <>
                  <p className="text-sm md:text-base lg:text-lg mb-4">
                    <span className="text-[#05B71A]">
                      The insurance claim has been closed.
                    </span>
                    <br />
                    <a
                      className="text-[#4681F4] hover:underline"
                      href={import.meta.env.VITE_APP_INSURER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Click here to see the details
                    </a>
                    <br />
                    Insurance Policy Number:{" "}
                    <span className="font-bold">
                      {insuranceDetails?.policy_number}
                    </span>
                  </p>
                </>
              ) : null}
            </div>
          ) : null}

          {canRespond ? (
            <div className="bg-[#E6F0FF] rounded-[20px] p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-black mb-4">
                Respond to Case
              </h3>
              <p className="text-[#666666] text-sm md:text-base mb-4">
                Take action on this dispute or continue the conversation to
                reach a resolution.
              </p>
              <div className="flex flex-col gap-3 mb-4">
                {!isInitiator && dispute?.package_status == "Delivered" ? (
                  <>
                    <button
                      onClick={() => setIsOfferModalOpen(true)}
                      disabled={
                        isCreatingRefundOffer ||
                        isAskingTransportr ||
                        isClosingDispute ||
                        isAcceptingResponsibility
                      }
                      className="w-full bg-[#D0E3FF] border-[#D0E3FF] text-[#4681F4] py-3 px-4 rounded-full font-bold text-base hover:bg-white border hover:border-[#4681F4] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <img src="/dashboard/coins.svg" alt="offer" />
                      Offer Partial Refund
                    </button>
                    <button
                      onClick={() => setIsAcceptRespModalOpen(true)}
                      disabled={
                        isCreatingRefundOffer ||
                        isAskingTransportr ||
                        isClosingDispute ||
                        isAcceptingResponsibility
                      }
                      className="w-full bg-[#D0E3FF] border-[#D0E3FF] text-[#4681F4] py-3 px-4 rounded-full font-bold text-base hover:bg-white border hover:border-[#4681F4] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <img
                        src="/dashboard/shield.svg"
                        alt="accept responsibility"
                      />
                      Accept Responsibility
                    </button>
                  </>
                ) : null}
                {isInitiator ? null : (
                  <button
                    onClick={() => {
                      setAskModalMode("dispute");
                      setIsAskModalOpen(true);
                    }}
                    disabled={
                      isCreatingRefundOffer ||
                      isAskingTransportr ||
                      isClosingDispute ||
                      isAcceptingResponsibility
                    }
                    className="w-full bg-[#EF4444] border-[#EF4444] text-white py-3 px-4 rounded-full font-bold text-base hover:bg-red-600 border transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <img
                      src="/dashboard/warn.svg"
                      alt="dispute claim"
                      className="invert brightness-0"
                    />
                    {"Dispute Claim"}
                  </button>
                )}
              </div>
              <div className="bg-[#D0E3FF] flex items-start gap-3 rounded-[12px] p-4">
                <img src="/dashboard/shield.svg" alt="what happens next" />
                <div className="">
                  <p className="text-black font-bold text-sm md:text-base mb-2">
                    What happens next?
                  </p>
                  <p className="text-[#666666] text-xs md:text-sm">
                    Your response will be logged and the initiator will be
                    notified. If you cannot reach an agreement, Transportr can
                    step in.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isResolved ? (
            <div className="bg-[#D0E3FF] rounded-[20px] p-6 md:p-8">
              <div className="flex items-start gap-3">
                <img src="/dashboard/case_resolved.svg" alt="case resolved" />
                <div>
                  <p className="text-[#05B71A] font-bold text-base mb-2">
                    Case Resolved
                  </p>
                  <p className="text-[#05B71A] text-sm md:text-base lg:text-lg leading-relaxed">
                    {dispute?.admin_notes || "No resolution message provided"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 lg:items-stretch">
          <DisputeChat
            disputeMessages={disputeMessages}
            myId={myId}
            dispute={dispute}
            handleOfferDecision={handleOfferDecision}
            canRespond={canRespond}
            isResolved={isResolved}
            sendDisputeMessage={sendDisputeMessage}
            myProfilePic={myProfilePic}
            myUsername={myUsername}
          />

          <div className="bg-[#E6F0FF] rounded-[20px] p-6 md:p-8 h-full flex flex-col">
            <h3 className="text-xl md:text-2xl font-bold text-black mb-4">
              Participants
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-[50px] h-[50px] rounded-full bg-[#D0E3FF] flex-shrink-0 overflow-hidden flex items-center justify-center text-[#4681F4] font-bold text-xl relative">
                  {(dispute.initiator_name?.trim() || "U")
                    .charAt(0)
                    .toUpperCase()}
                  {dispute.initiator_profile_pic && (
                    <img
                      src={dispute.initiator_profile_pic}
                      alt="initiator"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div>
                  <p className="text-black font-bold text-sm md:text-base lg:text-lg mb-1">
                    {dispute.initiator_name || `User ${dispute.initiator}`}
                    {myId === dispute.initiator ? (
                      <span className="ml-2 text-xs font-normal text-[#4681F4]">
                        (You)
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[#666666] text-xs md:text-sm">Initiator</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-[50px] h-[50px] rounded-full bg-[#D0E3FF] flex-shrink-0 overflow-hidden flex items-center justify-center text-[#4681F4] font-bold text-xl relative">
                  {(dispute.respondent_name?.trim() || "U")
                    .charAt(0)
                    .toUpperCase()}
                  {dispute.respondent_profile_pic && (
                    <img
                      src={dispute.respondent_profile_pic}
                      alt="respondent"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="">
                  <p className="text-black font-bold text-sm md:text-base lg:text-lg mb-1">
                    {dispute.respondent_name || `User ${dispute.respondent}`}
                    {myId === dispute.respondent ? (
                      <span className="ml-2 text-xs font-normal text-[#4681F4]">
                        (You)
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[#666666] text-xs md:text-sm">
                    Respondent
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${bottomGridColsClass} gap-6`}>
          <div className="bg-[#E6F0FF] rounded-[20px] p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-black mb-4">
              Related Package
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-black text-sm md:text-base font-bold">
                  ID:
                  <span className="font-medium">
                    {" "}
                    {dispute.tracking_number || "N/A"}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-black text-sm md:text-base font-bold">
                  Route:
                  <span className="font-medium">
                    {" "}
                    {dispute.origin || "N/A"} → {dispute.destination || "N/A"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-black text-sm md:text-base font-bold">
                  Description:{" "}
                  <span className="font-medium">
                    {dispute?.description || "N/A"}
                  </span>
                </p>
              </div>
              {dispute?.traveler_id != myId && (
                <div>
                  <p className="text-black text-sm md:text-base font-bold">
                    Insured:{" "}
                    <span className="font-medium">
                      {Number(dispute?.insurance_premium) > 0 ? "YES" : "NO"}
                    </span>
                  </p>
                </div>
              )}
              {dispute?.traveler_id == myId ? null : (
                <button
                  onClick={() =>
                    navigate(
                      `/dashboard/package-track/${dispute.tracking_number}`,
                    )
                  }
                  className="text-[#4681F4] hover:underline cursor-pointer font-semibold text-sm md:text-base lg:text-xl mt-2"
                >
                  View Full Package Details
                </button>
              )}
            </div>
          </div>

          {canRespond ? (
            <div className="bg-[#E6F0FF] rounded-[20px] p-6 md:p-8 flex flex-col justify-between ">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-black mb-4">
                  Actions
                </h3>
                <p className="text-[#666666] text-sm md:text-base mb-5 lg:mb-7.5">
                  If you cannot resolve this, you can ask Transportr to step in
                  for a final decision.
                </p>
              </div>
              <button
                onClick={() => {
                  setAskModalMode("ask");
                  setIsAskModalOpen(true);
                }}
                disabled={isAskingTransportr}
                className="w-full bg-[#D0E3FF] border-[#D0E3FF] cursor-pointer text-[#4681F4] py-3 px-4 rounded-full font-bold text-base hover:bg-white border hover:border-[#4681F4] transition-colors flex items-center justify-center gap-2"
              >
                <img src="/dashboard/ask.svg" alt="ask transportr to step in" />
                Ask Transportr to Step In
              </button>

              <ConfirmationModal
                isOpen={isAskModalOpen}
                onClose={() => setIsAskModalOpen(false)}
                onConfirm={handleAskTransportrConfirm}
                title={
                  askModalMode === "dispute"
                    ? "Dispute This Claim?"
                    : "Ask Transportr to Step In?"
                }
                message={
                  askModalMode === "dispute"
                    ? "By disputing, you are formally disagreeing with the claim. You will be able to add more messages and evidence, but if an agreement is not reached, the case may require a final decision from Transportr Support."
                    : "This will submit your case for Transportr's review. You may not be able to make further changes while it’s under review."
                }
                confirmText={
                  askModalMode === "dispute"
                    ? "Yes, Dispute Claim"
                    : "Yes, Submit for Review"
                }
                cancelText="Cancel"
                confirmButtonClass="bg-[#EF4444] text-white hover:bg-red-600"
                cancelButtonClass="bg-[#E6F0FF] text-black hover:bg-[#D0E3FF]"
                isLoading={isAskingTransportr}
              />
            </div>
          ) : null}

          {showCloseDisputeCard ? (
            <div className="bg-[#E6F0FF] rounded-[20px] p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-black mb-4">
                  Close Dispute
                </h3>
                <p className="text-[#666666] text-sm md:text-base mb-5 lg:mb-7.5">
                  If the issue has been resolved between both parties, you can
                  close this dispute to release the payment hold.
                </p>
              </div>
              <button
                onClick={() => setIsCloseDisputeModalOpen(true)}
                disabled={isClosingDispute}
                className="w-full bg-[#F4B846] border-[#F4B846] cursor-pointer text-white py-3 px-4 rounded-full font-bold text-base hover:bg-[#e2a832] border transition-colors"
              >
                Close Dispute
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isCloseDisputeModalOpen}
        onClose={() => setIsCloseDisputeModalOpen(false)}
        onConfirm={handleCloseDisputeConfirm}
        title="Close Dispute?"
        message="This will close the dispute and release the payment hold. This action may not be reversible."
        confirmText="Yes, Close Dispute"
        cancelText="Cancel"
        confirmButtonClass="bg-[#F4B846] text-white hover:bg-[#e2a832]"
        isLoading={isClosingDispute}
      />

      {isOfferModalOpen ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between p-6 md:p-8 border-b border-gray-200">
              <h3 className="text-2xl md:text-3xl font-bold text-black">
                Offer a Partial Refund
              </h3>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                disabled={isCreatingRefundOffer}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold p-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="px-6 md:px-8 py-6">
              <p className="text-[#666666] text-sm md:text-base mb-4">
                Propose a refund amount to resolve this dispute. The recipient
                will be notified and can choose to accept or decline your offer.
              </p>
              <label className="block text-black font-medium text-sm mb-2">
                Refund Amount (£)
              </label>
              <div className="relative mb-6">
                <input
                  type="number"
                  inputMode="decimal"
                  onWheel={(e) => e.currentTarget.blur()}
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  disabled={isCreatingRefundOffer}
                  placeholder="e.g., 15.50"
                  className="w-full italic bg-[#E6F0FF] h-11 rounded-xl pl-4 pr-4 py-2 text-black text-base outline-none no-spinner"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCreateRefundOffer}
                  disabled={
                    isCreatingRefundOffer ||
                    !offerAmount ||
                    Number(offerAmount) <= 0
                  }
                  className="w-full bg-[#4681F4] text-white py-3 px-4 rounded-full font-bold text-base hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCreatingRefundOffer ? "Please wait..." : "Review Offer"}
                </button>
                <button
                  onClick={() => setIsOfferModalOpen(false)}
                  disabled={isCreatingRefundOffer}
                  className="w-full bg-[#E6F0FF] text-black py-3 px-4 rounded-full font-bold text-base hover:bg-[#D0E3FF] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmationModal
        isOpen={isAcceptRespModalOpen}
        onClose={() => setIsAcceptRespModalOpen(false)}
        onConfirm={handleAcceptResponsibilityConfirm}
        title="Accept Full Responsibility?"
        message="This will close the case and process a refund to the sender (minus any non-refundable service fees). This action cannot be undone."
        confirmText="Confirm"
        cancelText="Cancel"
        isLoading={isAcceptingResponsibility}
      />
    </section>
  );
};

export default ResolutionCenterDetails;
