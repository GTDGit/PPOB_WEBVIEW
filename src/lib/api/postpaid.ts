import apiClient from "./client";
import type {
  ApiResponse,
  PostpaidInquiryRequest,
  PostpaidInquiryResponse,
  PostpaidPayRequest,
  PostpaidPayResponse,
} from "../types/api";

export async function postpaidInquiry(
  data: PostpaidInquiryRequest
): Promise<PostpaidInquiryResponse> {
  const res = await apiClient.post<ApiResponse<PostpaidInquiryResponse>>(
    "/v1/postpaid/inquiry",
    data
  );
  return res.data.data;
}

export async function postpaidPay(
  data: PostpaidPayRequest
): Promise<PostpaidPayResponse> {
  const res = await apiClient.post<ApiResponse<PostpaidPayResponse>>(
    "/v1/postpaid/pay",
    data
  );
  return res.data.data;
}
