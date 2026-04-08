"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Try to open the Android app via deep link
    const appScheme = "ppobid://home";
    const playStoreUrl =
      "https://play.google.com/store/apps/details?id=com.ppobid.app";
    const websiteUrl = "https://ppob.id";

    // Try opening the app
    const start = Date.now();
    window.location.href = appScheme;

    // If still here after 1.5s, app is not installed -> redirect
    setTimeout(() => {
      if (Date.now() - start < 2000) {
        // Check if Play Store is available (Android), otherwise website
        const isAndroid = /android/i.test(navigator.userAgent);
        if (isAndroid) {
          window.location.href = playStoreUrl;
        } else {
          window.location.href = websiteUrl;
        }
      }
    }, 1500);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-white px-6">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center mb-4">
        <span className="text-white text-2xl font-bold">P</span>
      </div>
      <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
        PPOB.ID
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1 text-center">
        Membuka aplikasi...
      </p>
      <p className="text-xs text-[var(--color-text-secondary)] mt-6">
        Belum punya aplikasi?{" "}
        <a href="https://ppob.id" className="text-[var(--color-primary)] font-medium">
          Kunjungi ppob.id
        </a>
      </p>
    </div>
  );
}
