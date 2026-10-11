import React from "react";

type AuthPageShellProps = {
  children: React.ReactNode;
  locale: string;
  dir: "rtl" | "ltr";
  background?: React.ReactNode;
};

export function AuthPageShell({ children, locale, dir, background }: AuthPageShellProps) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      dir={dir}
      lang={locale}
    >
      {background}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--ui-accent-glow),transparent_35%),radial-gradient(circle_at_80%_15%,color-mix(in_srgb,var(--color-secondary-500)_24%,transparent),transparent_30%)]"
      />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
