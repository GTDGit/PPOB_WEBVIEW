"use client";

import { Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { pickContact } from "@/lib/bridge";

const OPERATOR_PREFIXES: Record<string, string[]> = {
  Telkomsel: ["0811", "0812", "0813", "0821", "0822", "0823", "0852", "0853"],
  Indosat: ["0814", "0815", "0816", "0855", "0856", "0857", "0858"],
  "XL Axiata": ["0817", "0818", "0819", "0859", "0877", "0878"],
  Axis: ["0831", "0832", "0833", "0838"],
  Tri: ["0895", "0896", "0897", "0898", "0899"],
  Smartfren: ["0881", "0882", "0883", "0884", "0885", "0886", "0887", "0888", "0889"],
  "by.U": ["0851"],
};

function detectOperator(phone: string): string | null {
  if (phone.length < 4) return null;
  const prefix = phone.slice(0, 4);
  for (const [op, prefixes] of Object.entries(OPERATOR_PREFIXES)) {
    if (prefixes.includes(prefix)) return op;
  }
  return null;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string | null;
  showOperator?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  onSubmit,
  error,
  showOperator = true,
}: PhoneInputProps) {
  const operator = showOperator ? detectOperator(value) : null;

  const handleChange = (raw: string) => {
    onChange(raw.replace(/[^0-9]/g, ""));
  };

  const handlePickContact = () => {
    const contact = pickContact();
    if (contact?.phone) {
      const clean = contact.phone.replace(/\D/g, "");
      const normalized = clean.startsWith("62") ? "0" + clean.slice(2) : clean;
      onChange(normalized);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">
        Nomor Handphone
      </label>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Phone size={18} className="text-[var(--color-text-secondary)]" />
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="08xxxxxxxxxx"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            maxLength={13}
            className={cn(
              "w-full h-12 pl-10 pr-4 rounded-xl border text-base outline-none transition-colors",
              error
                ? "border-[var(--color-error)] bg-red-50"
                : "border-[var(--color-border)] bg-white focus:border-[var(--color-primary)]"
            )}
          />
        </div>
        <button
          type="button"
          onClick={handlePickContact}
          className="h-12 w-12 rounded-xl border border-[var(--color-border)] bg-white flex items-center justify-center active:bg-gray-50 shrink-0"
          title="Pilih dari kontak"
        >
          <User size={18} className="text-[var(--color-text-secondary)]" />
        </button>
      </div>
      {operator && (
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-accent-soft)]">
          <span className="text-xs font-medium text-[var(--color-primary)]">{operator}</span>
        </div>
      )}
      {error && (
        <p className="text-sm text-[var(--color-error)] mt-2">{error}</p>
      )}
    </div>
  );
}
