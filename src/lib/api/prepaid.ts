import apiClient from "./client";
import type {
  ApiResponse,
  InquiryRequest,
  PrepaidInquiryResponse,
  CreateOrderRequest,
  PrepaidOrderResponse,
  PayRequest,
  PrepaidPayResponse,
} from "../types/api";

export async function prepaidInquiry(
  data: InquiryRequest
): Promise<PrepaidInquiryResponse> {
  const res = await apiClient.post<ApiResponse<PrepaidInquiryResponse>>(
    "/v1/prepaid/inquiry",
    data
  );
  return res.data.data;
}

export async function prepaidOrder(
  data: CreateOrderRequest
): Promise<PrepaidOrderResponse> {
  const res = await apiClient.post<ApiResponse<PrepaidOrderResponse>>(
    "/v1/prepaid/order",
    data
  );
  return res.data.data;
}

export async function prepaidPay(
  data: PayRequest
): Promise<PrepaidPayResponse> {
  const res = await apiClient.post<ApiResponse<PrepaidPayResponse>>(
    "/v1/prepaid/pay",
    data
  );
  return res.data.data;
}
