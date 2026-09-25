import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-10 text-center">
      <AlertTriangle className="size-8 text-destructive" />
      <p className="text-sm text-destructive">{message || "Algo salió mal."}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
