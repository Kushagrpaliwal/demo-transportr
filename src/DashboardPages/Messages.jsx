import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getListOfConversations } from "../api/services/MessageService/MessageService";
import getShortName from "../utils/GetShortName";
import formatDate from "../utils/formatDate";
import { useProfile } from "../context/ProfileContext";
import { socket } from "../api/services/SocketIoService/Socket";

const Messages = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(false);
  const result = useProfile() || {};
  const profile = result?.profile || {};
  const myData = profile?.data || {};
  const myId = myData?.id;
  useEffect(() => {
    const getConversations = async () => {
      try {
        setLoading(true);
        const data = await getListOfConversations();
        setData(data?.data?.data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setError(true);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    getConversations();
  }, []);

  useEffect(() => {
    const handleNewMessage = (msg) => {
      setData((prev) => {
        if (!prev) return prev;
        const otherUserId =
          msg.from_user_id == myId ? msg.to_user_id : msg.from_user_id;

        const updated = prev.map((c) => {
          const conversationOther =
            c.from_user_id == myId ? c.to_user_id : c.from_user_id;
          if (conversationOther == otherUserId) {
            return {
              ...c,
              message: msg.message,
              created_at: msg.created_at || new Date().toISOString(),
              unread_count:
                msg.from_user_id != myId
                  ? (c.unread_count || 0) + 1
                  : c.unread_count,
            };
          }
          return c;
        });

        const idx = updated.findIndex((c) => {
          const conversationOther =
            c.from_user_id == myId ? c.to_user_id : c.from_user_id;
          return conversationOther == otherUserId;
        });

        if (idx > 0) {
          const [item] = updated.splice(idx, 1);
          updated.unshift(item);
        }

        return updated;
      });
    };

    socket.on("receiveMessage", handleNewMessage);
    return () => {
      socket.off("receiveMessage", handleNewMessage);
    };
  }, [myId]);

  useEffect(() => {
    if (!data.length) return;

    // 🔥 har user ke liye emit karo
    data.forEach((c) => {
      const userId = c.from_user_id === myId ? c.to_user_id : c.from_user_id;

      socket.emit("is_user_online", { userId });
    });

    // 🔥 response receive karo
    socket.on("user_online_status", ({ userId, isOnline }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: isOnline,
      }));
    });

    return () => {
      socket.off("user_online_status");
    };
  }, [data]);

  const filteredData = data?.filter((c) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(searchTerm) ||
      c.message?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <section className="w-full flex flex-col items-center py-8 px-4">
      <div className="w-full mx-auto">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-5 md:mb-10">
          Conversations
        </h2>
        <div className="mb-5">
          <div className="bg-[#E6F0FF] rounded-full flex gap-2 px-4 py-3 text-black text-base w-full">
            <img src="/search-blue-icon.svg" alt="search-blue-icon" />
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full placeholder:text-[#666666]  outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {error ? (
            <div className="text-red-500">Error loading conversations</div>
          ) : loading ? (
            <div className="text-black">Loading...</div>
          ) : (
            filteredData?.map((c) => (
              <div
                key={c.id}
                onClick={() =>
                  navigate(
                    `/dashboard/messages/${c.from_user_id === myId ? c.to_user_id : c.from_user_id}`,
                  )
                }
                className="bg-[#E6F0FF] cursor-pointer rounded-xl p-2.5 md:p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 md:gap-4">
                  <div className="flex items-center justify-center relative">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        onlineUsers[
                          c.from_user_id === myId
                            ? c.to_user_id
                            : c.from_user_id
                        ]
                          ? "bg-[#05B71A]"
                          : "bg-[#666666]"
                      } absolute right-0 top-[37px]`}
                    />

                    {c.profile_pic ? (
                      <img
                        src={c.profile_pic}
                        alt={c.full_name}
                        className="w-[50px] h-[50px] rounded-full object-cover "
                      />
                    ) : (
                      <div className="w-[50px] h-[50px] rounded-full bg-[#A0BFFA] flex items-center justify-center font-semibold text-white">
                        {getShortName(c.full_name)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold font-lg text-black">
                      {c.full_name}
                    </p>
                    <p className="text-black text-sm">{c.message}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-[#4681F4] text-xs font-bold">
                    {formatDate(c.created_at || "")}
                  </div>
                  {c.unread_count > 0 ? (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-[#666666] border border-[#666666]">
                      {c.unread_count}
                    </div>
                  ) : (
                    <div className="w-6 h-6" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Messages;
