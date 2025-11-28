import { BACKEND_URL, CSRF_COOKIE, CSRF_HEADER } from "./config";

const isBrowser = typeof window !== "undefined";

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
  const token = readCookie(CSRF_COOKIE);
  if (token) return;
  await fetch(`${BACKEND_URL}/auth/csrf`, { credentials: "include" });
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
    const token = readCookie(CSRF_COOKIE);
    if (token) {
      init.headers = {
        ...init.headers,
        [CSRF_HEADER]: token,
      };
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


