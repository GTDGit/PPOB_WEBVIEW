"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { goBack } from "@/lib/bridge";

interface ReceiptRow {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}

interface TransactionResultProps {
  success: boolean;
  title?: string;
  subtitle?: string;
  receiptRows?: ReceiptRow[];
  onRetry?: () => void;
}

export default function TransactionResult({
  success,
  title,
  subtitle,
  receiptRows,
  onRetry,
}: TransactionResultProps) {
  return (
    <div className="flex-1 flex flex-col items-center px-5 pt-16">
      {success ? (
        <>
          <div className="w-16 h-16 rounded-full bg-[var(--color-success-soft)] flex items-center justify-center mb-4">
            <CheckCircle2 size={36} className="text-[var(--color-success)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {title || "Transaksi Berhasil"}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 text-center">
            {subtitle || "Transaksi berhasil diproses"}
          </p>

          {receiptRows && receiptRows.length > 0 && (
            <div className="w-full mt-6 p-4 rounded-xl border border-[var(--color-border)]">
              <div className="space-y-2.5">
                {receiptRows.map((row, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">{row.label}</span>
                    <span
                      className={
                        row.highlight
                          ? "font-semibold text-[var(--color-primary)]"
                          : row.mono
                            ? "font-mono text-xs"
                            : "font-medium"
                      }
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => goBack()}
            className="w-full h-12 rounded-xl font-semibold text-white bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)] mt-6"
          >
            Selesai
          </button>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <XCircle size={36} className="text-[var(--color-error)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            Transaksi Gagal
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 text-center px-4">
            {subtitle || "Terjadi kesalahan saat memproses pembayaran"}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full h-12 rounded-xl font-semibold text-[var(--color-primary)] border border-[var(--color-primary)] mt-6 active:bg-[var(--color-accent-soft)]"
            >
              Coba Lagi
            </button>
          )}
        </>
      )}
    </div>
  );
}
