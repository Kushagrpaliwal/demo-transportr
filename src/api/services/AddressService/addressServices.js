import axios from "axios";

const GOOGLE_PLACES_API_BASE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const GOOGLE_DETAILS_API_BASE_URL = "https://maps.googleapis.com/maps/api/place/details/json";

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

export const fetchAddressAutocompleteService = async (input, country = "gb") => {

  try {
    const response = await axios.get(GOOGLE_PLACES_API_BASE_URL, {
      params: {
        input,
        components: `country:${country}`,
        types: "address",
        key: apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching address autocomplete:", error);
    throw error;
  }
};

export const fetchAddressDetailsService = async (placeID) => {
  try {
    const response = await axios.get(GOOGLE_DETAILS_API_BASE_URL, {
      params: {
        place_id: placeID,
        key: apiKey
      }
    })
    return response
  } catch (error) {
    console.error("Error fetching address autocomplete:", error);
    throw error;
  }
}