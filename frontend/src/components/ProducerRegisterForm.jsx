import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProducer } from "@/lib/api";
import { CATEGORIES, DELIVERY_OPTIONS, PAYMENT_METHODS } from "@/lib/constants";

// Formulario de una sola pantalla: el criterio es completarlo en menos de un
// minuto desde el celular, por eso no hay pasos, contraseña ni verificación.
export default function ProducerRegisterForm({ onCreated }) {
  const [businessName, setBusinessName] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = (list, value, setter) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!businessName.trim() || !name.trim() || !category || !phone.trim()) {
      setError("Completá emprendimiento, nombre, rubro y teléfono para continuar.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      // Sin coordinates: todavía no se pide geolocalización en el alta.
      const producer = await createProducer({
        businessName: businessName.trim(),
        name: name.trim(),
        category,
        phone: phone.trim(),
        address: address.trim(),
        paymentMethods,
        deliveryOptions,
      });
      onCreated(producer);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="businessName">Nombre del emprendimiento *</Label>
        <Input
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Chacra La Esperanza"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nombre y apellido *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Marta Gimenez"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Rubro *</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Elegí tu rubro" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono / WhatsApp *</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="5493704000001"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección o barrio</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Colonia Pastoril, Formosa"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Medios de pago</legend>
        {PAYMENT_METHODS.map((m) => (
          <label key={m} className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={paymentMethods.includes(m)}
              onCheckedChange={() => toggle(paymentMethods, m, setPaymentMethods)}
            />
            {m}
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Modalidad de entrega</legend>
        {DELIVERY_OPTIONS.map((d) => (
          <label key={d} className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={deliveryOptions.includes(d)}
              onCheckedChange={() => toggle(deliveryOptions, d, setDeliveryOptions)}
            />
            {d}
          </label>
        ))}
      </fieldset>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        {saving ? "Guardando…" : "Crear mi perfil"}
      </Button>
    </form>
  );
}
