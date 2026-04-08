"use client";

import { cn } from "@/lib/utils";

export interface ProviderOption {
  id: string;
  name: string;
  iconUrl?: string;
  icon?: string;
}

interface ProviderSelectorProps {
  label: string;
  providers: ProviderOption[];
  selectedId?: string | null;
  onSelect: (provider: ProviderOption) => void;
}

export default function ProviderSelector({
  label,
  providers,
  selectedId,
  onSelect,
}: ProviderSelectorProps) {
  return (
    <div>
      <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-[0.97]",
              selectedId === p.id
                ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]"
                : "border-[var(--color-border)] bg-white"
            )}
          >
            {p.iconUrl ? (
              <img src={p.iconUrl} alt={p.name} className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-[var(--color-text-secondary)]">
                {p.icon || p.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium text-[var(--color-text-primary)] text-center leading-tight">
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
