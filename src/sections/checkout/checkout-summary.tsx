import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// ----------------------------------------------------------------------

interface CheckoutSummaryProps {
  total: number;
  onEdit?: () => void;
  discount?: number;
  subtotal: number;
  shipping?: number | null;
  onApplyDiscount?: (discount: number) => void;
  discountCode?: string;
  onDiscountCodeChange?: (code: string) => void;
}

export function CheckoutSummary({
  total,
  onEdit,
  discount,
  subtotal,
  shipping,
  onApplyDiscount,
  discountCode = "",
  onDiscountCodeChange,
}: CheckoutSummaryProps) {
  const displayShipping = shipping !== null ? "Free" : "-";

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Order summary</CardTitle>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8">
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Sub total */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Sub total</span>
          <span className="text-sm font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {/* Discount */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Discount</span>
          <span className="text-sm font-medium text-green-600">
            {discount ? `-${formatCurrency(discount)}` : "-"}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Shipping</span>
          <span className="text-sm font-medium">
            {shipping ? formatCurrency(shipping) : displayShipping}
          </span>
        </div>

        <Separator className="my-3 border-dashed" />

        {/* Total */}
        <div className="flex justify-between items-start">
          <span className="text-base font-semibold">Total</span>
          <div className="text-right">
            <span className="text-base font-semibold block text-destructive">
              {formatCurrency(total)}
            </span>
            <span className="text-xs text-muted-foreground italic">
              (VAT included if applicable)
            </span>
          </div>
        </div>

        {/* Discount Code Input */}
        {onApplyDiscount && (
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Discount codes / Gifts"
              value={discountCode}
              onChange={(e) => onDiscountCodeChange?.(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="default"
              onClick={() => onApplyDiscount(5)}
              className="shrink-0"
            >
              Apply
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
