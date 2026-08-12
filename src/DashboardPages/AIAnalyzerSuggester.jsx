import React, { useState, useEffect } from "react";
import { routeAnalyzerSuggesterService } from "../api/services/AiToolsService/aiToolService";
import { usePopup } from "../context/PopupContext";
import { useNavigate, Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { logRouteSuggestionFeedback } from "../firebase";
import { getProFeaturesService } from "../api/services/proFeaturesService/proFeatures";
import { useProfile } from "../context/ProfileContext";
import { getProfileDetailsService } from "../api/services/ProfileService/profileServices";

const AIAnalyzerSuggester = () => {
  const [route, setRoute] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [warning, setwarning] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  /** Maps suggestion shipment id -> "good" | "bad" | null (toggle off clears to null) */
  const [feedbackBySuggestionId, setFeedbackBySuggestionId] = useState({});
  const { showPopup } = usePopup();
  const navigate = useNavigate();
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

  const setFeedbackForSuggestion = (shipmentId, type) => {
    const id = String(shipmentId);
    setFeedbackBySuggestionId((prev) => {
      const current = prev[id] ?? null;
      const next = current === type ? null : type;
      if (next === "good" || next === "bad") {
        logRouteSuggestionFeedback(id, next);
        showPopup(
          next === "good"
            ? "Thanks for your feedback!"
            : "Thanks, we’ll improve this!",
          "success",
        );
      }
      return { ...prev, [id]: next };
    });
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!route.trim()) {
      showPopup("Please enter a travel route description", "error");
      return;
    }

    setLoading(true);

    try {
      const payload = { routeDescription: route };
      const response = await routeAnalyzerSuggesterService(payload);

      if (response && response.data.data) {
        setAnalysis({
          routeAnalysis: response.data.data.routeAnalysis,
          likelihood: response.data.data.likelihoodOfMatch,
        });

        setSuggestions(response.data.data.suggestions || []);
        setFeedbackBySuggestionId({});

        showPopup("Route analyzed successfully!", "success");
      } else {
        showPopup("No suggestions received from the server", "error");
      }
    } catch (error) {
      console.error("Error analyzing route:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to analyze route. Please try again.";
      showPopup(errorMessage, "error");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // console.log("data from suggestion is",suggestions);

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
            AI Route Analyzer & Suggester
          </h2>
          <p className="text-[#5F6C85] text-base md:text-lg mb-6">
            Enter a detailed travel route to assess its potential and get
            package pickup suggestions.
            <br />
            Example: Driving from London to Manchester via the M6, stopping in
            Birmingham. Trip is for next Tuesday.
          </p>

          <form
            onSubmit={handleAnalyze}
            className="bg-white border border-[#D6D6D6] rounded-[20px] p-4 md:p-6"
          >
            <label className="block text-xl md:text-2xl text-black mb-4">
              Travel Route Description
            </label>
            <textarea
              value={route}
              rows={12}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="Describe your planned route, including origin, destination, major stops, and dates..."
              className="w-full bg-[#E6F0FF] rounded-xl p-4 resize-none outline-none text-base"
              disabled={loading}
            />

            <div className="mt-4">
              <button
                type="submit"
                className="bg-[#4681F4] w-full md:w-[245px] h-[50px] text-[#F8FAFC] hover:bg-white hover:text-[#4681F4] font-bold text-xl flex items-center justify-center cursor-pointer transition-all duration-200 border border-[#4681F4] rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Get Suggestions"}
              </button>
            </div>
          </form>
          {analysis && analysis.likelihood && (
            <div className="mt-6 bg-white rounded-[20px] p-6">
              <h3 className="text-lg font-semibold mb-2">Analysis Result</h3>

              <p className="mb-2">
                <strong>Likelihood of Match:</strong>{" "}
                <span
                  className={`font-bold ${
                    analysis.likelihood === "High"
                      ? "text-green-600"
                      : analysis.likelihood === "Medium"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {analysis.likelihood.toUpperCase()}
                </span>
              </p>

              <p className="text-black">
                <strong>AI Reasoning:</strong> {analysis.routeAnalysis}
              </p>
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="mt-6 bg-white rounded-[20px] p-6">
              <h3 className="text-xl font-semibold text-black mb-4">
                Suggested Pickups ({suggestions.length})
              </h3>

              <div className="space-y-4 grid grid-cols-1 md:grid-cols-2">
                {suggestions.map((item) => {
                  const shipmentId = String(item.id);
                  const feedback = feedbackBySuggestionId[shipmentId] ?? null;
                  const thumbBase =
                    "w-[35px] h-[35px] transition-colors rounded-full flex items-center justify-center cursor-pointer";
                  const thumbIdle = "bg-[#E2E8F0] hover:bg-[#CBD5E1]";
                  const thumbActive =
                    "bg-[#FACC15] hover:bg-[#EAB308] ring-2 ring-[#CA8A04]/40";
                  const feedbackSubmitted =
                    feedback === "good" || feedback === "bad";

                  return (
                    <div
                      key={item.id}
                      className=" rounded-[20px]  p-4 bg-[#E6F0FF]"
                    >
                      <h4 className="font-semibold text-black mb-2.5">
                        {item.origin} → {item.destination}
                      </h4>

                      <p className="text-sm text-[#666666] mb-2">
                        Shipment ID: {item.id}
                      </p>

                      <div className="bg-[#D0E3FF] p-3 rounded-lg text-sm text-black italic mb-3">
                        💡 {item.justification}
                      </div>

                      <div className="flex flex-col justify-center items-start gap-2.5 xl:flex-row sm:justify-between">
                        <span className="text-green-600 font-bold">
                          £ Offer: {item.offer}
                        </span>

                        <button
                          onClick={() => {
                            navigate("/dashboard/find-shipments");
                          }}
                          className="bg-[#4681F4] cursor-pointer text-white px-4 py-2 rounded-full text-sm"
                        >
                          View Request
                        </button>
                      </div>
                      <div className="mt-5 pt-2 border-t border-[#D6D6D6] flex flex-col md:flex-row gap-4 items-center justify-between">
                        <span className="text-[#5F6C85] text-lg md:text-[15px] px-4">
                          Was this suggestion helpful?
                        </span>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            disabled={feedbackSubmitted}
                            aria-pressed={feedback === "good"}
                            aria-label="Mark suggestion as helpful"
                            onClick={() =>
                              setFeedbackForSuggestion(item.id, "good")
                            }
                            className={`${thumbBase} ${feedback === "good" ? thumbActive : thumbIdle} ${feedbackSubmitted ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            <ThumbsUp
                              className="w-4 h-4 text-black"
                              fill="black"
                            />
                          </button>
                          <button
                            type="button"
                            disabled={feedbackSubmitted}
                            aria-pressed={feedback === "bad"}
                            aria-label="Mark suggestion as not helpful"
                            onClick={() =>
                              setFeedbackForSuggestion(item.id, "bad")
                            }
                            className={`${thumbBase} ${feedback === "bad" ? thumbActive : thumbIdle} ${feedbackSubmitted ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            <ThumbsDown
                              className="w-4 h-4 text-black"
                              fill="black"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AIAnalyzerSuggester;
