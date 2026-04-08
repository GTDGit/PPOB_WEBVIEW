"use client";

import type { PricingInfo } from "@/lib/types/api";

interface PricingBreakdownProps {
  pricing: PricingInfo;
}

export default function PricingBreakdown({ pricing }: PricingBreakdownProps) {
  return (
    <div className="p-4 rounded-xl border border-[var(--color-border)]">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
        Rincian Pembayaran
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Harga</span>
          <span>{pricing.productPriceFormatted}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Biaya Admin</span>
          <span>{pricing.adminFeeFormatted}</span>
        </div>
        {pricing.totalDiscount > 0 && (
          <div className="flex justify-between text-sm text-[var(--color-success)]">
            <span>Diskon</span>
            <span>-{pricing.totalDiscountFormatted}</span>
          </div>
        )}
        <div className="border-t border-[var(--color-border)] pt-2 mt-2 flex justify-between">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-base font-bold text-[var(--color-primary)]">
            {pricing.totalPaymentFormatted}
          </span>
        </div>
      </div>
    </div>
  );
}
