"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductInfo } from "@/lib/types/api";

interface ProductGridProps {
  products: ProductInfo[];
  selectedId?: string | null;
  loading?: boolean;
  onSelect: (product: ProductInfo) => void;
}

export default function ProductGrid({
  products,
  selectedId,
  loading,
  onSelect,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product) => {
        const hasDiscount = product.discount && product.discount.value > 0;
        return (
          <button
            key={product.id}
            onClick={() => onSelect(product)}
            disabled={loading}
            className={cn(
              "p-3.5 rounded-xl border text-left transition-all active:scale-[0.97]",
              selectedId === product.id
                ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]"
                : "border-[var(--color-border)] bg-white"
            )}
          >
            <p className="text-sm font-bold text-[var(--color-text-primary)]">
              {product.name}
            </p>
            <div className="mt-1.5">
              {hasDiscount ? (
                <>
                  <p className="text-xs line-through text-[var(--color-text-secondary)]">
                    {product.discount!.originalPriceFormatted}
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-primary)]">
                    {product.discount!.priceAfterDiscountFormatted}
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-[var(--color-primary)]">
                  {product.priceFormatted}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
