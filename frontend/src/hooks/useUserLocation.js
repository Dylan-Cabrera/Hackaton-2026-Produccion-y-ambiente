import { useCallback, useEffect, useState } from "react";

// Última ubicación concedida en esta pestaña: la telemetría la adjunta a los eventos
// (búsquedas, visitas, contactos) para el mapa de demanda, sin volver a pedir permiso.
let lastKnownLocation = null;
export function getLastKnownLocation() {
  return lastKnownLocation;
}

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
        lastKnownLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(lastKnownLocation);
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
