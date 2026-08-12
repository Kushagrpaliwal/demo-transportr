import { useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";

const cards = [
  {
    title: "My Send Requests",
    desc: "View and manage your shipment requests.",
    icon: "/package.svg",
    path: "/dashboard/send-requests",
  },
  {
    title: "Offer a Ride",
    desc: "List your upcoming travel plans.",
    icon: "/route-analysis.svg",
    path: "/dashboard/my-travels",
  },
  {
    title: "Search Travellers",
    desc: "Find someone going your way.",
    icon: "/search.svg",
    path: "/dashboard/search-travellers",
  },
  {
    title: "View Messages",
    desc: "Check your conversations.",
    icon: "/notified.svg",
    path: "/dashboard/messages",
  },
];

const DashboardWelcome = () => {
  const navigate = useNavigate();
  const result = useProfile() || {};
  const profile = result?.profile || {};
  const data = profile?.data || {};

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="w-full mt-6">
      {/* Heading Section */}
      <div className="text-left px-4 md:px-0">
        <h1 className="text-2xl md:text-[32px] font-semibold text-[#000]">
          Welcome to Transportr,{" "}
          <span className="text-black">{data?.username}!</span>
        </h1>
        <p className="text-[#5F6C85] text-[14px] md:text-lg mt-2">
          Your hub for sending and carrying packages across distances.
        </p>
        <p className="text-[14px] text-black md:text-lg mt-2">
          Here you can manage your shipments, plan your travels, and connect
          with other users. What would you like to do today?
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[60px] lg:gap-6 mt-[70px] lg:mt-15 md:px-0">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(card.path)}
            className="bg-[#E6F0FF] rounded-[20px] relative shadow-[0_6px_14px_0_#6666661A] hover:shadow-2xl p-6 py-7.5 flex flex-col items-center text-center cursor-pointer hover:scale-105 transform transition-transform duration-200"
          >
            <div className="bg-[#4681F4] absolute rounded-full w-20 h-20 flex items-center justify-center top-[-40px]">
              <img
                src={card.icon}
                alt="card icon"
                className="w-[34px] h-[34px]"
              />
            </div>

            <h3 className="font-medium text-base lg:text-xl mb-2 mt-10 text-black">
              {card.title}
            </h3>
            <p className="text-[#000000] text-[14px] lg:text-[16px]">
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardWelcome;
