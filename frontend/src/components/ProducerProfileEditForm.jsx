import { useState } from "react";
import { MapPin } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { CATEGORIES, DELIVERY_OPTIONS, PAYMENT_METHODS } from "@/lib/constants";

// Edita el perfil del productor logueado. A diferencia del registro, la
// ubicación es opcional: si no se toca "Actualizar ubicación", se manda la
// que ya tenía guardada.
export default function ProducerProfileEditForm({ producer, onSaved, onCancel }) {
  const { updateProfile } = useAuth();
  const { location, status: locationStatus, request: requestLocation } = useUserLocation();

  const [businessName, setBusinessName] = useState(producer.businessName);
  const [name, setName] = useState(producer.name);
  const [category, setCategory] = useState(producer.category);
  const [phone, setPhone] = useState(producer.phone);
  const [address, setAddress] = useState(producer.address ?? "");
  const [bio, setBio] = useState(producer.bio ?? "");
  const [paymentMethods, setPaymentMethods] = useState(producer.paymentMethods ?? []);
  const [deliveryOptions, setDeliveryOptions] = useState(producer.deliveryOptions ?? []);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const toggle = (list, value, setter) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSaving(true);
    try {
      const payload = {
        businessName: businessName.trim(),
        name: name.trim(),
        category,
        phone: phone.trim(),
        paymentMethods,
        deliveryOptions,
        bio: bio.trim() || null,
      };
      // Solo se manda location si el usuario pidió actualizar la ubicación
      // (o cambió la dirección) para no pisar coordenadas buenas con nada.
      if (location) {
        payload.location = { address: address.trim(), coordinates: [location.lng, location.lat] };
      }

      const updated = await updateProfile(payload);
      onSaved(updated);
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="edit-businessName">Nombre del emprendimiento</Label>
        <Input
          id="edit-businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
        {fieldErrors.businessName && (
          <p className="text-sm text-destructive">{fieldErrors.businessName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-name">Nombre y apellido</Label>
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
        {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-category">Rubro</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="edit-category">
            <SelectValue />
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

      <div className="space-y-2">
        <Label htmlFor="edit-phone">Teléfono / WhatsApp</Label>
        <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {fieldErrors.phone && <p className="text-sm text-destructive">{fieldErrors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-bio">Bio</Label>
        <textarea
          id="edit-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Contá algo sobre tu emprendimiento"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
        />
        {fieldErrors.bio && <p className="text-sm text-destructive">{fieldErrors.bio}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-address">Dirección o barrio</Label>
        <Input id="edit-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Button type="button" variant="outline" size="sm" onClick={requestLocation} className="gap-2">
          <MapPin className="size-4" />
          {locationStatus === "loading" ? "Buscando…" : "Actualizar ubicación"}
        </Button>
        {location && (
          <p className="text-sm text-muted-foreground">
            Nueva ubicación lista ({location.lat.toFixed(4)}, {location.lng.toFixed(4)}) — se
            guarda al confirmar.
          </p>
        )}
        {fieldErrors["location.address"] && (
          <p className="text-sm text-destructive">{fieldErrors["location.address"]}</p>
        )}
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

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
