"use client";

import { useState, useCallback, Suspense } from "react";
import { Droplets, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { postpaidInquiry, postpaidPay } from "@/lib/api/postpaid";
import { goBack, notifyTransactionComplete } from "@/lib/bridge";
import { getApiErrorMessage, cn } from "@/lib/utils";
import ServiceHeader from "@/components/layout/ServiceHeader";
import IdNumberInput from "@/components/transaction/IdNumberInput";
import ProviderSelector from "@/components/transaction/ProviderSelector";
import BillSummary from "@/components/transaction/BillSummary";
import TransactionResult from "@/components/transaction/TransactionResult";
import PinEntry from "@/components/transaction/PinEntry";
import type { ProviderOption } from "@/components/transaction/ProviderSelector";
import type { PostpaidInquiryResponse, PostpaidPayResponse } from "@/lib/types/api";

const PDAM_REGIONS: ProviderOption[] = [
  { id: "pdam_jakarta", name: "Jakarta" },
  { id: "pdam_surabaya", name: "Surabaya" },
  { id: "pdam_bandung", name: "Bandung" },
  { id: "pdam_semarang", name: "Semarang" },
  { id: "pdam_medan", name: "Medan" },
  { id: "pdam_makassar", name: "Makassar" },
  { id: "pdam_yogyakarta", name: "Yogyakarta" },
  { id: "pdam_denpasar", name: "Denpasar" },
];

type Step = "provider" | "input" | "bill" | "pin" | "processing" | "result";

function PdamContent() {
  useAuth();

  const [step, setStep] = useState<Step>("provider");
  const [region, setRegion] = useState<ProviderOption | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const [inquiry, setInquiry] = useState<PostpaidInquiryResponse | null>(null);
  const [result, setResult] = useState<PostpaidPayResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const handleSelectRegion = (p: ProviderOption) => {
    setRegion(p);
    setStep("input");
  };

  const handleInquiry = async () => {
    if (customerId.length < 6) {
      setError("Nomor pelanggan minimal 6 digit");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await postpaidInquiry({
        serviceType: "pdam",
        target: customerId,
        providerId: region?.id,
      });
      if (!data.inquiry.targetValid || !data.inquiry.inquiryId) {
        setError(data.inquiry.errorMessage || "Nomor pelanggan tidak valid");
        setLoading(false);
        return;
      }
      setInquiry(data);
      setStep("bill");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePay = useCallback(
    async (pin?: string) => {
      setStep("processing");
      setPinError(null);
      try {
        const data = await postpaidPay({ inquiryId: inquiry!.inquiry.inquiryId!, pin });
        setResult(data);
        setStep("result");
        notifyTransactionComplete({ transactionId: data.transaction.transactionId, status: data.transaction.status, amount: data.payment.totalPayment });
      } catch (err) {
        const msg = getApiErrorMessage(err);
        const axiosErr = err as { response?: { data?: { error?: { code?: string } } } };
        if (axiosErr.response?.data?.error?.code === "INVALID_PIN") { setPinError(msg); setStep("pin"); return; }
        setResultError(msg);
        setStep("result");
      }
    },
    [inquiry]
  );

  const handlePinSubmit = useCallback((pin: string) => { handlePay(pin); }, [handlePay]);

  const handleBack = () => {
    setError(null);
    switch (step) {
      case "input": setStep("provider"); break;
      case "bill": setStep("input"); break;
      case "pin": setStep("bill"); break;
      default: goBack();
    }
  };

  const handleRetry = () => { setStep("provider"); setError(null); setResultError(null); setInquiry(null); setRegion(null); setCustomerId(""); };

  const headerTitle: Record<string, string> = { provider: "PDAM", input: region?.name ? `PDAM ${region.name}` : "PDAM", bill: "Detail Tagihan", pin: "Konfirmasi" };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {step !== "result" && step !== "processing" && (
        <ServiceHeader title={headerTitle[step] || "PDAM"} onBack={handleBack} />
      )}

      {step === "provider" && (
        <div className="flex-1 px-5 pt-6">
          <ProviderSelector label="Pilih Wilayah PDAM" providers={PDAM_REGIONS} selectedId={region?.id} onSelect={handleSelectRegion} />
        </div>
      )}

      {step === "input" && (
        <div className="flex-1 px-5 pt-6">
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-accent-soft)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center"><Droplets size={16} className="text-[var(--color-primary)]" /></div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">PDAM {region?.name}</span>
          </div>
          <IdNumberInput
            label="Nomor Pelanggan"
            placeholder="Masukkan nomor pelanggan"
            value={customerId}
            onChange={(v) => { setCustomerId(v); setError(null); }}
            onSubmit={handleInquiry}
            error={error}
            icon={<Droplets size={18} className="text-[var(--color-text-secondary)]" />}
          />
          <button onClick={handleInquiry} disabled={loading || customerId.length < 6}
            className={cn("w-full h-12 rounded-xl font-semibold text-white mt-6 transition-colors flex items-center justify-center gap-2",
              loading || customerId.length < 6 ? "bg-gray-300 cursor-not-allowed" : "bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)]")}>
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Memuat..." : "Cek Tagihan"}
          </button>
        </div>
      )}

      {step === "bill" && inquiry && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 px-5 pt-4 pb-4 overflow-y-auto">
            <BillSummary customer={inquiry.inquiry.customer} bill={inquiry.bill} targetLabel="No. Pelanggan" targetNumber={customerId} />
          </div>
          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            <button onClick={() => setStep("pin")} className="w-full h-12 rounded-xl font-semibold text-white bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)] flex items-center justify-center gap-2">
              Bayar {inquiry.bill.totalAmountFormatted}
            </button>
          </div>
        </div>
      )}

      {step === "pin" && <PinEntry onSubmit={handlePinSubmit} onCancel={() => setStep("bill")} isLoading={loading} error={pinError || undefined} />}

      {step === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <Loader2 size={48} className="animate-spin text-[var(--color-primary)] mb-4" />
          <p className="text-base font-semibold text-[var(--color-text-primary)]">Memproses Pembayaran</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Mohon tunggu sebentar...</p>
        </div>
      )}

      {step === "result" && (
        <TransactionResult success={!!result && !resultError} title={result?.message?.title} subtitle={resultError || result?.message?.subtitle} onRetry={resultError ? handleRetry : undefined}
          receiptRows={result ? [
            { label: "Wilayah", value: region?.name || "" },
            { label: "No. Pelanggan", value: result.target.number },
            ...(result.target.customerName ? [{ label: "Nama", value: result.target.customerName }] : []),
            { label: "Total", value: result.payment.totalPaymentFormatted, highlight: true },
            { label: "Saldo", value: result.payment.balanceAfterFormatted },
            ...(result.receipt?.referenceNumber ? [{ label: "Ref", value: result.receipt.referenceNumber, mono: true }] : []),
          ] : undefined} />
      )}
    </div>
  );
}

export default function PdamPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--color-primary)]" /></div>}>
      <PdamContent />
    </Suspense>
  );
}
