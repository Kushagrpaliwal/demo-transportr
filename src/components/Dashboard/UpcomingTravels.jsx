import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActiveAndUpcomingTravels } from "../../api/services/DashboardService/ActiveAndUpcomingTravels";

// const activeTravels = [
// 	{
// 		destination: "Miami, FL",
// 		status: "In Progress",
// 		statusColor: "text-[#4681F4]",
// 		icon: "truck",
// 		date: "2nd October, 2024",
// 	},
// 	{
// 		destination: "Seattle, WA",
// 		status: "Upcoming",
// 		statusColor: "text-[#4681F4]",
// 		icon: "plane",
// 		date: "10th October, 2024",
// 	},
// 	{
// 		destination: "Chicago, IL",
// 		status: "Upcoming",
// 		statusColor: "text-[#4681F4]",
// 		icon: "truck",
// 		date: "18th October, 2024",
// 	},
// 	{
// 		destination: "Chicago, IL",
// 		status: "Upcoming",
// 		statusColor: "text-[#4681F4]",
// 		icon: "plane",
// 		date: "18th October, 2024",
// 	},
// ];

const UpcomingTravels = () => {
  const navigate = useNavigate();
  const [viewmore, setViewmore] = useState(true);

  const [travels, Settravels] = useState([]);

  const fetchdata = async () => {
    try {
      const res = await ActiveAndUpcomingTravels();
      Settravels(res?.data?.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchdata();
  }, []);

  return (
    <section className="w-full flex flex-col items-center">
      <div className="w-full text-center md:text-left">
        <div className=" mb-8">
          <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
            Active & Upcoming Travels
          </h2>
          <p className="text-[#5F6C85] text-base md:text-lg mb-6">
            Manage your trips that are in progress or scheduled for the future.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(viewmore ? travels.slice(0, 10) : travels).map((travel) => (
              <div
                key={travel.id}
                className="bg-[#E6F0FF] rounded-[18px] shadow flex flex-col gap-2 p-5 md:p-6 min-h-[120px]"
              >
                <div className="flex flex-col items-center md:flex-row md:items-start gap-4">
                  <div className="bg-[#4681F4] rounded-full w-15 h-15 flex items-center justify-center">
                    {travel.icon === "truck" ? (
                      <img src="/truck.svg" alt="truck" />
                    ) : (
                      <img src="/airoplane.svg" alt="airoplane" />
                    )}
                  </div>
                  <div className="flex-1 w-full text-left">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center justify-between gap-2">
                        Trip to {travel.destination}
                      </span>
                      <button
                        onClick={() => {
                          navigate("/dashboard/travel-detail", {
                            state: {
                              travel_id: travel.id,
                            },
                          });
                        }}
                        className="border border-[#4681F4] text-[#4681F4] font-bold h-[34px] w-[94px] cursor-pointer rounded-full transition-all hover:bg-[#4681F4] hover:text-white text-lg"
                      >
                        Details
                      </button>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className={`  ${travel.status === "Upcoming" ? "text-[#666666]" : "text-[#4681F4]"} font-bold text-base`}
                      >
                        {travel.status}
                      </span>
                    </div>
                    <div className="text-sm mt-1 text-[#666666]">
                      {travel.travel_date}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {travels.length >= 10 ? (
            <div className="flex justify-center item-center p-4 mt-4">
              <button
                onClick={() => setViewmore(!viewmore)}
                className="bg-[#4681F4] hover:bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-full transition-all duration-300"
              >
                {viewmore === true ? "View More" : "View Less"}
              </button>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UpcomingTravels;
