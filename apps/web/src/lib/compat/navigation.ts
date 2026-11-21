import { useCallback, useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";

function normalizePath(raw: string): string {
  const stripped = raw.replace(/^\/(ar|en)(?=\/|$)/, "");
  return stripped || "/";
}

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string) => navigate(normalizePath(href)),
      replace: (href: string) => navigate(normalizePath(href), { replace: true }),
      back: () => navigate(-1),
      refresh: () => window.location.reload(),
      prefetch: async () => {},
    }),
    [navigate],
  );
}

export function usePathname(): string {
  const { pathname } = useLocation();
  return pathname;
}

export function useSearchParams() {
  const [searchParams] = useRouterSearchParams();
  return searchParams;
}

export function useParams() {
  return useRouterParams();
}

export function redirect(href: string): never {
  window.location.replace(normalizePath(href));
  throw new Error(`Redirecting to ${href}`);
}

export function useLocaleRedirect() {
  const navigate = useNavigate();
  return useCallback((href: string) => navigate(normalizePath(href)), [navigate]);
}
