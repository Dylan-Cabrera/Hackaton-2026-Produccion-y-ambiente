import { ShieldCheck, Sparkles } from "lucide-react";
import { daysSince } from "@/lib/distance";

// Confianza simple por antigüedad: no hay reputación real todavía en el backend.
export default function TrustBadge({ createdAt }) {
  const isNew = daysSince(createdAt) < 7;
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium " +
        (isNew ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary")
      }
    >
      {isNew ? <Sparkles className="size-3" /> : <ShieldCheck className="size-3" />}
      {isNew ? "Nuevo" : "Activo"}
    </span>
  );
}
