import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

// A diferencia de solo chequear "existe imageUrl", esto también cubre el caso
// de una URL cargada pero rota (404, dominio caído): sin esto se ve el ícono
// roto del navegador en vez de nuestro placeholder.
export default function ImageWithFallback({ src, alt, className }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <ImageOff className="size-8" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
