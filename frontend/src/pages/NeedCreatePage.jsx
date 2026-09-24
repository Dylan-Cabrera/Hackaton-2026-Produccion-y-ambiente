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
import { createNeed } from "@/lib/api";
import { CATEGORIES, NEED_FREQUENCIES } from "@/lib/constants";

export default function NeedCreatePage() {
  const { status } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [frequency, setFrequency] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Publicar necesidad · Mercado Km 0";
  }, []);

  // Sin sesión no se puede publicar (HU-11: "Redirige a login").
  useEffect(() => {
    if (status === "anonymous") navigate("/login");
  }, [status, navigate]);

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
        unit: unit.trim(),
        frequency,
        description: description.trim() || null,
      });
      navigate(`/necesidades/${need.id}`);
    } catch (err) {
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
          Otros productores van a poder verlo y contactarte por WhatsApp.
        </p>
      </div>

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
              {CATEGORIES.map((c) => (
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
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="kg, unidades, litros…"
            />
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
              {NEED_FREQUENCIES.map((f) => (
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
