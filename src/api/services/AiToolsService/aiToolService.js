import API from "../..";

export const routeAnalyzerSuggesterService = async (userData) => {
  return API.post("/ai/route_analyzer_and_suggester", userData);
};

export const routeSuggesterService = async (userData) => {
  return API.post("/ai/route_suggester", userData);
};