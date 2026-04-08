"use client";

import { useState, useCallback, Suspense } from "react";
import { ArrowLeft, Phone, Loader2, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { prepaidInquiry, prepaidOrder, prepaidPay } from "@/lib/api/prepaid";
import { goBack, notifyTransactionComplete } from "@/lib/bridge";
import { formatRupiah, cleanPhone, isValidPhone, getApiErrorMessage, cn } from "@/lib/utils";
import PinEntry from "@/components/transaction/PinEntry";
import type {
  ProductInfo,
  PrepaidOrderResponse,
  PrepaidPayResponse,
  OperatorInfo,
} from "@/lib/types/api";

type Step = "input" | "products" | "confirm" | "pin" | "processing" | "result";

function PulsaContent() {
  useAuth();

  const [step, setStep] = useState<Step>("input");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  // Inquiry state
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [operator, setOperator] = useState<OperatorInfo | null>(null);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);

  // Order state
  const [orderData, setOrderData] = useState<PrepaidOrderResponse | null>(null);

  // Result state
  const [result, setResult] = useState<PrepaidPayResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const handlePhoneChange = (value: string) => {
    const clean = value.replace(/[^0-9]/g, "");
    setPhone(clean);
    setError(null);
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
        serviceType: "pulsa",
        target: cleanPhone(phone),
      });
      if (!data.inquiry.targetValid || !data.inquiry.inquiryId) {
        setError(data.inquiry.errorMessage || "Nomor tidak valid");
        setLoading(false);
        return;
      }
      setInquiryId(data.inquiry.inquiryId);
      setOperator(data.inquiry.operator || null);
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
          pin: pin,
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
        // Check if PIN error
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

  const handlePinSubmit = useCallback(
    (pin: string) => {
      handlePay(pin);
    },
    [handlePay]
  );

  const handleBack = () => {
    setError(null);
    switch (step) {
      case "products":
        setStep("input");
        break;
      case "confirm":
        setStep("products");
        break;
      case "pin":
        setStep("confirm");
        break;
      default:
        goBack();
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {/* Header */}
      {step !== "result" && step !== "processing" && (
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="flex items-center h-14 px-4">
            <button onClick={handleBack} className="p-1 -ml-1 rounded-full active:bg-gray-100">
              <ArrowLeft size={22} className="text-[var(--color-primary)]" />
            </button>
            <h1 className="ml-3 text-base font-semibold text-[var(--color-text-primary)]">
              {step === "input" && "Pulsa"}
              {step === "products" && "Pilih Nominal"}
              {step === "confirm" && "Konfirmasi"}
              {step === "pin" && "Konfirmasi"}
            </h1>
          </div>
        </header>
      )}

      {/* Step: Input */}
      {step === "input" && (
        <div className="flex-1 px-5 pt-6">
          <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">
            Nomor Handphone
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Phone size={18} className="text-[var(--color-text-secondary)]" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="08xxxxxxxxxx"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInquiry()}
              maxLength={13}
              className={cn(
                "w-full h-12 pl-10 pr-4 rounded-xl border text-base outline-none transition-colors",
                error
                  ? "border-[var(--color-error)] bg-red-50"
                  : "border-[var(--color-border)] bg-white focus:border-[var(--color-primary)]"
              )}
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--color-error)] mt-2">{error}</p>
          )}

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

      {/* Step: Product Grid */}
      {step === "products" && (
        <div className="flex-1 px-5 pt-4 pb-4 overflow-y-auto">
          {/* Target info */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--color-accent-soft)]">
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <Phone size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{phone}</p>
              {operator && (
                <p className="text-xs text-[var(--color-text-secondary)]">{operator.name}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => {
                const hasDiscount = product.discount && product.discount.value > 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    disabled={loading}
                    className={cn(
                      "p-3.5 rounded-xl border text-left transition-all active:scale-[0.97]",
                      selectedProduct?.id === product.id
                        ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]"
                        : "border-[var(--color-border)] bg-white"
                    )}
                  >
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">
                      {product.name}
                    </p>
                    <div className="mt-1.5">
                      {hasDiscount ? (
                        <>
                          <p className="text-xs line-through text-[var(--color-text-secondary)]">
                            {product.discount!.originalPriceFormatted}
                          </p>
                          <p className="text-sm font-semibold text-[var(--color-primary)]">
                            {product.discount!.priceAfterDiscountFormatted}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-[var(--color-primary)]">
                          {product.priceFormatted}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && orderData && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 px-5 pt-4 pb-4 overflow-y-auto">
            {/* Product info */}
            <div className="p-4 rounded-xl bg-[var(--color-accent-soft)] mb-4">
              <p className="text-sm text-[var(--color-text-secondary)]">Produk</p>
              <p className="text-base font-semibold text-[var(--color-text-primary)] mt-0.5">
                {orderData.product.name}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {orderData.target.number}
                {orderData.target.operator && ` - ${orderData.target.operator.name}`}
              </p>
            </div>

            {/* Pricing */}
            <div className="p-4 rounded-xl border border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                Rincian Pembayaran
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Harga</span>
                  <span>{orderData.pricing.productPriceFormatted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Biaya Admin</span>
                  <span>{orderData.pricing.adminFeeFormatted}</span>
                </div>
                {orderData.pricing.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-[var(--color-success)]">
                    <span>Diskon</span>
                    <span>-{orderData.pricing.totalDiscountFormatted}</span>
                  </div>
                )}
                <div className="border-t border-[var(--color-border)] pt-2 mt-2 flex justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-base font-bold text-[var(--color-primary)]">
                    {orderData.pricing.totalPaymentFormatted}
                  </span>
                </div>
              </div>
            </div>

            {/* Balance info */}
            <div className="mt-3 p-3 rounded-xl border border-[var(--color-border)]">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)]">Saldo</p>
                  <p className="text-sm font-semibold">{orderData.payment.balanceAvailableFormatted}</p>
                </div>
                {!orderData.payment.balanceSufficient && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-[var(--color-error)] font-medium">
                    Saldo tidak cukup
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleConfirmPay}
              disabled={!orderData.payment.balanceSufficient || loading}
              className={cn(
                "w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors",
                !orderData.payment.balanceSufficient || loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)]"
              )}
            >
              Bayar {orderData.pricing.totalPaymentFormatted}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step: PIN */}
      {step === "pin" && (
        <PinEntry
          onSubmit={handlePinSubmit}
          onCancel={() => setStep("confirm")}
          isLoading={loading}
          error={pinError || undefined}
        />
      )}

      {/* Step: Processing */}
      {step === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <Loader2 size={48} className="animate-spin text-[var(--color-primary)] mb-4" />
          <p className="text-base font-semibold text-[var(--color-text-primary)]">
            Memproses Pembayaran
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Mohon tunggu sebentar...
          </p>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && (
        <div className="flex-1 flex flex-col items-center px-5 pt-16">
          {result && !resultError ? (
            <>
              <div className="w-16 h-16 rounded-full bg-[var(--color-success-soft)] flex items-center justify-center mb-4">
                <CheckCircle2 size={36} className="text-[var(--color-success)]" />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {result.message?.title || "Transaksi Berhasil"}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 text-center">
                {result.message?.subtitle || "Pembelian pulsa berhasil diproses"}
              </p>

              {/* Receipt */}
              <div className="w-full mt-6 p-4 rounded-xl border border-[var(--color-border)]">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Produk</span>
                    <span className="font-medium">{result.product.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Nomor</span>
                    <span className="font-medium">{result.target.number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Total</span>
                    <span className="font-semibold text-[var(--color-primary)]">
                      {result.payment.totalPaymentFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Saldo</span>
                    <span>{result.payment.balanceAfterFormatted}</span>
                  </div>
                  {result.receipt?.serialNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">SN</span>
                      <span className="font-mono text-xs">{result.receipt.serialNumber}</span>
                    </div>
                  )}
                  {result.receipt?.referenceNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">Ref</span>
                      <span className="font-mono text-xs">{result.receipt.referenceNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => goBack()}
                className="w-full h-12 rounded-xl font-semibold text-white bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)] mt-6"
              >
                Selesai
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <XCircle size={36} className="text-[var(--color-error)]" />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                Transaksi Gagal
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 text-center px-4">
                {resultError || "Terjadi kesalahan saat memproses pembayaran"}
              </p>
              <button
                onClick={() => {
                  setStep("input");
                  setError(null);
                  setResultError(null);
                  setSelectedProduct(null);
                  setOrderData(null);
                }}
                className="w-full h-12 rounded-xl font-semibold text-[var(--color-primary)] border border-[var(--color-primary)] mt-6 active:bg-[var(--color-accent-soft)]"
              >
                Coba Lagi
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
        </div>
      }
    >
      <PulsaContent />
    </Suspense>
  );
}
