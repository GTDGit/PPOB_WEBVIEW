"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface PinEntryProps {
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function PinEntry({
  onSubmit,
  onCancel,
  isLoading,
  error,
}: PinEntryProps) {
  const [pin, setPin] = useState("");
  const maxLength = 6;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (pin.length === maxLength) {
      onSubmit(pin);
    }
  }, [pin, onSubmit]);

  const handleKey = (digit: string) => {
    if (pin.length < maxLength) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md pb-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Masukkan PIN
          </h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} className="text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 py-6">
          {Array.from({ length: maxLength }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-colors ${
                i < pin.length
                  ? "bg-[var(--color-primary)]"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-sm text-[var(--color-error)] mb-2 px-5">
            {error}
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <p className="text-center text-sm text-[var(--color-text-secondary)] mb-2">
            Memproses...
          </p>
        )}

        {/* Hidden input for keyboard */}
        <input
          ref={inputRef}
          type="tel"
          className="opacity-0 absolute"
          maxLength={maxLength}
          value={pin}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, maxLength);
            setPin(v);
          }}
        />

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-1 px-8">
          {digits.map((d, i) => {
            if (d === "") return <div key={i} />;
            if (d === "del") {
              return (
                <button
                  key={i}
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="h-14 flex items-center justify-center rounded-xl active:bg-gray-100 text-[var(--color-text-secondary)]"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 19-7-7 7-7" />
                    <path d="M19 12H5" />
                  </svg>
                </button>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handleKey(d)}
                disabled={isLoading}
                className="h-14 text-xl font-medium rounded-xl active:bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]"
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
