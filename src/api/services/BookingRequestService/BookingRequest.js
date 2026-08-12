import API from "../..";

export const BookingRequest = async () => {
  return API.get("/travelers/requests")
}
export const BookingRequestAccept = async (id) => {
  return API.post(`/shipments/${id}/accept`)
}
export const BookingRequestDecline = async (id) => {
  return API.post(`/shipments/${id}/decline`)
}