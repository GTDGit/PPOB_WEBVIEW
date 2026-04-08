"use client";

import { useState, useCallback, Suspense } from "react";
import { Phone, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { postpaidInquiry, postpaidPay } from "@/lib/api/postpaid";
import { goBack, notifyTransactionComplete } from "@/lib/bridge";
import { getApiErrorMessage, cn, cleanPhone, isValidPhone } from "@/lib/utils";
import ServiceHeader from "@/components/layout/ServiceHeader";
import PhoneInput from "@/components/transaction/PhoneInput";
import BillSummary from "@/components/transaction/BillSummary";
import TransactionResult from "@/components/transaction/TransactionResult";
import PinEntry from "@/components/transaction/PinEntry";
import type {
  PostpaidInquiryResponse,
  PostpaidPayResponse,
} from "@/lib/types/api";

type Step = "input" | "bill" | "pin" | "processing" | "result";

function PulsaPascabayarContent() {
  useAuth();

  const [step, setStep] = useState<Step>("input");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const [inquiry, setInquiry] = useState<PostpaidInquiryResponse | null>(null);
  const [result, setResult] = useState<PostpaidPayResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const handleInquiry = async () => {
    if (!isValidPhone(phone)) {
      setError("Nomor HP tidak valid (10-13 digit, diawali 08)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await postpaidInquiry({
        serviceType: "phone_postpaid",
        target: cleanPhone(phone),
      });
      if (!data.inquiry.targetValid || !data.inquiry.inquiryId) {
        setError(data.inquiry.errorMessage || "Nomor HP tidak valid");
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
    input: "Pulsa Pascabayar",
    bill: "Detail Tagihan",
    pin: "Konfirmasi",
  };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {step !== "result" && step !== "processing" && (
        <ServiceHeader title={headerTitle[step] || "Pulsa Pascabayar"} onBack={handleBack} />
      )}

      {step === "input" && (
        <div className="flex-1 px-5 pt-6">
          <PhoneInput
            value={phone}
            onChange={(v) => { setPhone(v); setError(null); }}
            onSubmit={handleInquiry}
            error={error}
          />
          <button
            onClick={handleInquiry}
            disabled={loading || !isValidPhone(phone)}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-white mt-6 transition-colors flex items-center justify-center gap-2",
              loading || !isValidPhone(phone)
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
              targetLabel="No. HP"
              targetNumber={cleanPhone(phone)}
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
                  { label: "No. HP", value: result.target.number },
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

export default function PulsaPascabayarPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--color-primary)]" /></div>}>
      <PulsaPascabayarContent />
    </Suspense>
  );
}
