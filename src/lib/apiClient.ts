import { BACKEND_URL, CSRF_COOKIE, CSRF_HEADER } from "./config";

const isBrowser = typeof window !== "undefined";

// Store CSRF token in memory as fallback when cookies don't work (cross-origin)
let csrfTokenCache: string | null = null;

const readCookie = (name: string) => {
  if (!isBrowser) return undefined;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")[1];
};

const ensureCsrfToken = async () => {
  if (!isBrowser) return;

  // Always fetch a fresh CSRF token to ensure it's valid
  const response = await fetch(`${BACKEND_URL}/auth/csrf`, { credentials: "include" });

  if (!response.ok) {
    console.error("Failed to fetch CSRF token");
    return;
  }

  // Try to read from cookie first (if CORS allows)
  const tokenFromCookie = readCookie(CSRF_COOKIE);
  if (tokenFromCookie) {
    csrfTokenCache = tokenFromCookie;
    console.log("CSRF token from cookie:", tokenFromCookie.substring(0, 10) + "...");
    return;
  }

  // If cookie not set (CORS issue), read from response body
  try {
    const data = await response.json();
    if (data.csrfToken) {
      csrfTokenCache = data.csrfToken;
      console.log("CSRF token from response body:", data.csrfToken.substring(0, 10) + "...");
    } else {
      console.error("No csrfToken in response:", data);
    }
  } catch (error) {
    console.error("Failed to parse CSRF response:", error);
  }
};

// Allow plain objects for body, which we'll JSON.stringify
type ApiBody =
  | Record<string, any>  // Plain objects - most common case
  | FormData
  | string
  | Blob
  | ArrayBuffer
  | ArrayBufferView
  | URLSearchParams
  | ReadableStream<Uint8Array>
  | null
  | undefined;

// Define ApiOptions without extending RequestInit to avoid type conflicts
interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
  keepalive?: boolean;
  mode?: RequestMode;
  signal?: AbortSignal;
  csrf?: boolean;
  body?: ApiBody;
}

export const apiFetch = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const { csrf = options.method && options.method !== "GET", headers, body, ...rest } = options;

  const initHeaders: Record<string, string> = {
    ...(headers as Record<string, string> ?? {}),
  };

  let requestBody: RequestInit["body"] = undefined;

  if (body != null) {
    if (body instanceof FormData) {
      requestBody = body;
    } else if (typeof body === "string") {
      requestBody = body;
    } else if (body instanceof Blob || body instanceof ArrayBuffer || body instanceof URLSearchParams || body instanceof ReadableStream) {
      requestBody = body as RequestInit["body"];
    } else {
      // Handle plain objects (Record<string, any>)
      requestBody = JSON.stringify(body);
      initHeaders["Content-Type"] = "application/json";
    }
  }

  const init: RequestInit = {
    ...rest,
    method: options.method ?? "GET",
    credentials: "include",
    headers: initHeaders,
    body: requestBody,
  };

  if (csrf && isBrowser) {
    await ensureCsrfToken();
    // Try cookie first, then fallback to cache
    const token = readCookie(CSRF_COOKIE) || csrfTokenCache;
    if (token) {
      console.log("Sending CSRF token:", token.substring(0, 10) + "...");
      init.headers = {
        ...init.headers,
        [CSRF_HEADER]: token,
      };
    } else {
      console.error("No CSRF token available!");
    }
  }

  const res = await fetch(`${BACKEND_URL}${path}`, init);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  return text as T;
};

export const swrFetcher = <T>(path: string) => apiFetch<T>(path, { csrf: false });
