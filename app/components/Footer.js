"use client";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "../../src/components/ui";

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer");
  const ui = useTranslations("ui");
  const navbar = useTranslations("navbar");
  const year = new Date().getFullYear();

  const withLocale = (path) => {
    const base = path.startsWith("/") ? path : `/${path}`;
    if (base.startsWith("/en") || base.startsWith("/ar")) return base;
    return `/${locale}${base === "/" ? "" : base}`;
  };

  const homeHref = withLocale("/");

  const quickLinks = (t.raw && t.raw("quickLinks")) || [];
  const supportLinks = (t.raw && t.raw("supportLinks")) || [];

  return (
    <footer className="relative w-full text-(--ui-foreground) overflow-hidden border-t border-(--ui-border) bg-(--ui-surface)">
      {/*  الخلفية    */}
      <div className="absolute top-0 left-0 w-full h-1 brand-gradient" />

      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,var(--ui-accent-glow),transparent_35%),radial-gradient(circle_at_85%_80%,color-mix(in_srgb,var(--color-secondary-500)_24%,transparent),transparent_35%)] opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <Card size="sm" className="space-y-4">
            <Link
              href={homeHref}
              className="inline-flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="absolute inset-0 brand-gradient rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-12 h-12 brand-gradient rounded-xl flex items-center justify-center">
                  <span className="text-3xl" aria-label={ui("aria.lungIcon")}>
                    🫁
                  </span>
                </div>
              </div>
              <span className="text-2xl font-black brand-gradient-text">
                {t("brand")}
              </span>
            </Link>
            <p className="text-sm text-(--ui-muted-foreground) leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="flex gap-3">
              {[
                {
                  src: "/icons/facebook.svg",
                  label: t("social.facebook"),
                  href: "https://www.facebook.com",
                },
                {
                  src: "/icons/twitter.svg",
                  label: t("social.twitter"),
                  href: "https://www.twitter.com",
                },
                {
                  src: "/icons/instagram.svg",
                  label: t("social.instagram"),
                  href: "https://www.instagram.com",
                },
                {
                  src: "/icons/linkedin.svg",
                  label: t("social.linkedin"),
                  href: "https://www.linkedin.com",
                },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="ui-future-chip flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <Image
                    src={social.src}
                    alt={social.label}
                    width={22}
                    height={22}
                  />
                </a>
              ))}
            </div>
          </Card>

          {/* Quick Links */}
          <Card size="sm">
            <h3 className="text-lg font-bold mb-4 text-(--ui-foreground)">
              {t("quickLinksHeading")}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={withLocale(link.href)}
                    className="text-(--ui-muted-foreground) hover:text-(--ui-ring) transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-(--ui-ring) group-hover:w-4 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* Support Links */}
          <Card size="sm">
            <h3 className="text-lg font-bold mb-4 text-(--ui-foreground)">
              {t("supportHeading")}
            </h3>
            <ul className="space-y-2">
              {supportLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={withLocale(link.href)}
                    className="text-(--ui-muted-foreground) hover:text-(--ui-ring) transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-(--ui-ring) group-hover:w-4 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* Contact Info */}
          <Card size="sm">
            <h3 className="text-lg font-bold mb-4 text-(--ui-foreground)">
              {t("contactHeading")}
            </h3>
            <ul className="space-y-3 text-sm text-(--ui-muted-foreground)">
              <li className="flex items-start gap-3">
                <span className="text-xl">📧</span>
                <div>
                  <div className="text-(--ui-foreground) font-semibold mb-1">
                    {t("footer.contact.emailLabel")}
                  </div>
                  <a
                    href="mailto:info@detect-ai.com"
                    className="hover:text-(--ui-ring) transition-colors"
                  >
                    info@detect-ai.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">📱</span>
                <div>
                  <div className="text-(--ui-foreground) font-semibold mb-1">
                    {t("footer.contact.phoneLabel")}
                  </div>
                  <a
                    href="tel:+962 788 234 056"
                    className="hover:text-(--ui-ring) transition-colors"
                    dir="ltr"
                  >
                    +962 788 234 056
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <div className="text-(--ui-foreground) font-semibold mb-1">
                    {t("footer.contact.addressLabel")}
                  </div>
                  <p>{t("footer.contact.address")}</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-(--ui-border)">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-(--ui-muted-foreground)">
            <div className="flex items-center gap-2">
              <span>{t("footer.copyright", { year })}</span>
              <span className="hidden sm:inline">•</span>
              <span className="brand-gradient-text font-semibold">
                {navbar("brand")}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-(--ui-success) rounded-full animate-pulse" />
                <span>{t("footer.serviceStatus")}</span>
              </div>
              <div className="text-(--ui-muted-foreground)">
                {t("footer.madeIn")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-(--ui-border-strong) to-transparent" />
    </footer>
  );
}
