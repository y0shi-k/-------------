export const USER_GEMINI_API_KEY_STORAGE_KEY = "stock-master:user-gemini-api-key";
export const USER_GEMINI_API_KEY_FREE_STORAGE_KEY = "stock-master:user-gemini-api-key:free";
export const USER_GEMINI_API_KEY_PAID_STORAGE_KEY = "stock-master:user-gemini-api-key:paid";

export type UserGeminiApiKeys = {
  free: string;
  paid: string;
};

export function loadUserGeminiApiKey() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem(USER_GEMINI_API_KEY_FREE_STORAGE_KEY) ??
    window.localStorage.getItem(USER_GEMINI_API_KEY_STORAGE_KEY) ??
    ""
  );
}

export function loadUserGeminiApiKeys(): UserGeminiApiKeys {
  if (typeof window === "undefined") return { free: "", paid: "" };
  return {
    free: loadUserGeminiApiKey(),
    paid: window.localStorage.getItem(USER_GEMINI_API_KEY_PAID_STORAGE_KEY) ?? ""
  };
}

export function saveUserGeminiApiKey(apiKey: string) {
  if (typeof window === "undefined") return;
  const trimmed = apiKey.trim();
  if (trimmed) {
    window.localStorage.setItem(USER_GEMINI_API_KEY_FREE_STORAGE_KEY, trimmed);
    return;
  }
  clearUserGeminiApiKey();
}

export function saveUserPaidGeminiApiKey(apiKey: string) {
  if (typeof window === "undefined") return;
  const trimmed = apiKey.trim();
  if (trimmed) {
    window.localStorage.setItem(USER_GEMINI_API_KEY_PAID_STORAGE_KEY, trimmed);
    return;
  }
  clearUserPaidGeminiApiKey();
}

export function clearUserGeminiApiKey() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_GEMINI_API_KEY_FREE_STORAGE_KEY);
  window.localStorage.removeItem(USER_GEMINI_API_KEY_STORAGE_KEY);
}

export function clearUserPaidGeminiApiKey() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_GEMINI_API_KEY_PAID_STORAGE_KEY);
}
