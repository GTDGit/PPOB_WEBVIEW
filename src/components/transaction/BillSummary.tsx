"use client";

import type { BillInfo, CustomerInfo } from "@/lib/types/api";

interface BillSummaryProps {
  customer?: CustomerInfo | null;
  bill: BillInfo;
  targetLabel?: string;
  targetNumber: string;
}

export default function BillSummary({
  customer,
  bill,
  targetLabel = "No. Pelanggan",
  targetNumber,
}: BillSummaryProps) {
  return (
    <div className="p-4 rounded-xl border border-[var(--color-border)]">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
        Detail Tagihan
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">{targetLabel}</span>
          <span className="font-medium">{targetNumber}</span>
        </div>
        {customer?.name && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Nama</span>
            <span className="font-medium">{customer.name}</span>
          </div>
        )}
        {bill.periodFormatted && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Periode</span>
            <span>{bill.periodFormatted}</span>
          </div>
        )}
        {bill.details.map((row, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Tagihan</span>
          <span>{bill.amountFormatted}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Biaya Admin</span>
          <span>{bill.adminFeeFormatted}</span>
        </div>
        <div className="border-t border-[var(--color-border)] pt-2 mt-2 flex justify-between">
          <span className="text-sm font-semibold">Total Bayar</span>
          <span className="text-base font-bold text-[var(--color-primary)]">
            {bill.totalAmountFormatted}
          </span>
        </div>
      </div>
    </div>
  );
}
