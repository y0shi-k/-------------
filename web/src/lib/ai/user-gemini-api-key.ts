export const USER_GEMINI_API_KEY_STORAGE_KEY = "stock-master:user-gemini-api-key";

export function loadUserGeminiApiKey() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(USER_GEMINI_API_KEY_STORAGE_KEY) ?? "";
}

export function saveUserGeminiApiKey(apiKey: string) {
  if (typeof window === "undefined") return;
  const trimmed = apiKey.trim();
  if (trimmed) {
    window.localStorage.setItem(USER_GEMINI_API_KEY_STORAGE_KEY, trimmed);
    return;
  }
  window.localStorage.removeItem(USER_GEMINI_API_KEY_STORAGE_KEY);
}

export function clearUserGeminiApiKey() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_GEMINI_API_KEY_STORAGE_KEY);
}
