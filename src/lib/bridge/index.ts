export interface BridgeContact {
  name: string;
  phone: string;
}

declare global {
  interface Window {
    PPOBBridge?: {
      pickContact(): string;
      refreshToken(): string;
      goBack(): void;
      close(): void;
      onTransactionComplete(json: string): void;
    };
  }
}

export function isInWebView(): boolean {
  return typeof window !== "undefined" && "PPOBBridge" in window;
}

export function pickContact(): BridgeContact | null {
  if (!isInWebView()) return null;
  try {
    const json = window.PPOBBridge!.pickContact();
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function goBack(): void {
  if (isInWebView()) {
    window.PPOBBridge!.goBack();
  } else {
    window.history.back();
  }
}

export function closeBridge(): void {
  if (isInWebView()) {
    window.PPOBBridge!.close();
  }
}

export function notifyTransactionComplete(data: {
  transactionId: string;
  status: string;
  amount: number;
}): void {
  if (isInWebView()) {
    window.PPOBBridge!.onTransactionComplete(JSON.stringify(data));
  }
}
