export type ApiErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
};

export class ApiClientError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiPost<TResponse, TBody = unknown>(
  url: string,
  body: TBody,
  init?: RequestInit,
): Promise<TResponse> {
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };

  const response = await fetch(url, {
    method: "POST",
    headers: mergedHeaders,
    body: JSON.stringify(body),
    ...init,
  });

  const parsed = (await parseJsonSafe(response)) as ApiErrorPayload | TResponse | null;

  if (!response.ok) {
    const payload = (parsed && typeof parsed === "object" ? parsed : undefined) as
      | ApiErrorPayload
      | undefined;

    const errorMessage =
      payload?.error ||
      payload?.message ||
      `Request failed with status ${response.status}`;

    throw new ApiClientError(response.status, errorMessage, payload);
  }

  return (parsed || {}) as TResponse;
}

export async function apiGet<TResponse>(url: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(url, {
    method: "GET",
    ...init,
  });

  const parsed = (await parseJsonSafe(response)) as ApiErrorPayload | TResponse | null;

  if (!response.ok) {
    const payload = (parsed && typeof parsed === "object" ? parsed : undefined) as
      | ApiErrorPayload
      | undefined;

    const errorMessage =
      payload?.error ||
      payload?.message ||
      `Request failed with status ${response.status}`;

    throw new ApiClientError(response.status, errorMessage, payload);
  }

  return (parsed || {}) as TResponse;
}
