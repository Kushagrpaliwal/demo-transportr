import React, { useEffect, useRef, useState } from "react";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

const ShipmentMap = ({ origin, destination, originCity, destinationCity }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const originMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    const [originCoords, setOriginCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);

    // Helper function for geocoding addresses
    const geocode = async (address) => {
        if (!address) return null;
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }
        } catch (error) {
            console.error("Geocoding error for address:", address, error);
        }
        return null;
    };

    useEffect(() => {
        const fetchCoords = async () => {
            if (origin) {
                let coords = await geocode(origin);
                if (!coords && originCity) coords = await geocode(originCity);
                setOriginCoords(coords);
            }
            if (destination) {
                let coords = await geocode(destination);
                if (!coords && destinationCity) coords = await geocode(destinationCity);
                setDestCoords(coords);
            }
        };
        fetchCoords();
    }, [origin, destination, originCity, destinationCity]);

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
            const map = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);

            // Using a cleaner tile set for a more premium look
            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
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

    useEffect(() => {
        if (!mapReady || !mapInstanceRef.current) return;

        const L = window.L;
        const markers = [];

        // Source Marker (Blue teardrop/pin)
        if (originCoords) {
            if (originMarkerRef.current) originMarkerRef.current.remove();

            const originIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            originMarkerRef.current = L.marker([originCoords.lat, originCoords.lng], { icon: originIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup(`<b>From</b><br>${origin}`);

            markers.push([originCoords.lat, originCoords.lng]);
        }

        // Destination Marker (Red teardrop)
        if (destCoords) {
            if (destMarkerRef.current) destMarkerRef.current.remove();

            const destIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            destMarkerRef.current = L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup(`<b>To</b><br>${destination}`);

            markers.push([destCoords.lat, destCoords.lng]);
        }

        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers);
            mapInstanceRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
        }
    }, [mapReady, originCoords, destCoords, origin, destination]);

    return (
        <div className="w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full min-h-[300px] md:min-h-[487px]" />
        </div>
    );
};

export default ShipmentMap;
