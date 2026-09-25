import { useState } from "react";
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

// accountType: "PERSONA" | "INSTITUCION" (ya elegido en el paso anterior)
export default function ConsumerRegisterForm({ accountType, onCreated }) {
  const { register } = useAuth();
  const { meta } = useMeta();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [phone, setPhone] = useState("");
  const [locality, setLocality] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isInstitution = accountType === "INSTITUCION";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSaving(true);
    try {
      const account = await register({
        role: "CONSUMER",
        accountType,
        name: name.trim(),
        email: email.trim(),
        password,
        ...(isInstitution && {
          organizationName: organizationName.trim(),
          institutionType,
        }),
        ...(phone.trim() && { phone: phone.trim() }),
        ...(locality && { locality }),
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
        <Label htmlFor="name">{isInstitution ? "Nombre del referente *" : "Nombre y apellido *"}</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
      </div>

      {isInstitution && (
        <>
          <div className="space-y-2">
            <Label htmlFor="organizationName">Nombre de la institución *</Label>
            <Input
              id="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Comedor Los Girasoles"
            />
            {fieldErrors.organizationName && (
              <p className="text-sm text-destructive">{fieldErrors.organizationName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="institutionType">Tipo de institución *</Label>
            <Select value={institutionType} onValueChange={setInstitutionType}>
              <SelectTrigger id="institutionType">
                <SelectValue placeholder="Elegí una opción" />
              </SelectTrigger>
              <SelectContent>
                {(meta?.institutionTypes ?? []).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.institutionType && (
              <p className="text-sm text-destructive">{fieldErrors.institutionType}</p>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
        <Label htmlFor="phone">Teléfono (opcional)</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <p className="text-xs text-muted-foreground">Lo vas a necesitar si más adelante publicás una necesidad.</p>
        {fieldErrors.phone && <p className="text-sm text-destructive">{fieldErrors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="locality">Localidad (opcional)</Label>
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

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        {saving ? "Creando cuenta…" : "Crear mi cuenta"}
      </Button>
    </form>
  );
}
