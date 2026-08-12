import { useEffect, useState, useRef } from "react";

import { useParams, useNavigate } from "react-router-dom";

import {
  getConversationById,
  postMessage,
} from "../api/services/MessageService/MessageService";
import getShortName from "../Utils/GetShortName";
import { socket } from "../api/services/SocketIoService/socket";

const ChatInterface = () => {
  const EMOJIS = ["😀", "😂", "😍", "😎", "😊", "👍", "🙏", "🎉", "❤️", "🔥"];
  const [toProfile, setToProfile] = useState({});
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { id } = useParams();
  const navigate = useNavigate();

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = [
      "image/jpg",
      "image/png",
      "image/jpeg",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Only PNG, JPG, and SVG files are allowed");
      return;
    }
    setAttachment(file);
    setAttachmentPreview(URL.createObjectURL(file));
  };

  const handleEmojiSelect = (emoji) => {
    setInputText((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
  };

  const removeAttachment = () => {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatStickyDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "TODAY";
    if (isYesterday) return "YESTERDAY";

    return date
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .toUpperCase();
  };

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  useEffect(() => {
    const getConversation = async () => {
      try {
        setLoading(true);
        const response = await getConversationById(id);
        setConversation(response?.data?.data || []);

        const firstChat = response?.data?.data?.[0];
        if (firstChat) {
          firstChat.to_user_id == id
            ? setToProfile({
                profilePicture: firstChat?.to_profile_pic,
                fulName: firstChat?.to_full_name,
              })
            : setToProfile({
                profilePicture: firstChat?.from_profile_pic,
                fulName: firstChat?.from_full_name,
              });
        }
      } catch (error) {
        console.error("Error fetching conversation:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    getConversation();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    socket.emit("messages_read", {
      fromUserId: id,
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    socket.emit("is_user_online", { userId: id });

    socket.on("user_online_status", ({ userId, isOnline: online }) => {
      if (userId == id) {
        setIsOnline(online === 1);
      }
    });

    return () => {
      socket.off("user_online_status");
    };
  }, [id]);

  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (msg.from_user_id == id || msg.to_user_id == id) {
        const msgWithDate = {
          ...msg,
          created_at: msg.created_at || new Date().toISOString(),
        };
        setConversation((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msgWithDate];
        });

        if (msg.from_user_id == id) {
          socket.emit("messages_read", {
            fromUserId: id,
          });
        }
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [id]);

  useEffect(() => {
    socket.on("message_read", ({ byUserId }) => {
      if (byUserId == id) {
        setConversation((prev) =>
          prev.map((msg) =>
            msg.to_user_id == id ? msg : { ...msg, is_read: 1 },
          ),
        );
      }
    });

    return () => {
      socket.off("message_read");
    };
  }, [id]);

  useEffect(() => {
    socket.on("status_update", ({ userId, is_online }) => {
      if (userId == id) {
        setIsOnline(is_online === 1);
      }
    });

    return () => {
      socket.off("status_update");
    };
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sendMessage = async () => {
    try {
      if (!inputText.trim()) return;
      const formData = new FormData();
      formData.append("to_user_id", id);
      formData.append("message", inputText);
      const res = await postMessage(formData);

      const isSuccess = res?.status >= 200 && res?.status < 300;
      if (isSuccess) {
        setInputText("");
        const sentMsg = res?.data?.data;
        if (sentMsg) {
          const msgWithDate = {
            ...sentMsg,
            created_at: sentMsg.created_at || new Date().toISOString(),
          };
          setConversation((prev) => {
            if (prev.some((m) => m.id === sentMsg.id)) return prev;
            return [...prev, msgWithDate];
          });
        }
      }
    } catch (error) {
      console.error("Internal Server Error", error);
    }
  };

  const sendImage = async () => {
    const previewUrl = attachmentPreview;
    const messageText = inputText.trim();
    const tempId = `temp-image-${Date.now()}`;

    try {
      if (!attachment) return;

      const optimisticMsg = {
        id: tempId,
        from_user_id: "me",
        to_user_id: id,
        message: messageText,
        attachment_url: previewUrl,
        created_at: new Date().toISOString(),
        is_read: 0,
      };
      setConversation((prev) => [...prev, optimisticMsg]);

      const formData = new FormData();
      formData.append("attachment", attachment);
      formData.append("to_user_id", id);
      if (messageText) {
        formData.append("message", messageText);
      }
      const res = await postMessage(formData);
      const isSuccess = res?.status >= 200 && res?.status < 300;
      if (isSuccess) {
        removeAttachment();
        setInputText("");

        const sentMsg = res?.data?.data;
        if (sentMsg) {
          const msgWithDate = {
            ...sentMsg,
            created_at: sentMsg.created_at || new Date().toISOString(),
          };
          setConversation((prev) => {
            if (prev.some((m) => m.id === sentMsg.id)) return prev;
            return prev.map((m) => (m.id === tempId ? msgWithDate : m));
          });
        }
      }
    } catch (error) {
      setConversation((prev) => prev.filter((m) => m.id !== tempId));
      console.error("Internal Server Error", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 p-0 md:p-4">
      <div className="mx-auto w-full bg-white md:rounded-[20px] rounded-none flex flex-col border-0 md:border border-[#D6D6D6] px-0 md:px-4 h-[calc(100vh-80px)] md:h-[calc(100vh-60px)]">
        <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 border-b border-[#D6D6D6]">
          <button
            onClick={() => navigate("/dashboard/messages")}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Back to messages"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4681F4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative flex items-center justify-center flex-shrink-0">
            {toProfile?.profilePicture ? (
              <img
                src={toProfile?.profilePicture}
                alt="User avatar"
                className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] rounded-full object-cover"
              />
            ) : (
              <div className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] rounded-full bg-[#A0BFFA] flex items-center justify-center font-semibold text-white text-sm md:text-base">
                {getShortName(toProfile?.fulName)}
              </div>
            )}
            <div
              className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${isOnline ? "bg-[#05B71A]" : "bg-[#666666]"} absolute right-0 top-[30px] md:top-[37px]`}
            ></div>
          </div>

          <div className="min-w-0">
            <h2 className="font-bold text-black md:text-lg text-sm truncate">
              {toProfile?.fulName}
            </h2>
            <p className="text-xs md:text-sm text-black">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div
          className="px-2 md:px-4 py-2 md:py-3 space-y-4 md:space-y-6 overflow-y-auto flex-1"
          ref={scrollContainerRef}
        >
          {conversation.map((msg, index) => {
            const isMe = msg.from_user_id != id;

            const currentMsgDate = new Date(msg.created_at).toDateString();
            const prevMsgDate =
              index > 0
                ? new Date(conversation[index - 1].created_at).toDateString()
                : null;
            const showDateHeader = currentMsgDate !== prevMsgDate;

            return (
              <div key={msg.id} className="flex flex-col">
                {showDateHeader && (
                  <div className="flex justify-center my-4">
                    <div className="bg-[#E6F0FF] text-[#4681F4] px-4 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {formatStickyDate(msg.created_at)}
                    </div>
                  </div>
                )}

                {isMe ? (
                  <div className="flex flex-col items-end">
                    <div className="bg-[#4681F4] text-white px-3 py-2 rounded-xl max-w-[75%] md:max-w-xs shadow-sm text-sm md:text-base break-words">
                      {msg.attachment_url ? (
                        <img
                          src={msg.attachment_url}
                          alt="attachment"
                          className="rounded-lg max-w-[160px] md:max-w-[200px] max-h-[160px] md:max-h-[200px] object-cover"
                        />
                      ) : (
                        msg.message
                      )}
                    </div>
                    <p className="text-[10px] mt-1 text-[#4681F4] font-bold flex items-center gap-1">
                      {formatMessageTime(msg.created_at)}{" "}
                      <span className="text-[12px] leading-none">
                        {msg.is_read ? "✓✓" : "✓"}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-start">
                    <div className="bg-[#E6F0FF] px-3 py-2 rounded-xl max-w-[75%] md:max-w-xs shadow-sm text-sm md:text-base break-words">
                      {msg.attachment_url ? (
                        <img
                          src={msg.attachment_url}
                          alt="attachment"
                          className="rounded-lg max-w-[160px] md:max-w-[200px] max-h-[160px] md:max-h-[200px] object-cover"
                        />
                      ) : (
                        msg.message
                      )}
                    </div>
                    <p className="text-[10px] mt-1 text-[#4681F4] font-bold">
                      {formatMessageTime(msg.created_at)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {attachmentPreview && (
          <div className="px-3 md:px-4 py-2 border-t border-gray-100 flex items-center gap-2 md:gap-3">
            <div className="relative inline-block flex-shrink-0">
              <img
                src={attachmentPreview}
                alt="preview"
                className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-lg border border-[#D6D6D6]"
              />
              <button
                onClick={removeAttachment}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs cursor-pointer hover:bg-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <span className="text-xs md:text-sm text-[#666666] truncate max-w-[120px] md:max-w-[200px]">
              {attachment?.name}
            </span>
          </div>
        )}

        <div className="p-2 md:p-3 border-t border-gray-100 flex items-center gap-1.5 md:gap-2">
          <div className="w-full flex gap-1.5 md:gap-2 bg-[#E6F0FF] rounded-[12px] px-2.5 md:px-4 py-2 focus:ring-2 focus:ring-[#4681F4]">
            <textarea
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 w-full  h-18 placeholder:text-[#666666] text-sm md:text-base focus:outline-none border-none bg-transparent"
            />
            <button
              onClick={handleClick}
              className="flex items-center cursor-pointer justify-center flex-shrink-0"
            >
              <img
                src="/document.svg"
                alt="document"
                className="w-5 h-5 md:w-auto md:h-auto"
              />
            </button>
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <img
                src="/emoji.svg"
                alt="emoji"
                className="w-5 h-5 md:w-auto md:h-auto"
              />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg, image/svg+xml"
            className="hidden"
          />

          <button
            onClick={(e) => {
              e.preventDefault();
              attachment ? sendImage() : sendMessage();
            }}
            className="bg-[#4681F4] flex items-center w-[38px] h-[38px] md:w-[41px] md:h-[42px] justify-center cursor-pointer rounded-xl transition-all duration-200 text-white hover:bg-blue-600 flex-shrink-0"
          >
            <img
              src="/send-icon.svg"
              alt="sendIcon"
              className="mr-[2px] mt-[2px] w-4 h-4 md:w-auto md:h-auto"
            />
          </button>
        </div>
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="mx-2 md:mx-3 mb-2 md:mb-3 rounded-xl border border-[#D6D6D6] bg-white p-2 shadow-sm flex flex-wrap gap-1.5 md:gap-2"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiSelect(emoji)}
                className="text-lg md:text-xl cursor-pointer hover:scale-110 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
