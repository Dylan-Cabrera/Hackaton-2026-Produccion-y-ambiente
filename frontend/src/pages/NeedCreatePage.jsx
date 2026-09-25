import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useMeta } from "@/hooks/useMeta";
import { createNeed } from "@/lib/api";

export default function NeedCreatePage() {
  const { status, user } = useAuth();
  const { meta } = useMeta();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  // Default "UNICA": el backend trata `frequency` como opcional (usa este mismo default
  // si no viene en el body), pero solo si la clave falta. Si mandamos "" explícito, la
  // validación de campos lo rechaza igual porque "" no es un valor válido del enum.
  const [frequency, setFrequency] = useState("UNICA");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Publicar necesidad · Formosa Unida";
  }, []);

  // Sin sesión no se puede publicar (HU-11: "Redirige a login").
  useEffect(() => {
    if (status === "anonymous") navigate("/login");
  }, [status, navigate]);

  // El backend exige que la cuenta tenga teléfono para publicar necesidades
  // (para que después la puedan contactar); las cuentas CONSUMER lo tienen opcional.
  const missingPhone = status === "authenticated" && !user?.phone;

  if (status !== "authenticated") {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSaving(true);
    try {
      const need = await createNeed({
        title: title.trim(),
        category,
        quantity: Number(quantity),
        unit,
        frequency,
        description: description.trim() || null,
      });
      navigate(`/necesidades/${need.id}`);
    } catch (err) {
      // Sin esto, un 400 de validación quedaba solo en el mensaje en pantalla,
      // sin rastro en devtools para debuggear qué campo lo disparó.
      console.error("No se pudo publicar la necesidad:", err.status, err.fieldErrors ?? err.message);
      setError(err.message);
      const byField = {};
      for (const fe of err.fieldErrors ?? []) {
        if (fe.field) byField[fe.field] = fe.message;
      }
      setFieldErrors(byField);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Publicá lo que necesitás</h1>
        <p className="mt-1 text-muted-foreground">
          Otros productores y vecinos van a poder verlo y contactarte.
        </p>
      </div>

      {missingPhone && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Tu cuenta no tiene teléfono cargado. Agregalo en tu perfil antes de publicar, así te
          pueden contactar.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">¿Qué necesitás? *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Envases de vidrio para dulces"
          />
          {fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Elegí una categoría" />
            </SelectTrigger>
            <SelectContent>
              {(meta?.categories ?? []).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.category && <p className="text-sm text-destructive">{fieldErrors.category}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad *</Label>
            <Input
              id="quantity"
              type="number"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
            />
            {fieldErrors.quantity && <p className="text-sm text-destructive">{fieldErrors.quantity}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unidad *</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger id="unit">
                <SelectValue placeholder="Elegí una unidad" />
              </SelectTrigger>
              <SelectContent>
                {(meta?.stockUnits ?? []).map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.unit && <p className="text-sm text-destructive">{fieldErrors.unit}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frecuencia *</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger id="frequency">
              <SelectValue placeholder="Elegí una frecuencia" />
            </SelectTrigger>
            <SelectContent>
              {(meta?.needFrequencies ?? []).map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.frequency && <p className="text-sm text-destructive">{fieldErrors.frequency}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            placeholder="Algún detalle extra que sirva para que te contacten mejor"
          />
          {fieldErrors.description && (
            <p className="text-sm text-destructive">{fieldErrors.description}</p>
          )}
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? "Publicando…" : "Publicar necesidad"}
        </Button>
      </form>
    </main>
  );
}
