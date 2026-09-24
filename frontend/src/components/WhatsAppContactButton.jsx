import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackContactClick } from "@/lib/api";

export default function WhatsAppContactButton({ producer, product }) {
  if (!producer.phone) {
    return (
      <Button variant="outline" disabled className="w-full">
        Este productor todavía no cargó su teléfono
      </Button>
    );
  }

  const message = `Hola ${producer.businessName}, vi tu publicación${
    product ? ` de ${product.title}` : ""
  } en la plataforma y quiero coordinar una compra.`;
  const href = `https://wa.me/${producer.phone}?text=${encodeURIComponent(message)}`;

  return (
    <Button
      asChild
      className="w-full"
      onClick={() => {
        // Métrica disparada en paralelo: no bloquea la apertura de WhatsApp.
        trackContactClick({ producerId: producer.id, productId: product?.id });
      }}
    >
      <a href={href} target="_blank" rel="noreferrer">
        <MessageCircle className="size-4" />
        Contactar por WhatsApp
      </a>
    </Button>
  );
}
