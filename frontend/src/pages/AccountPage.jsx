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

// Edición de cuenta para cualquier rol que no sea PRODUCER (esos ya tienen su
// propia pantalla en /mis-productos, con los campos del emprendimiento incluidos).
export default function AccountPage() {
  const { user, status, updateProfile } = useAuth();
  const { meta } = useMeta();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [locality, setLocality] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.title = "Mi cuenta · Formosa Unida";
  }, []);

  useEffect(() => {
    if (status === "anonymous") navigate("/login");
    else if (status === "authenticated" && user?.role === "PRODUCER") navigate("/mis-productos");
  }, [status, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setLocality(user.locality ?? "");
    setOrganizationName(user.organizationName ?? "");
    setInstitutionType(user.institutionType ?? "");
  }, [user]);

  if (status !== "authenticated" || user?.role === "PRODUCER") {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  const isInstitution = user.accountType === "INSTITUCION";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSaved(false);
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        locality: locality || undefined,
        ...(isInstitution && {
          organizationName: organizationName.trim(),
          institutionType,
        }),
      });
      setSaved(true);
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
        <h1 className="text-3xl font-bold tracking-tight">Mi cuenta</h1>
        <p className="mt-1 text-muted-foreground">{user.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">{isInstitution ? "Nombre del referente" : "Nombre y apellido"}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
        </div>

        {isInstitution && (
          <>
            <div className="space-y-2">
              <Label htmlFor="organizationName">Nombre de la institución</Label>
              <Input
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
              {fieldErrors.organizationName && (
                <p className="text-sm text-destructive">{fieldErrors.organizationName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="institutionType">Tipo de institución</Label>
              <Select value={institutionType} onValueChange={setInstitutionType}>
                <SelectTrigger id="institutionType">
                  <SelectValue />
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
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <p className="text-xs text-muted-foreground">Lo vas a necesitar si publicás una necesidad.</p>
          {fieldErrors.phone && <p className="text-sm text-destructive">{fieldErrors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="locality">Localidad</Label>
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
        {saved && <p className="text-sm text-primary">Guardado.</p>}

        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </main>
  );
}
