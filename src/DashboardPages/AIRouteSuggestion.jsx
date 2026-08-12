import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { routeSuggesterService } from "../api/services/AiToolsService/aiToolService";
import { usePopup } from "../context/PopupContext";
import { getProFeaturesService } from "../api/services/proFeaturesService/proFeatures";
import { useProfile } from "../context/ProfileContext";

const AIRouteSuggestion = () => {
  const [route, setRoute] = useState("");
  const [details, setDetails] = useState("");
  const [warning, setwarning] = useState(true);

  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showPopup } = usePopup();
  const { profile } = useProfile() || {};

  useEffect(() => {
    if (profile) {
      const userData = profile?.data || {};
      if (userData?.pro_traveler === 1) {
        setwarning(false);
      } else {
        setwarning(true);
      }
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!route.trim()) {
      showPopup("Please enter the current travel route", "error");
      return;
    }

    if (!details.trim()) {
      showPopup("Please enter package details", "error");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        currentRoute: route,
        packageDetails: details,
      };

      const response = await routeSuggesterService(payload);

      if (response && response.data.data) {
        setSuggestions({
          suggestedRoutes: response.data.data.suggestedRoutes,
          reasoning: response.data.data.reasoning,
        });
        showPopup("Route suggestions generated successfully!", "success");
      } else {
        showPopup("No suggestions received from the server", "error");
      }
    } catch (error) {
      console.error("Error getting route suggestions:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to get route suggestions. Please try again.";
      showPopup(errorMessage, "error");
      setSuggestions(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full flex flex-col items-center py-8 px-4">
      {warning ? (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-1000 px-4">
          <div className="bg-white rounded-[20px] p-6 w-full max-w-[400px] shadow-lg flex flex-col items-center">
            <h3 className="text-xl font-bold text-black mb-4">Buy Subscription</h3>
            <p className="text-[#666666] text-center mb-6">
              Unlock all premium features by purchasing a subscription.
            </p>
            <div className="flex w-full gap-4">
              <Link
                to="/dashboard/subscriptions"
                className="flex-1 py-3 font-semibold rounded-full transition-all cursor-pointer bg-[#4681F4] text-white hover:bg-[#3570E0] text-center"
              >
                Buy Now
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      <div className="w-full mx-auto">
        <div className="bg-[#E6F0FF] rounded-[20px] p-6 md:p-8 xl:p-12">
          <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-2">
            AI Route Suggestor
          </h2>
          <p className="text-[#5F6C85] text-base md:text-lg mb-6">
            Get AI-powered alternative route suggestions based on current
            conditions and package details. Example Current Route: "London to
            Edinburgh via M1/A1(M)" Example Package Details: "Fragile glassware,
            2kg, needs careful handling" Example Real-Time Conditions: "Heavy
            traffic on M25, accident near Leeds on A1(M)"
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#D6D6D6] rounded-[20px] p-4 md:p-6"
          >
            <div className="mb-4">
              <label className="block text-xl md:text-2xl text-black mb-4">
                Current Travel Route
              </label>
              <input
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="e.g., Driving from London to Edinburgh via A1(M)"
                className="w-full bg-[#E6F0FF] rounded-xl px-4 py-3 outline-none"
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <label className="block text-xl md:text-2xl text-black mb-4">
                Package Details
              </label>
              <textarea
                value={details}
                rows={5}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g., Fragile electronics, 2kg, needs careful handling"
                className="w-full bg-[#E6F0FF] rounded-xl px-4 py-3 resize-none outline-none"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="bg-[#4681F4] w-full md:w-[245px] h-[50px] text-[#F8FAFC] hover:bg-white hover:text-[#4681F4] font-bold text-xl flex items-center justify-center cursor-pointer transition-all duration-200 border border-[#4681F4] rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Get Suggestions"}
            </button>
          </form>

          {suggestions && (
            <div className="mt-6 bg-white rounded-[20px] p-6">
              {suggestions.suggestedRoutes && (
                <div className="mb-6">
                  <h3 className="text-sm md:text-base lg:text-lg font-semibold text-black mb-4">
                    Suggested Routes:
                  </h3>
                  <div className="bg-[#E6F0FF] rounded-[20px] p-4">
                    <p className="text-black font-semibold text-base">
                      {suggestions.suggestedRoutes}
                    </p>
                  </div>
                </div>
              )}

              {suggestions.reasoning && (
                <div>
                  <div className="bg-[#E6F0FF] rounded-[20px] p-4">
                    <h3 className=" font-semibold text-sm md:text-base lg:text-lg text-black mb-2">
                      Reasoning:
                    </h3>
                    <p className="text-[#4681F4] text-base">
                      {suggestions.reasoning}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AIRouteSuggestion;
