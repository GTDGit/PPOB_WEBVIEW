"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import PricingBreakdown from "./PricingBreakdown";
import type { PricingInfo, PaymentInfo } from "@/lib/types/api";

interface ConfirmSheetProps {
  children: React.ReactNode;
  pricing: PricingInfo;
  payment: PaymentInfo;
  loading?: boolean;
  onConfirm: () => void;
}

export default function ConfirmSheet({
  children,
  pricing,
  payment,
  loading,
  onConfirm,
}: ConfirmSheetProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 px-5 pt-4 pb-4 overflow-y-auto">
        {children}

        <PricingBreakdown pricing={pricing} />

        {/* Balance info */}
        <div className="mt-3 p-3 rounded-xl border border-[var(--color-border)]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-[var(--color-text-secondary)]">Saldo</p>
              <p className="text-sm font-semibold">{payment.balanceAvailableFormatted}</p>
            </div>
            {!payment.balanceSufficient && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-[var(--color-error)] font-medium">
                Saldo tidak cukup
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 py-4 border-t border-gray-100 bg-white">
        <button
          onClick={onConfirm}
          disabled={!payment.balanceSufficient || loading}
          className={cn(
            "w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors",
            !payment.balanceSufficient || loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)]"
          )}
        >
          Bayar {pricing.totalPaymentFormatted}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
