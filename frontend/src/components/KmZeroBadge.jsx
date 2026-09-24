import { MapPin } from "lucide-react";

// Solo se renderiza si hay distancia calculada (el usuario dio permiso de geolocalización).
export default function KmZeroBadge({ km }) {
  if (km === null || km === undefined) return null;
  const isKmZero = km <= 15; // criterio de proximidad para la demo
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
      <MapPin className="size-3" />A {km.toFixed(1)} km de tu ubicación{isKmZero ? " · Km 0" : ""}
    </span>
  );
}
