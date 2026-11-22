declare const __VITE_API_URL__: string | undefined;

function getViteApiUrl(): string {
  if (typeof __VITE_API_URL__ === "string" && __VITE_API_URL__) {
    return __VITE_API_URL__;
  }
  const globalEnv = (globalThis as unknown as { __VITE_API_URL__?: string })
    .__VITE_API_URL__;
  if (typeof globalEnv === "string" && globalEnv) {
    return globalEnv;
  }
  if (typeof process !== "undefined" && process.env?.VITE_API_URL) {
    return String(process.env.VITE_API_URL);
  }
  return "";
}

const API_BASE = getViteApiUrl().replace(/\/$/, "");

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function resolveApiUrl(path: string, baseOverride?: string): string {
  const base = (baseOverride !== undefined ? baseOverride : getViteApiUrl() || API_BASE).replace(/\/$/, "");
  if (!path) return base || "/";
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const { timeoutMs, signal: externalSignal, ...fetchOptions } = options;
  const url = resolveApiUrl(path);
  const headers = new Headers(fetchOptions.headers || {});

  if (
    fetchOptions.body &&
    !(fetchOptions.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let controller: AbortController | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let signal = externalSignal;

  if (timeoutMs && timeoutMs > 0) {
    controller = new AbortController();
    signal = controller.signal;
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason);
      } else {
        externalSignal.addEventListener(
          "abort",
          () => controller?.abort(externalSignal.reason),
          { once: true },
        );
      }
    }
    timeoutId = setTimeout(() => {
      controller?.abort(new Error("Request timeout"));
    }, timeoutMs);
  }

  try {
    return await fetch(url, {
      ...fetchOptions,
      headers,
      signal,
      credentials: "include",
    });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw err;
    }
    throw new ApiClientError(
      err instanceof Error ? err.message : "Network error",
      0,
      "network_error",
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await apiFetch(path, options);

  if (response.status === 204 || options.method === "HEAD") {
    if (!response.ok) {
      throw new ApiClientError("Request failed", response.status);
    }
    return undefined as T;
  }

  const text = await response.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const msg =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      (text && text.length < 240 ? text : "") ||
      `HTTP ${response.status}`;
    const code =
      (typeof data?.code === "string" && data.code) ||
      (typeof data?.error === "string" ? data.error : undefined);
    throw new ApiClientError(msg, response.status, code, data?.details);
  }

  return data as T;
}

export interface ApiUploadOptions {
  body: FormData;
  onProgress?: (event: {
    loaded: number;
    total: number;
    percent: number;
  }) => void;
  timeoutMs?: number;
  signal?: AbortSignal;
  onXhrCreated?: (xhr: XMLHttpRequest) => void;
}

export function apiUploadWithProgress<T = unknown>(
  path: string,
  options: ApiUploadOptions,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = resolveApiUrl(path);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;

    if (options.timeoutMs && options.timeoutMs > 0) {
      xhr.timeout = options.timeoutMs;
    }

    if (options.onXhrCreated) {
      options.onXhrCreated(xhr);
    }

    if (options.signal) {
      if (options.signal.aborted) {
        xhr.abort();
        reject(new ApiClientError("Upload aborted", 0, "aborted"));
        return;
      }
      options.signal.addEventListener(
        "abort",
        () => {
          xhr.abort();
        },
        { once: true },
      );
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options.onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        options.onProgress({
          loaded: e.loaded,
          total: e.total,
          percent,
        });
      }
    };

    xhr.onload = () => {
      let data: Record<string, unknown> | null = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        data = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((data ?? {}) as T);
      } else {
        const msg =
          (typeof data?.message === "string" && data.message) ||
          (typeof data?.error === "string" && data.error) ||
          `HTTP ${xhr.status}`;
        const code =
          (typeof data?.code === "string" && data.code) ||
          (typeof data?.error === "string" ? data.error : undefined);
        reject(new ApiClientError(msg, xhr.status, code, data?.details));
      }
    };

    xhr.onerror = () => {
      reject(new ApiClientError("Network upload error", 0, "network_error"));
    };

    xhr.ontimeout = () => {
      reject(new ApiClientError("Upload request timed out", 408, "timeout"));
    };

    xhr.onabort = () => {
      reject(new ApiClientError("Upload canceled", 0, "aborted"));
    };

    xhr.send(options.body);
  });
}
