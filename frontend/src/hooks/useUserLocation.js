import { useCallback, useEffect, useState } from "react";

// Geolocalización opcional: si el usuario no da permiso el catálogo sigue
// funcionando, solo que sin distancias ni orden por cercanía.
// status: "idle" | "loading" | "granted" | "denied"
export function useUserLocation() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("idle");

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { location, status, request };
}
