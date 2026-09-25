import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductImageField from "@/components/ProductImageField";
import ToggleOfferSwitch from "@/components/ToggleOfferSwitch";
import { useMeta } from "@/hooks/useMeta";
import { createProduct, updateProduct } from "@/lib/api";

// Valores del formulario: vacíos para un producto nuevo, o los del producto a editar
function initialValues(product, defaultCategory) {
  return {
    title: product?.title ?? "",
    description: product?.description ?? "",
    category: product?.category ?? defaultCategory ?? "",
    price: product ? String(product.price) : "",
    stockUnit: product?.stockUnit ?? "",
    imageUrl: product?.imageUrl ?? "",
    isOffer: product?.isOffer ?? false,
    offerPrice: product?.offerPrice != null ? String(product.offerPrice) : "",
  };
}

// Alta y edición de un producto con el mismo formulario.
// Sin `product` crea uno nuevo (POST); con `product` lo edita (PATCH) y el form arranca precargado.
// `trigger` es el botón que abre el diálogo.
export default function ProductFormModal({ product, defaultCategory, onSaved, trigger }) {
  const isEdit = Boolean(product);
  const { meta } = useMeta();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(() => initialValues(product, defaultCategory));
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field) => (value) => setValues((v) => ({ ...v, [field]: value }));

  // Cada vez que se abre, el form arranca de cero (alta) o con los datos actuales (edición)
  function handleOpenChange(next) {
    if (next) {
      setValues(initialValues(product, defaultCategory));
      setError("");
    }
    setOpen(next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { title, description, category, price, stockUnit, imageUrl, isOffer, offerPrice } = values;
    if (!title.trim() || !price || !stockUnit) {
      setError("Completá título, precio y unidad de stock.");
      return;
    }
    if (isOffer && !offerPrice) {
      setError("Si marcás oferta, cargá el precio promocional.");
      return;
    }
    if (isOffer && Number(offerPrice) >= Number(price)) {
      setError("El precio promocional tiene que ser menor al precio normal.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      // El productor dueño sale de la sesión en el backend. Si no elegís
      // categoría, el backend usa la de tu propio perfil.
      const data = {
        title: title.trim(),
        ...(category && { category }),
        price: Number(price),
        isOffer,
        ...(isOffer ? { offerPrice: Number(offerPrice) } : {}),
        stockUnit,
      };
      let saved;
      if (isEdit) {
        // En la edición, null borra la descripción o la imagen si el productor las vació
        saved = await updateProduct(product.id, {
          ...data,
          description: description.trim() || null,
          imageUrl: imageUrl.trim() || null,
        });
      } else {
        saved = await createProduct({
          ...data,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        });
      }
      onSaved(saved);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const idPrefix = isEdit ? `edit-${product.id}-` : "new-";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}title`}>Título del producto *</Label>
            <Input
              id={`${idPrefix}title`}
              value={values.title}
              onChange={(e) => set("title")(e.target.value)}
              placeholder="Mandioca fresca"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}category`}>Categoría</Label>
            <Select value={values.category} onValueChange={set("category")}>
              <SelectTrigger id={`${idPrefix}category`}>
                <SelectValue placeholder="Usar el rubro de mi perfil" />
              </SelectTrigger>
              <SelectContent>
                {(meta?.categories ?? []).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}price`}>Precio *</Label>
              <Input
                id={`${idPrefix}price`}
                type="number"
                inputMode="numeric"
                value={values.price}
                onChange={(e) => set("price")(e.target.value)}
                placeholder="1200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}stockUnit`}>Unidad *</Label>
              <Select value={values.stockUnit} onValueChange={set("stockUnit")}>
                <SelectTrigger id={`${idPrefix}stockUnit`}>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}description`}>Descripción (opcional)</Label>
            <textarea
              id={`${idPrefix}description`}
              value={values.description}
              onChange={(e) => set("description")(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <ProductImageField
            value={values.imageUrl}
            onChange={set("imageUrl")}
            onUploadingChange={setUploadingImage}
          />

          <ToggleOfferSwitch
            isOffer={values.isOffer}
            offerPrice={values.offerPrice}
            onToggle={set("isOffer")}
            onOfferPriceChange={set("offerPrice")}
          />

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={saving || uploadingImage}>
            {saving
              ? isEdit
                ? "Guardando…"
                : "Publicando…"
              : uploadingImage
                ? "Esperando la imagen…"
                : isEdit
                  ? "Guardar cambios"
                  : "Publicar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
