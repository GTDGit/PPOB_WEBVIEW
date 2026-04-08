import apiClient from "./client";
import type {
  ApiResponse,
  TransferInquiryRequest,
  TransferInquiryResponse,
  TransferExecuteRequest,
  TransferExecuteResponse,
} from "../types/api";

export async function transferInquiry(
  data: TransferInquiryRequest
): Promise<TransferInquiryResponse> {
  const res = await apiClient.post<ApiResponse<TransferInquiryResponse>>(
    "/v1/transfer/inquiry",
    data
  );
  return res.data.data;
}

export async function transferExecute(
  data: TransferExecuteRequest
): Promise<TransferExecuteResponse> {
  const res = await apiClient.post<ApiResponse<TransferExecuteResponse>>(
    "/v1/transfer/execute",
    data
  );
  return res.data.data;
}
