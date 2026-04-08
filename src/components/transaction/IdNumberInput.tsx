"use client";

import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface IdNumberInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string | null;
  minLength?: number;
  maxLength?: number;
  icon?: React.ReactNode;
}

export default function IdNumberInput({
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  error,
  minLength,
  maxLength,
  icon,
}: IdNumberInputProps) {
  const handleChange = (raw: string) => {
    onChange(raw.replace(/[^0-9]/g, ""));
  };

  return (
    <div>
      <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {icon || <Hash size={18} className="text-[var(--color-text-secondary)]" />}
        </div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          maxLength={maxLength}
          className={cn(
            "w-full h-12 pl-10 pr-4 rounded-xl border text-base outline-none transition-colors",
            error
              ? "border-[var(--color-error)] bg-red-50"
              : "border-[var(--color-border)] bg-white focus:border-[var(--color-primary)]"
          )}
        />
      </div>
      {error && (
        <p className="text-sm text-[var(--color-error)] mt-2">{error}</p>
      )}
    </div>
  );
}
