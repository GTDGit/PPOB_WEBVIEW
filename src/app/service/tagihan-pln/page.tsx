"use client";

import { useState, useCallback, Suspense } from "react";
import { Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { postpaidInquiry, postpaidPay } from "@/lib/api/postpaid";
import { goBack, notifyTransactionComplete } from "@/lib/bridge";
import { getApiErrorMessage, cn } from "@/lib/utils";
import ServiceHeader from "@/components/layout/ServiceHeader";
import IdNumberInput from "@/components/transaction/IdNumberInput";
import BillSummary from "@/components/transaction/BillSummary";
import TransactionResult from "@/components/transaction/TransactionResult";
import PinEntry from "@/components/transaction/PinEntry";
import type {
  PostpaidInquiryResponse,
  PostpaidPayResponse,
} from "@/lib/types/api";

type Step = "input" | "bill" | "pin" | "processing" | "result";

function TagihanPlnContent() {
  useAuth();

  const [step, setStep] = useState<Step>("input");
  const [meterId, setMeterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const [inquiry, setInquiry] = useState<PostpaidInquiryResponse | null>(null);
  const [result, setResult] = useState<PostpaidPayResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const handleInquiry = async () => {
    if (meterId.length < 11 || meterId.length > 12) {
      setError("Nomor meter harus 11-12 digit");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await postpaidInquiry({
        serviceType: "pln_postpaid",
        target: meterId,
      });
      if (!data.inquiry.targetValid || !data.inquiry.inquiryId) {
        setError(data.inquiry.errorMessage || "Nomor meter tidak valid");
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

  const handleConfirmPay = () => {
    setStep("pin");
  };

  const handlePay = useCallback(
    async (pin?: string) => {
      setStep("processing");
      setPinError(null);
      try {
        const data = await postpaidPay({
          inquiryId: inquiry!.inquiry.inquiryId!,
          pin,
        });
        setResult(data);
        setStep("result");
        notifyTransactionComplete({
          transactionId: data.transaction.transactionId,
          status: data.transaction.status,
          amount: data.payment.totalPayment,
        });
      } catch (err) {
        const msg = getApiErrorMessage(err);
        const axiosErr = err as { response?: { data?: { error?: { code?: string } } } };
        if (axiosErr.response?.data?.error?.code === "INVALID_PIN") {
          setPinError(msg);
          setStep("pin");
          return;
        }
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

  const handleRetry = () => {
    setStep("input");
    setError(null);
    setResultError(null);
    setInquiry(null);
  };

  const headerTitle: Record<string, string> = {
    input: "Tagihan PLN",
    bill: "Detail Tagihan",
    pin: "Konfirmasi",
  };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {step !== "result" && step !== "processing" && (
        <ServiceHeader title={headerTitle[step] || "Tagihan PLN"} onBack={handleBack} />
      )}

      {step === "input" && (
        <div className="flex-1 px-5 pt-6">
          <IdNumberInput
            label="Nomor Meter / ID Pelanggan"
            placeholder="Masukkan 11-12 digit"
            value={meterId}
            onChange={(v) => { setMeterId(v); setError(null); }}
            onSubmit={handleInquiry}
            error={error}
            maxLength={12}
            icon={<Zap size={18} className="text-[var(--color-text-secondary)]" />}
          />
          <button
            onClick={handleInquiry}
            disabled={loading || meterId.length < 11}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-white mt-6 transition-colors flex items-center justify-center gap-2",
              loading || meterId.length < 11
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)]"
            )}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Memuat..." : "Cek Tagihan"}
          </button>
        </div>
      )}

      {step === "bill" && inquiry && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 px-5 pt-4 pb-4 overflow-y-auto">
            <BillSummary
              customer={inquiry.inquiry.customer}
              bill={inquiry.bill}
              targetLabel="No. Meter"
              targetNumber={meterId}
            />
          </div>
          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleConfirmPay}
              className="w-full h-12 rounded-xl font-semibold text-white bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)] flex items-center justify-center gap-2"
            >
              Bayar {inquiry.bill.totalAmountFormatted}
            </button>
          </div>
        </div>
      )}

      {step === "pin" && (
        <PinEntry onSubmit={handlePinSubmit} onCancel={() => setStep("bill")} isLoading={loading} error={pinError || undefined} />
      )}

      {step === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <Loader2 size={48} className="animate-spin text-[var(--color-primary)] mb-4" />
          <p className="text-base font-semibold text-[var(--color-text-primary)]">Memproses Pembayaran</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Mohon tunggu sebentar...</p>
        </div>
      )}

      {step === "result" && (
        <TransactionResult
          success={!!result && !resultError}
          title={result?.message?.title}
          subtitle={resultError || result?.message?.subtitle}
          onRetry={resultError ? handleRetry : undefined}
          receiptRows={
            result
              ? [
                  { label: "No. Meter", value: result.target.number },
                  ...(result.target.customerName ? [{ label: "Nama", value: result.target.customerName }] : []),
                  { label: "Total", value: result.payment.totalPaymentFormatted, highlight: true },
                  { label: "Saldo", value: result.payment.balanceAfterFormatted },
                  ...(result.receipt?.referenceNumber ? [{ label: "Ref", value: result.receipt.referenceNumber, mono: true }] : []),
                ]
              : undefined
          }
        />
      )}
    </div>
  );
}

export default function TagihanPlnPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--color-primary)]" /></div>}>
      <TagihanPlnContent />
    </Suspense>
  );
}
