import { Building2, ShoppingBasket, Sprout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OPTIONS = [
  {
    type: "PERSONA",
    icon: ShoppingBasket,
    title: "Quiero comprar",
    description: "Buscá productos, contactá productores y guardá tus favoritos.",
  },
  {
    type: "INSTITUCION",
    icon: Building2,
    title: "Represento una institución",
    description: "Comedor, escuela, ONG u otra organización que compra o recibe donaciones.",
  },
  {
    type: "PRODUCER",
    icon: Sprout,
    title: "Soy productor",
    description: "Publicá tu emprendimiento y tus productos para que te encuentren.",
  },
];

export default function AccountTypeSelector({ onSelect }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {OPTIONS.map(({ type, icon: Icon, title, description }) => (
        <Card
          key={type}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(type)}
          onKeyDown={(e) => e.key === "Enter" && onSelect(type)}
          className="cursor-pointer transition-colors hover:border-primary"
        >
          <CardHeader>
            <Icon className="size-8 text-primary" />
            <CardTitle className="mt-2 text-lg">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
