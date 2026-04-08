// API response wrapper
export interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

// ========== Prepaid Inquiry ==========

export interface InquiryRequest {
  serviceType: string;
  target: string;
  providerId?: string;
}

export interface PrepaidInquiryResponse {
  inquiry: InquiryInfo;
  products: ProductInfo[];
  notices: NoticeInfo[];
}

export interface InquiryInfo {
  inquiryId: string | null;
  serviceType: string;
  target: string;
  targetValid: boolean;
  operator?: OperatorInfo;
  customer?: CustomerInfo;
  errorMessage?: string;
  expiresAt?: string;
}

export interface OperatorInfo {
  id: string;
  name: string;
  icon: string;
  iconUrl?: string;
}

export interface CustomerInfo {
  customerId: string;
  name: string;
  segmentPower?: string;
  address?: string;
}

export interface ProductInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  nominal: number;
  price: number;
  priceFormatted: string;
  adminFee: number;
  adminFeeFormatted?: string;
  totalPrice?: number;
  totalPriceFormatted?: string;
  discount: DiscountInfo | null;
  status: string;
  stock: string;
}

export interface DiscountInfo {
  type: string;
  value: number;
  priceAfterDiscount: number;
  priceAfterDiscountFormatted: string;
  originalPrice: number;
  originalPriceFormatted: string;
}

export interface NoticeInfo {
  type: string;
  message: string;
}

// ========== Prepaid Order ==========

export interface CreateOrderRequest {
  inquiryId: string;
  productId: string;
  voucherCodes?: string[];
  contact?: ContactInfo;
}

export interface ContactInfo {
  saveAsContact: boolean;
  contactName: string;
}

export interface PrepaidOrderResponse {
  order: OrderInfo;
  product: OrderProductInfo;
  target: OrderTargetInfo;
  pricing: PricingInfo;
  payment: PaymentInfo;
  pinRequired: boolean;
}

export interface OrderInfo {
  orderId: string;
  status: string;
  serviceType: string;
  createdAt: string;
  expiresAt: string;
}

export interface OrderProductInfo {
  id: string;
  name: string;
  description: string;
  nominal: number;
}

export interface OrderTargetInfo {
  number: string;
  operator?: OperatorInfo;
  customerName?: string;
}

export interface PricingInfo {
  productPrice: number;
  productPriceFormatted: string;
  adminFee: number;
  adminFeeFormatted: string;
  subtotal: number;
  subtotalFormatted: string;
  vouchers: VoucherInfo[];
  totalDiscount: number;
  totalDiscountFormatted: string;
  totalPayment: number;
  totalPaymentFormatted: string;
}

export interface VoucherInfo {
  code: string;
  name: string;
  discount: number;
  discountFormatted: string;
}

export interface PaymentInfo {
  method: string;
  balanceAvailable: number;
  balanceAvailableFormatted: string;
  balanceSufficient: boolean;
  shortfall?: number;
  shortfallFormatted?: string;
}

// ========== Prepaid Pay ==========

export interface PayRequest {
  orderId: string;
  pin?: string;
}

export interface PrepaidPayResponse {
  transaction: TransactionInfo;
  product: TransactionProductInfo;
  target: TransactionTargetInfo;
  payment: TransactionPaymentInfo;
  receipt: ReceiptInfo;
  message: MessageInfo;
}

export interface TransactionInfo {
  transactionId: string;
  orderId: string;
  status: string;
  serviceType: string;
  completedAt?: string;
  estimatedCompletion?: string;
}

export interface TransactionProductInfo {
  id: string;
  name: string;
  nominal: number;
}

export interface TransactionTargetInfo {
  number: string;
  operator?: string;
  customerName?: string;
}

export interface TransactionPaymentInfo {
  totalPayment: number;
  totalPaymentFormatted: string;
  balanceBefore: number;
  balanceAfter: number;
  balanceAfterFormatted: string;
}

export interface ReceiptInfo {
  serialNumber?: string;
  referenceNumber?: string;
  token?: string;
  kwh?: string;
}

export interface MessageInfo {
  title: string;
  subtitle: string;
}
