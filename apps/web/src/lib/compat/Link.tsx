import React from "react";
import { Link as RouterLink, type LinkProps } from "react-router-dom";

interface CompatLinkProps extends Omit<LinkProps, "to"> {
  href: string | { pathname?: string };
  to?: LinkProps["to"];
}

function normalizePath(raw: string): string {
  // Strip legacy /ar or /en prefix if present
  const stripped = raw.replace(/^\/(ar|en)(?=\/|$)/, "");
  return stripped || "/";
}

export default function Link({ href, to, ...rest }: CompatLinkProps) {
  const raw = typeof href === "string" ? href : href?.pathname || "/";
  const target = to ?? normalizePath(raw);
  return <RouterLink to={target} {...rest} />;
}
