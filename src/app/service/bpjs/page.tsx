"use client";

import { useState, useCallback, Suspense } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { postpaidInquiry, postpaidPay } from "@/lib/api/postpaid";
import { goBack, notifyTransactionComplete } from "@/lib/bridge";
import { getApiErrorMessage, cn } from "@/lib/utils";
import ServiceHeader from "@/components/layout/ServiceHeader";
import IdNumberInput from "@/components/transaction/IdNumberInput";
import BillSummary from "@/components/transaction/BillSummary";
import TransactionResult from "@/components/transaction/TransactionResult";
import PinEntry from "@/components/transaction/PinEntry";
import type { PostpaidInquiryResponse, PostpaidPayResponse } from "@/lib/types/api";

const PERIOD_OPTIONS = [
  { value: "1", label: "1 Bulan" },
  { value: "3", label: "3 Bulan" },
  { value: "6", label: "6 Bulan" },
  { value: "12", label: "12 Bulan" },
];

type Step = "input" | "bill" | "pin" | "processing" | "result";

function BpjsContent() {
  useAuth();

  const [step, setStep] = useState<Step>("input");
  const [bpjsNumber, setBpjsNumber] = useState("");
  const [period, setPeriod] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const [inquiry, setInquiry] = useState<PostpaidInquiryResponse | null>(null);
  const [result, setResult] = useState<PostpaidPayResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const handleInquiry = async () => {
    if (bpjsNumber.length !== 13) {
      setError("Nomor BPJS harus tepat 13 digit");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await postpaidInquiry({
        serviceType: "bpjs",
        target: bpjsNumber,
        providerId: period,
      });
      if (!data.inquiry.targetValid || !data.inquiry.inquiryId) {
        setError(data.inquiry.errorMessage || "Nomor BPJS tidak valid");
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
      case "bill": setStep("input"); break;
      case "pin": setStep("bill"); break;
      default: goBack();
    }
  };

  const handleRetry = () => { setStep("input"); setError(null); setResultError(null); setInquiry(null); };

  const headerTitle: Record<string, string> = { input: "BPJS Kesehatan", bill: "Detail Tagihan", pin: "Konfirmasi" };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {step !== "result" && step !== "processing" && (
        <ServiceHeader title={headerTitle[step] || "BPJS Kesehatan"} onBack={handleBack} />
      )}

      {step === "input" && (
        <div className="flex-1 px-5 pt-6">
          <IdNumberInput
            label="Nomor BPJS"
            placeholder="Masukkan 13 digit nomor BPJS"
            value={bpjsNumber}
            onChange={(v) => { setBpjsNumber(v); setError(null); }}
            onSubmit={handleInquiry}
            error={error}
            maxLength={13}
            icon={<ShieldCheck size={18} className="text-[var(--color-text-secondary)]" />}
          />
          <div className="mt-4">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">Periode Pembayaran</label>
            <div className="grid grid-cols-4 gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={cn(
                    "py-2.5 rounded-xl border text-sm font-medium transition-all",
                    period === opt.value
                      ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleInquiry} disabled={loading || bpjsNumber.length !== 13}
            className={cn("w-full h-12 rounded-xl font-semibold text-white mt-6 transition-colors flex items-center justify-center gap-2",
              loading || bpjsNumber.length !== 13 ? "bg-gray-300 cursor-not-allowed" : "bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)]")}>
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Memuat..." : "Cek Tagihan"}
          </button>
        </div>
      )}

      {step === "bill" && inquiry && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 px-5 pt-4 pb-4 overflow-y-auto">
            <BillSummary customer={inquiry.inquiry.customer} bill={inquiry.bill} targetLabel="No. BPJS" targetNumber={bpjsNumber} />
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
            { label: "No. BPJS", value: result.target.number },
            ...(result.target.customerName ? [{ label: "Nama", value: result.target.customerName }] : []),
            { label: "Total", value: result.payment.totalPaymentFormatted, highlight: true },
            { label: "Saldo", value: result.payment.balanceAfterFormatted },
            ...(result.receipt?.referenceNumber ? [{ label: "Ref", value: result.receipt.referenceNumber, mono: true }] : []),
          ] : undefined} />
      )}
    </div>
  );
}

export default function BpjsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--color-primary)]" /></div>}>
      <BpjsContent />
    </Suspense>
  );
}
