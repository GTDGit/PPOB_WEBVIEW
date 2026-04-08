"use client";

import { useState, useCallback, Suspense } from "react";
import { Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { prepaidInquiry, prepaidOrder, prepaidPay } from "@/lib/api/prepaid";
import { goBack, notifyTransactionComplete } from "@/lib/bridge";
import { getApiErrorMessage, cn } from "@/lib/utils";
import ServiceHeader from "@/components/layout/ServiceHeader";
import IdNumberInput from "@/components/transaction/IdNumberInput";
import ProductGrid from "@/components/transaction/ProductGrid";
import ConfirmSheet from "@/components/transaction/ConfirmSheet";
import TransactionResult from "@/components/transaction/TransactionResult";
import PinEntry from "@/components/transaction/PinEntry";
import type {
  ProductInfo,
  PrepaidOrderResponse,
  PrepaidPayResponse,
  CustomerInfo,
} from "@/lib/types/api";

type Step = "input" | "products" | "confirm" | "pin" | "processing" | "result";

function TokenPlnContent() {
  useAuth();

  const [step, setStep] = useState<Step>("input");
  const [meterId, setMeterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);
  const [orderData, setOrderData] = useState<PrepaidOrderResponse | null>(null);
  const [result, setResult] = useState<PrepaidPayResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const isValidMeter = (v: string) => v.length >= 11 && v.length <= 12;

  const handleInquiry = async () => {
    if (!isValidMeter(meterId)) {
      setError("Nomor meter harus 11-12 digit");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await prepaidInquiry({
        serviceType: "pln_prepaid",
        target: meterId,
      });
      if (!data.inquiry.targetValid || !data.inquiry.inquiryId) {
        setError(data.inquiry.errorMessage || "Nomor meter tidak valid");
        setLoading(false);
        return;
      }
      setInquiryId(data.inquiry.inquiryId);
      setCustomer(data.inquiry.customer || null);
      setProducts(data.products.filter((p) => p.status === "available"));
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
      case "products": setStep("input"); break;
      case "confirm": setStep("products"); break;
      case "pin": setStep("confirm"); break;
      default: goBack();
    }
  };

  const handleRetry = () => {
    setStep("input");
    setError(null);
    setResultError(null);
    setSelectedProduct(null);
    setOrderData(null);
  };

  const headerTitle: Record<string, string> = {
    input: "Token PLN",
    products: "Pilih Nominal",
    confirm: "Konfirmasi",
    pin: "Konfirmasi",
  };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {step !== "result" && step !== "processing" && (
        <ServiceHeader title={headerTitle[step] || "Token PLN"} onBack={handleBack} />
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

      {step === "products" && (
        <div className="flex-1 px-5 pt-4 pb-4 overflow-y-auto">
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--color-accent-soft)]">
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{meterId}</p>
              {customer && (
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {customer.name}
                  {customer.segmentPower && ` - ${customer.segmentPower}`}
                </p>
              )}
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
            <p className="text-sm text-[var(--color-text-secondary)]">Token Listrik</p>
            <p className="text-base font-semibold text-[var(--color-text-primary)] mt-0.5">{orderData.product.name}</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              No. Meter: {orderData.target.number}
              {orderData.target.customerName && ` - ${orderData.target.customerName}`}
            </p>
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
                  { label: "Token", value: result.product.name },
                  { label: "No. Meter", value: result.target.number },
                  { label: "Total", value: result.payment.totalPaymentFormatted, highlight: true },
                  { label: "Saldo", value: result.payment.balanceAfterFormatted },
                  ...(result.receipt?.token ? [{ label: "Token PLN", value: result.receipt.token, mono: true }] : []),
                  ...(result.receipt?.kwh ? [{ label: "kWh", value: result.receipt.kwh }] : []),
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

export default function TokenPlnPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--color-primary)]" /></div>}>
      <TokenPlnContent />
    </Suspense>
  );
}
