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
import { createProduct } from "@/lib/api";

export default function ProductCreateModal({ defaultCategory, onCreated }) {
  const { meta } = useMeta();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaultCategory ?? "");
  const [price, setPrice] = useState("");
  const [stockUnit, setStockUnit] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isOffer, setIsOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !price || !stockUnit) {
      setError("Completá título, precio y unidad de stock.");
      return;
    }
    if (isOffer && !offerPrice) {
      setError("Si marcás oferta, cargá el precio promocional.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      // El productor dueño sale de la sesión en el backend. Si no elegís
      // categoría, el backend usa la de tu propio perfil.
      const product = await createProduct({
        title: title.trim(),
        description: description.trim() || undefined,
        ...(category && { category }),
        price: Number(price),
        isOffer,
        ...(isOffer ? { offerPrice: Number(offerPrice) } : {}),
        stockUnit,
        imageUrl: imageUrl.trim() || undefined,
      });
      onCreated(product);
      setOpen(false);
      setTitle("");
      setDescription("");
      setPrice("");
      setStockUnit("");
      setImageUrl("");
      setIsOffer(false);
      setOfferPrice("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">Publicar producto</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del producto *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mandioca fresca"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productCategory">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="productCategory">
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
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockUnit">Unidad *</Label>
              <Select value={stockUnit} onValueChange={setStockUnit}>
                <SelectTrigger id="stockUnit">
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
            <Label htmlFor="description">Descripción (opcional)</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <ProductImageField
            value={imageUrl}
            onChange={setImageUrl}
            onUploadingChange={setUploadingImage}
          />

          <ToggleOfferSwitch
            isOffer={isOffer}
            offerPrice={offerPrice}
            onToggle={setIsOffer}
            onOfferPriceChange={setOfferPrice}
          />

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={saving || uploadingImage}>
            {saving ? "Publicando…" : uploadingImage ? "Esperando la imagen…" : "Publicar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
