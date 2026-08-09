import type { CryptoFeedResponse } from "@/lib/crypto-feed";

export async function fetchCrypto(signal?: AbortSignal): Promise<CryptoFeedResponse> {
  const response = await fetch("/api/crypto", { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Crypto request failed");
  return response.json() as Promise<CryptoFeedResponse>;
}
