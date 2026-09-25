import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadProductImage } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 5; // mismo límite que el backend (upload-image.ts)

const tabClass = (active) =>
  cn(
    "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
  );

// Imagen del producto: se sube un archivo (queda en el backend y devuelve su URL)
// o se pega un link. En los dos casos el formulario recibe solo la URL final.
export default function ProductImageField({ value, onChange, onUploadingChange }) {
  const [mode, setMode] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  function setUploadingState(next) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo tiene que ser una imagen.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`La imagen no puede superar los ${MAX_SIZE_MB} MB.`);
      return;
    }
    setError("");
    setUploadingState(true);
    try {
      onChange(await uploadProductImage(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingState(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={mode === "url" ? "imageUrl" : undefined}>Imagen (opcional)</Label>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button type="button" className={tabClass(mode === "upload")} onClick={() => setMode("upload")}>
          <Upload className="size-3.5" />
          Subir foto
        </button>
        <button type="button" className={tabClass(mode === "url")} onClick={() => setMode("url")}>
          <Link2 className="size-3.5" />
          Pegar link
        </button>
      </div>

      {mode === "url" && (
        <Input
          id="imageUrl"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
      )}

      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
          <img src={value} alt="Vista previa del producto" className="aspect-[4/3] w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 inline-flex cursor-pointer items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-card"
          >
            <X className="size-3.5" />
            Quitar
          </button>
        </div>
      ) : (
        mode === "upload" && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 disabled:cursor-wait"
        >
          {uploading ? (
            <>
              <Loader2 className="size-7 animate-spin text-primary" />
              Subiendo imagen…
            </>
          ) : (
            <>
              <ImagePlus className="size-7 text-primary" />
              <span className="font-medium text-foreground">Tocá para elegir una foto</span>
              <span className="text-xs">o arrastrala acá · JPG, PNG, WEBP o GIF, hasta {MAX_SIZE_MB} MB</span>
            </>
          )}
        </button>
        )
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
