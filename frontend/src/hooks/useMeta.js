import { useEffect, useState } from "react";
import { getMeta } from "@/lib/api";

// Cache a nivel de módulo: /api/meta no cambia durante la sesión, así que se
// pide una sola vez aunque se use el hook en muchos componentes a la vez.
let cachedMeta = null;
let pendingRequest = null;

export function useMeta() {
  const [meta, setMeta] = useState(cachedMeta);
  const [loading, setLoading] = useState(!cachedMeta);

  useEffect(() => {
    if (cachedMeta) return;

    if (!pendingRequest) {
      pendingRequest = getMeta();
    }

    let cancelled = false;
    pendingRequest.then((data) => {
      cachedMeta = data;
      if (!cancelled) {
        setMeta(data);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { meta, loading };
}
