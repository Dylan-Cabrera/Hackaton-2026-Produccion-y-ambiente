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
import ToggleOfferSwitch from "@/components/ToggleOfferSwitch";
import { createProduct } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";

export default function ProductCreateModal({ producerId, defaultCategory, onCreated }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(defaultCategory ?? "");
  const [regularPrice, setRegularPrice] = useState("");
  const [stockUnit, setStockUnit] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isOffer, setIsOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !category || !regularPrice) {
      setError("Completá título, categoría y precio.");
      return;
    }
    if (isOffer && !offerPrice) {
      setError("Si marcás oferta, cargá el precio promocional.");
      return;
    }
    setError("");
    // offerPrice solo viaja cuando isOffer está activo.
    const product = await createProduct({
      title: title.trim(),
      producerId,
      category,
      regularPrice: Number(regularPrice),
      isOffer,
      ...(isOffer ? { offerPrice: Number(offerPrice) } : {}),
      stockUnit: stockUnit.trim() || "Sin stock declarado",
      imageUrl: imageUrl.trim() || undefined,
    });
    onCreated(product);
    setOpen(false);
    setTitle("");
    setRegularPrice("");
    setStockUnit("");
    setImageUrl("");
    setIsOffer(false);
    setOfferPrice("");
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
            <Label htmlFor="productCategory">Categoría *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="productCategory">
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="regularPrice">Precio regular *</Label>
              <Input
                id="regularPrice"
                type="number"
                inputMode="numeric"
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                placeholder="1200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockUnit">Stock estimado</Label>
              <Input
                id="stockUnit"
                value={stockUnit}
                onChange={(e) => setStockUnit(e.target.value)}
                placeholder="30 kg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Imagen (URL, opcional)</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

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

          <Button type="submit" className="w-full">
            Publicar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
