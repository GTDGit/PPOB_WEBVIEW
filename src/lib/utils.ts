import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRupiah(amount: number): string {
  if (amount === 0) return "Rp0";
  return "Rp" + amount.toLocaleString("id-ID");
}

export function formatPhone(phone: string): string {
  // Format: 0812-3456-7890
  const clean = phone.replace(/\D/g, "");
  if (clean.length <= 4) return clean;
  if (clean.length <= 8) return clean.slice(0, 4) + "-" + clean.slice(4);
  return (
    clean.slice(0, 4) + "-" + clean.slice(4, 8) + "-" + clean.slice(8, 13)
  );
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isValidPhone(phone: string): boolean {
  const clean = cleanPhone(phone);
  return clean.length >= 10 && clean.length <= 13 && clean.startsWith("08");
}

export function getApiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    // Axios error
    const axiosErr = error as { response?: { data?: { error?: { message?: string } } } };
    if (axiosErr.response?.data?.error?.message) {
      return axiosErr.response.data.error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan. Silakan coba lagi.";
}
