import React, { useEffect, useRef, useState } from "react";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

const DEFAULT_CENTER = [51.4572, -2.5701]; // Bristol, UK
const DEFAULT_ZOOM = 13;

const Map = ({
  travelerLocation,
  origin,
  destination,
  packageData,
  shipmentData,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const travelerMarkerRef = useRef(null);
  const travelerPathRef = useRef([]);
  const travelerPolylineRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);

  // Robust fallback: try multiple sources for origin/destination
  const effectiveOrigin =
    origin ||
    shipmentData?.from ||
    packageData?.origin ||
    packageData?.source ||
    packageData?.from;
  const effectiveDestination =
    destination ||
    shipmentData?.to ||
    packageData?.destination ||
    packageData?.to;

  const extractCity = (address) => {
    if (!address) return null;
    // Take the first part before a comma as the city name
    const city = address.split(",")[0].trim();
    return city && city !== address ? city : null;
  };

  const geocode = async (address) => {
    if (!address) return null;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      // Fallback: try geocoding with just the city name
      const city = extractCity(address);
      if (city) {
        const cityResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`,
        );
        const cityData = await cityResponse.json();
        if (cityData && cityData.length > 0) {
          return {
            lat: parseFloat(cityData[0].lat),
            lng: parseFloat(cityData[0].lon),
          };
        }
      }
    } catch (error) {
      console.error("Geocoding error for address:", address, error);
    }
    return null;
  };

  useEffect(() => {
    const fetchCoords = async () => {
      if (effectiveOrigin) {
        const coords = await geocode(effectiveOrigin);
        setOriginCoords(coords);
      } else {
        setOriginCoords(null);
      }
      if (effectiveDestination) {
        const coords = await geocode(effectiveDestination);
        setDestCoords(coords);
      } else {
        setDestCoords(null);
      }
    };
    fetchCoords();
  }, [effectiveOrigin, effectiveDestination]);

  useEffect(() => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (mapInstanceRef.current || !mapContainerRef.current) return;

      const L = window.L;
      const map = L.map(mapContainerRef.current).setView(
        DEFAULT_CENTER,
        DEFAULT_ZOOM,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    };

    if (window.L) {
      initMap();
    } else if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      const check = setInterval(() => {
        if (window.L) {
          clearInterval(check);
          initMap();
        }
      }, 100);
      return () => clearInterval(check);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Marker effect for Origin and Destination
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const L = window.L;
    const markers = [];

    if (originCoords) {
      if (originMarkerRef.current) originMarkerRef.current.remove();

      const originIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      originMarkerRef.current = L.marker([originCoords.lat, originCoords.lng], {
        icon: originIcon,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>From</b><br>${effectiveOrigin}`);

      markers.push([originCoords.lat, originCoords.lng]);
    }

    if (destCoords) {
      if (destMarkerRef.current) destMarkerRef.current.remove();

      const destIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      destMarkerRef.current = L.marker([destCoords.lat, destCoords.lng], {
        icon: destIcon,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>To</b><br>${effectiveDestination}`);

      markers.push([destCoords.lat, destCoords.lng]);
    }

    // Only frame the map around origin/destination when the traveler's live
    // location isn't on the map yet. Once the traveler is shown, that effect
    // owns the map focus.
    if (markers.length > 0 && !travelerMarkerRef.current) {
      const bounds = L.latLngBounds(markers);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 15,
      });
    }
  }, [
    mapReady,
    originCoords,
    destCoords,
    effectiveOrigin,
    effectiveDestination,
  ]);

  // Marker + trail effect for live Traveler Location Updates
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !travelerLocation) return;
    const L = window.L;
    const { lat, lng } = travelerLocation;
    if (lat == null || lng == null) return;
    const map = mapInstanceRef.current;

    // Append latest position to the trail history (skip identical consecutive points)
    const path = travelerPathRef.current;
    const last = path[path.length - 1];
    if (!last || last[0] !== lat || last[1] !== lng) {
      path.push([lat, lng]);
    }

    const popupContent = `<b>Traveller (Live)</b>`;

    if (!travelerMarkerRef.current) {
      const travelerIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      travelerMarkerRef.current = L.marker([lat, lng], {
        icon: travelerIcon,
      }).addTo(map);
      travelerMarkerRef.current.bindPopup(popupContent).openPopup();

      // First time we see the traveler: center the map on them so the live
      // location is the primary focus (origin/destination markers stay visible
      // as context but no longer dictate the viewport).
      map.setView([lat, lng], 14);
    } else {
      travelerMarkerRef.current.setLatLng([lat, lng]);
      travelerMarkerRef.current.setPopupContent(popupContent);
      // Follow the traveler if they move off-screen
      if (!map.getBounds().contains([lat, lng])) {
        map.panTo([lat, lng]);
      }
    }

    // Draw / extend the polyline trail of where the traveler has been
    if (path.length >= 2) {
      if (travelerPolylineRef.current) {
        travelerPolylineRef.current.setLatLngs(path);
      } else {
        travelerPolylineRef.current = L.polyline(path, {
          color: "#16a34a",
          weight: 4,
          opacity: 0.8,
        }).addTo(map);
      }
    }
  }, [mapReady, travelerLocation, originCoords, destCoords]);

  return (
    <section className="w-full flex flex-col items-center py-8">
      <div className="w-full text-center md:text-left">
        <h2 className="text-2xl md:text-[32px] font-semibold text-black mb-4">
          Live Map
        </h2>
        <div className="w-full rounded-[20px] overflow-hidden bg-white">
          <div
            ref={mapContainerRef}
            className="w-full h-[300px] md:h-[487px]"
          />
        </div>
      </div>
    </section>
  );
};

export default Map;
