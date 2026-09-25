import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// El input de precio promocional solo existe cuando el switch está activo:
// así el formulario no puede enviar offerPrice con isOffer en false.
export default function ToggleOfferSwitch({ isOffer, offerPrice, onToggle, onOfferPriceChange }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="isOffer" className="cursor-pointer">
          ¿Es oferta o excedente de temporada?
        </Label>
        <Switch id="isOffer" checked={isOffer} onCheckedChange={onToggle} />
      </div>
      {isOffer && (
        <div className="mt-4 space-y-2">
          <Label htmlFor="offerPrice">Precio promocional</Label>
          <Input
            id="offerPrice"
            type="number"
            inputMode="numeric"
            value={offerPrice}
            onChange={(e) => onOfferPriceChange(e.target.value)}
            placeholder="Ej: 800"
          />
          <p className="text-xs text-muted-foreground">
            Se mostrará con el badge “Oferta Relámpago”.
          </p>
        </div>
      )}
    </div>
  );
}
