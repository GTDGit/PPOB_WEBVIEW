"use client";

import { useState, useCallback, Suspense } from "react";
import { Building2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { transferInquiry, transferExecute } from "@/lib/api/transfer";
import { goBack, notifyTransactionComplete } from "@/lib/bridge";
import { formatRupiah, getApiErrorMessage, cn } from "@/lib/utils";
import ServiceHeader from "@/components/layout/ServiceHeader";
import ProviderSelector from "@/components/transaction/ProviderSelector";
import PricingBreakdown from "@/components/transaction/PricingBreakdown";
import TransactionResult from "@/components/transaction/TransactionResult";
import PinEntry from "@/components/transaction/PinEntry";
import type { ProviderOption } from "@/components/transaction/ProviderSelector";
import type { TransferInquiryResponse, TransferExecuteResponse } from "@/lib/types/api";

const BANKS: ProviderOption[] = [
  { id: "bca", name: "BCA" },
  { id: "bni", name: "BNI" },
  { id: "bri", name: "BRI" },
  { id: "mandiri", name: "Mandiri" },
  { id: "cimb", name: "CIMB Niaga" },
  { id: "danamon", name: "Danamon" },
  { id: "permata", name: "Permata" },
  { id: "bsi", name: "BSI" },
  { id: "btn", name: "BTN" },
];

type Step = "bank" | "input" | "verify" | "pin" | "processing" | "result";

function TransferBankContent() {
  useAuth();

  const [step, setStep] = useState<Step>("bank");
  const [bank, setBank] = useState<ProviderOption | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const [inquiry, setInquiry] = useState<TransferInquiryResponse | null>(null);
  const [result, setResult] = useState<TransferExecuteResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const handleSelectBank = (p: ProviderOption) => {
    setBank(p);
    setStep("input");
  };

  const parsedAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;

  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setAmount(digits);
    setError(null);
  };

  const handleInquiry = async () => {
    if (accountNumber.length < 5) {
      setError("Nomor rekening minimal 5 digit");
      return;
    }
    if (parsedAmount < 10000) {
      setError("Minimal transfer Rp10.000");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await transferInquiry({
        bankCode: bank!.id,
        accountNumber,
        amount: parsedAmount,
      });
      setInquiry(data);
      setStep("verify");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPay = () => {
    if (inquiry?.pinRequired) {
      setStep("pin");
    } else {
      handleExecute();
    }
  };

  const handleExecute = useCallback(
    async (pin?: string) => {
      setStep("processing");
      setPinError(null);
      try {
        const data = await transferExecute({
          inquiryId: inquiry!.inquiry.inquiryId,
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

  const handlePinSubmit = useCallback((pin: string) => { handleExecute(pin); }, [handleExecute]);

  const handleBack = () => {
    setError(null);
    switch (step) {
      case "input": setStep("bank"); break;
      case "verify": setStep("input"); break;
      case "pin": setStep("verify"); break;
      default: goBack();
    }
  };

  const handleRetry = () => {
    setStep("bank");
    setError(null);
    setResultError(null);
    setInquiry(null);
    setBank(null);
    setAccountNumber("");
    setAmount("");
  };

  const headerTitle: Record<string, string> = {
    bank: "Transfer Bank",
    input: bank?.name || "Transfer",
    verify: "Verifikasi",
    pin: "Konfirmasi",
  };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {step !== "result" && step !== "processing" && (
        <ServiceHeader title={headerTitle[step] || "Transfer Bank"} onBack={handleBack} />
      )}

      {/* Step: Select Bank */}
      {step === "bank" && (
        <div className="flex-1 px-5 pt-6">
          <ProviderSelector
            label="Pilih Bank Tujuan"
            providers={BANKS}
            selectedId={bank?.id}
            onSelect={handleSelectBank}
          />
        </div>
      )}

      {/* Step: Input Account + Amount */}
      {step === "input" && (
        <div className="flex-1 px-5 pt-6">
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-accent-soft)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Building2 size={16} className="text-[var(--color-primary)]" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{bank?.name}</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">
                Nomor Rekening
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Masukkan nomor rekening"
                value={accountNumber}
                onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "")); setError(null); }}
                className="w-full h-12 px-4 rounded-xl border border-[var(--color-border)] bg-white text-base outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">
                Nominal Transfer
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] text-sm font-medium">Rp</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0"
                  value={parsedAmount > 0 ? parsedAmount.toLocaleString("id-ID") : ""}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInquiry()}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-[var(--color-border)] bg-white text-base outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
              {parsedAmount > 0 && parsedAmount < 10000 && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">Minimal Rp10.000</p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-[var(--color-error)] mt-3">{error}</p>}

          <button
            onClick={handleInquiry}
            disabled={loading || accountNumber.length < 5 || parsedAmount < 10000}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-white mt-6 transition-colors flex items-center justify-center gap-2",
              loading || accountNumber.length < 5 || parsedAmount < 10000
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)]"
            )}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Memuat..." : "Lanjutkan"}
          </button>
        </div>
      )}

      {/* Step: Verify Account Name */}
      {step === "verify" && inquiry && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 px-5 pt-4 pb-4 overflow-y-auto">
            <div className="p-4 rounded-xl bg-[var(--color-accent-soft)] mb-4">
              <p className="text-sm text-[var(--color-text-secondary)]">Transfer ke</p>
              <p className="text-base font-semibold text-[var(--color-text-primary)] mt-0.5">
                {inquiry.inquiry.accountName}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {inquiry.inquiry.bankName} - {inquiry.inquiry.accountNumber}
              </p>
              <p className="text-lg font-bold text-[var(--color-primary)] mt-2">
                {inquiry.inquiry.amountFormatted}
              </p>
            </div>

            <PricingBreakdown pricing={inquiry.pricing} />

            <div className="mt-3 p-3 rounded-xl border border-[var(--color-border)]">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)]">Saldo</p>
                  <p className="text-sm font-semibold">{inquiry.payment.balanceAvailableFormatted}</p>
                </div>
                {!inquiry.payment.balanceSufficient && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-[var(--color-error)] font-medium">
                    Saldo tidak cukup
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleConfirmPay}
              disabled={!inquiry.payment.balanceSufficient || loading}
              className={cn(
                "w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors",
                !inquiry.payment.balanceSufficient || loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)]"
              )}
            >
              Transfer {inquiry.pricing.totalPaymentFormatted}
            </button>
          </div>
        </div>
      )}

      {step === "pin" && (
        <PinEntry onSubmit={handlePinSubmit} onCancel={() => setStep("verify")} isLoading={loading} error={pinError || undefined} />
      )}

      {step === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <Loader2 size={48} className="animate-spin text-[var(--color-primary)] mb-4" />
          <p className="text-base font-semibold text-[var(--color-text-primary)]">Memproses Transfer</p>
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
                  { label: "Bank", value: result.transfer.bankName },
                  { label: "Rekening", value: result.transfer.accountNumber },
                  { label: "Nama", value: result.transfer.accountName },
                  { label: "Nominal", value: result.transfer.amountFormatted },
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

export default function TransferBankPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--color-primary)]" /></div>}>
      <TransferBankContent />
    </Suspense>
  );
}
