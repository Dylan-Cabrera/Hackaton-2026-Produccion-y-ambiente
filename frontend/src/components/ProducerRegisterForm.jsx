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
import { useMeta } from "@/hooks/useMeta";
import { useUserLocation } from "@/hooks/useUserLocation";
import { DELIVERY_OPTIONS, PAYMENT_METHODS } from "@/lib/constants";

export default function ProducerRegisterForm({ onCreated }) {
  const { register } = useAuth();
  const { meta } = useMeta();
  const { location, status: locationStatus, request: requestLocation } = useUserLocation();

  const [businessName, setBusinessName] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [locality, setLocality] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [deliveryOptions, setDeliveryOptions] = useState([]);
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
      const account = await register({
        role: "PRODUCER",
        businessName: businessName.trim(),
        name: name.trim(),
        category,
        phone: phone.trim(),
        email: email.trim(),
        password,
        locality,
        address: address.trim() || undefined,
        ...(location && { coordinates: [location.lng, location.lat] }),
        paymentMethods,
        deliveryOptions,
      });
      onCreated(account);
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
        <Label htmlFor="businessName">Nombre del emprendimiento *</Label>
        <Input
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Chacra La Esperanza"
        />
        {fieldErrors.businessName && (
          <p className="text-sm text-destructive">{fieldErrors.businessName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nombre y apellido *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Marta Gimenez"
        />
        {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Rubro *</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Elegí tu rubro" />
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
        {fieldErrors.phone && <p className="text-sm text-destructive">{fieldErrors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vos@ejemplo.com"
        />
        {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña *</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
        {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="locality">Localidad *</Label>
        <Select value={locality} onValueChange={setLocality}>
          <SelectTrigger id="locality">
            <SelectValue placeholder="Elegí tu localidad" />
          </SelectTrigger>
          <SelectContent>
            {(meta?.localities ?? []).map((l) => (
              <SelectItem key={l.name} value={l.name}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.locality && <p className="text-sm text-destructive">{fieldErrors.locality}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección o barrio</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Colonia Pastoril, Formosa"
        />
        {fieldErrors.address && <p className="text-sm text-destructive">{fieldErrors.address}</p>}
      </div>

      <div className="space-y-2">
        <Button type="button" variant="outline" onClick={requestLocation} className="gap-2">
          <MapPin className="size-4" />
          {locationStatus === "loading" ? "Buscando ubicación…" : "Usar mi ubicación exacta"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Opcional: si no la das, se usa el centro de tu localidad.
        </p>
        {locationStatus === "granted" && location && (
          <p className="text-sm text-muted-foreground">
            Ubicación lista ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
          </p>
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

      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        {saving ? "Guardando…" : "Crear mi perfil"}
      </Button>
    </form>
  );
}
