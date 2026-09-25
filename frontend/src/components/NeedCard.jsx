import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authorBadgeLabel, authorDisplayName } from "@/lib/distance";

const STATUS_LABELS = {
  OPEN: null,
  RESOLVED: "Resuelta",
  CLOSED: "Cerrada",
};

export default function NeedCard({ need }) {
  const statusLabel = STATUS_LABELS[need.status];

  return (
    <Link to={`/necesidades/${need.id}`}>
      <Card className="h-full transition-colors hover:border-primary">
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {need.category}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {authorBadgeLabel(need.author)}
            </span>
            {statusLabel && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {statusLabel}
              </span>
            )}
          </div>
          <CardTitle className="text-lg">{need.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium">
            {need.quantity} {need.unit} · {need.frequency}
          </p>
          <p className="text-muted-foreground">Pide: {authorDisplayName(need.author)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
