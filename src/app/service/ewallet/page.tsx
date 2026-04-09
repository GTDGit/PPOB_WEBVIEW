"use client";

import { useState, useCallback, Suspense } from "react";
import { Wallet, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { prepaidInquiry, prepaidOrder, prepaidPay } from "@/lib/api/prepaid";
import { goBack, notifyTransactionComplete } from "@/lib/bridge";
import { cleanPhone, isValidPhone, getApiErrorMessage, cn } from "@/lib/utils";
import ServiceHeader from "@/components/layout/ServiceHeader";
import PhoneInput from "@/components/transaction/PhoneInput";
import ProviderSelector from "@/components/transaction/ProviderSelector";
import ProductGrid from "@/components/transaction/ProductGrid";
import ConfirmSheet from "@/components/transaction/ConfirmSheet";
import TransactionResult from "@/components/transaction/TransactionResult";
import PinEntry from "@/components/transaction/PinEntry";
import type { ProviderOption } from "@/components/transaction/ProviderSelector";
import type {
  ProductInfo,
  PrepaidOrderResponse,
  PrepaidPayResponse,
} from "@/lib/types/api";

const EWALLET_PROVIDERS: ProviderOption[] = [
  { id: "gopay", name: "GoPay" },
  { id: "ovo", name: "OVO" },
  { id: "dana", name: "DANA" },
  { id: "shopeepay", name: "ShopeePay" },
  { id: "linkaja", name: "LinkAja" },
];

type Step = "provider" | "input" | "products" | "confirm" | "pin" | "processing" | "result";

function EwalletContent() {
  useAuth();

  const [step, setStep] = useState<Step>("provider");
  const [provider, setProvider] = useState<ProviderOption | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);
  const [orderData, setOrderData] = useState<PrepaidOrderResponse | null>(null);
  const [result, setResult] = useState<PrepaidPayResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const handleSelectProvider = (p: ProviderOption) => {
    setProvider(p);
    setStep("input");
  };

  const handleInquiry = async () => {
    if (!isValidPhone(phone)) {
      setError("Nomor tidak valid. Gunakan format 08xxxxxxxxxx");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await prepaidInquiry({
        serviceType: "ewallet",
        target: cleanPhone(phone),
        providerId: provider?.id,
      });
      if (!data.inquiry.targetValid || !data.inquiry.inquiryId) {
        setError(data.inquiry.errorMessage || "Nomor tidak valid");
        setLoading(false);
        return;
      }
      setInquiryId(data.inquiry.inquiryId);
      setProducts(data.products.filter((p) => p.status === "active"));
      setStep("products");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (product: ProductInfo) => {
    setSelectedProduct(product);
    setLoading(true);
    setError(null);
    try {
      const data = await prepaidOrder({
        inquiryId: inquiryId!,
        productId: product.id,
      });
      setOrderData(data);
      setStep("confirm");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPay = () => {
    if (orderData?.pinRequired) {
      setStep("pin");
    } else {
      handlePay();
    }
  };

  const handlePay = useCallback(
    async (pin?: string) => {
      setStep("processing");
      setPinError(null);
      try {
        const data = await prepaidPay({
          orderId: orderData!.order.orderId,
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
    [orderData]
  );

  const handlePinSubmit = useCallback((pin: string) => { handlePay(pin); }, [handlePay]);

  const handleBack = () => {
    setError(null);
    switch (step) {
      case "input": setStep("provider"); break;
      case "products": setStep("input"); break;
      case "confirm": setStep("products"); break;
      case "pin": setStep("confirm"); break;
      default: goBack();
    }
  };

  const handleRetry = () => {
    setStep("provider");
    setError(null);
    setResultError(null);
    setSelectedProduct(null);
    setOrderData(null);
    setProvider(null);
    setPhone("");
  };

  const headerTitle: Record<string, string> = {
    provider: "E-Wallet",
    input: provider?.name || "E-Wallet",
    products: "Pilih Nominal",
    confirm: "Konfirmasi",
    pin: "Konfirmasi",
  };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {step !== "result" && step !== "processing" && (
        <ServiceHeader title={headerTitle[step] || "E-Wallet"} onBack={handleBack} />
      )}

      {step === "provider" && (
        <div className="flex-1 px-5 pt-6">
          <ProviderSelector
            label="Pilih E-Wallet"
            providers={EWALLET_PROVIDERS}
            selectedId={provider?.id}
            onSelect={handleSelectProvider}
          />
        </div>
      )}

      {step === "input" && (
        <div className="flex-1 px-5 pt-6">
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-accent-soft)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Wallet size={16} className="text-[var(--color-primary)]" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{provider?.name}</span>
          </div>
          <PhoneInput
            value={phone}
            onChange={(v) => { setPhone(v); setError(null); }}
            onSubmit={handleInquiry}
            error={error}
            showOperator={false}
          />
          <button
            onClick={handleInquiry}
            disabled={loading || phone.length < 10}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-white mt-6 transition-colors flex items-center justify-center gap-2",
              loading || phone.length < 10
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)]"
            )}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Memuat..." : "Lanjutkan"}
          </button>
        </div>
      )}

      {step === "products" && (
        <div className="flex-1 px-5 pt-4 pb-4 overflow-y-auto">
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--color-accent-soft)]">
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{phone}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{provider?.name}</p>
            </div>
          </div>
          {error && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 text-sm text-[var(--color-error)]">{error}</div>
          )}
          <ProductGrid products={products} selectedId={selectedProduct?.id} loading={loading} onSelect={handleSelectProduct} />
        </div>
      )}

      {step === "confirm" && orderData && (
        <ConfirmSheet pricing={orderData.pricing} payment={orderData.payment} loading={loading} onConfirm={handleConfirmPay}>
          <div className="p-4 rounded-xl bg-[var(--color-accent-soft)] mb-4">
            <p className="text-sm text-[var(--color-text-secondary)]">{provider?.name}</p>
            <p className="text-base font-semibold text-[var(--color-text-primary)] mt-0.5">{orderData.product.name}</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{orderData.target.number}</p>
          </div>
        </ConfirmSheet>
      )}

      {step === "pin" && (
        <PinEntry onSubmit={handlePinSubmit} onCancel={() => setStep("confirm")} isLoading={loading} error={pinError || undefined} />
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
                  { label: "E-Wallet", value: provider?.name || "" },
                  { label: "Nominal", value: result.product.name },
                  { label: "Nomor", value: result.target.number },
                  { label: "Total", value: result.payment.totalPaymentFormatted, highlight: true },
                  { label: "Saldo", value: result.payment.balanceAfterFormatted },
                  ...(result.receipt?.serialNumber ? [{ label: "SN", value: result.receipt.serialNumber, mono: true }] : []),
                  ...(result.receipt?.referenceNumber ? [{ label: "Ref", value: result.receipt.referenceNumber, mono: true }] : []),
                ]
              : undefined
          }
        />
      )}
    </div>
  );
}

export default function EwalletPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--color-primary)]" /></div>}>
      <EwalletContent />
    </Suspense>
  );
}
