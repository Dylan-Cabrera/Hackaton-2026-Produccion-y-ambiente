import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Filtrado en el backend (GET /api/products?category=&isOffer=). Las categorías
// vienen de /api/meta, no están hardcodeadas acá.
export default function FilterBar({ category, onlyOffers, categories, onCategoryChange, onOnlyOffersChange }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={category === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange("all")}
        >
          Todo
        </Button>
        {categories.map((c) => (
          <Button
            key={c}
            variant={category === c ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(c)}
          >
            {c}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Label htmlFor="onlyOffers" className="cursor-pointer whitespace-nowrap">
          Solo ofertas
        </Label>
        <Switch id="onlyOffers" checked={onlyOffers} onCheckedChange={onOnlyOffersChange} />
      </div>
    </div>
  );
}
