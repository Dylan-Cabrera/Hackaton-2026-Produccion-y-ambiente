import { CalendarDays, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TrustBadge from "@/components/TrustBadge";
import { daysSince } from "@/lib/distance";

export default function ProducerProfileCard({ producer }) {
  const days = daysSince(producer.createdAt);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {producer.category}
          </span>
          <TrustBadge createdAt={producer.createdAt} />
        </div>
        <CardTitle className="text-2xl">{producer.businessName}</CardTitle>
        <p className="text-sm text-muted-foreground">{producer.name}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="size-4" />
          {/* Antigüedad simulada a partir de la fecha de creación. */}
          {days === 0 ? "Se unió hoy" : `Se unió hace ${days} día${days === 1 ? "" : "s"}`}
        </p>
        {producer.deliveryOptions.length > 0 && (
          <div className="flex items-start gap-2">
            <Truck className="mt-0.5 size-4 text-muted-foreground" />
            <span>{producer.deliveryOptions.join(" · ")}</span>
          </div>
        )}
        {producer.paymentMethods.length > 0 && (
          <p className="text-muted-foreground">Pagos: {producer.paymentMethods.join(", ")}</p>
        )}
        {producer.address && <p className="text-muted-foreground">{producer.address}</p>}
        {producer.bio && <p className="pt-1 text-foreground">{producer.bio}</p>}
      </CardContent>
    </Card>
  );
}
