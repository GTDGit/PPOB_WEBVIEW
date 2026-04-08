"use client";

import { ArrowLeft } from "lucide-react";
import { goBack } from "@/lib/bridge";

interface ServiceHeaderProps {
  title: string;
  onBack?: () => void;
}

export default function ServiceHeader({ title, onBack }: ServiceHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="flex items-center h-14 px-4">
        <button
          onClick={onBack || goBack}
          className="p-1 -ml-1 rounded-full active:bg-gray-100"
        >
          <ArrowLeft size={22} className="text-[var(--color-primary)]" />
        </button>
        <h1 className="ml-3 text-base font-semibold text-[var(--color-text-primary)]">
          {title}
        </h1>
      </div>
    </header>
  );
}
