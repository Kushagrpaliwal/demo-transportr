import API from "../..";

export const FindShipmentsService = async ({
  origin,
  destination,
  page,
  limit,
} = {}) => {
  const params = {};
  if (origin) params.origin = origin;
  if (destination) params.destination = destination;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  return API.get("/shipments/search/v1", { params });
};
