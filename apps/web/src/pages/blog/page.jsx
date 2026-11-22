import React from "react";
import Link from "@/lib/compat/Link";
import { useTranslations } from "@/lib/compat/intl";
import { ContentPageLayout } from "@/components/layouts/ContentPageLayout";
import UnifiedCard from "@/components/ui/UnifiedCard";

export default function BlogPage() {
  const t = useTranslations("blog");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");
  const rawPosts = t.raw("posts");
  const posts = Array.isArray(rawPosts) ? rawPosts : [];

  const safeText = (value) => {
    const v = String(value || "").trim();
    return v ? v : placeholder;
  };

  return (
    <div className="mx-auto max-w-5xl py-6 sm:py-10">
      <ContentPageLayout title={t("title")} subtitle={t("description")}>
        <div className="grid gap-6">
          {posts.map((post, idx) => (
            <UnifiedCard
              key={idx}
              className="rounded-2xl border border-[var(--ui-border)] p-6 transition-all hover:border-[var(--color-primary-500)] hover:shadow-md"
              glass
            >
              <div className="mb-2 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-bold text-[var(--color-primary-500)]">
                  {safeText(post?.title)}
                </h2>
                <span className="text-xs font-semibold text-[var(--ui-muted)]">
                  {safeText(post?.date)}
                </span>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-[var(--ui-foreground)]">
                {safeText(post?.excerpt)}
              </p>
              <span className="inline-block rounded-lg bg-[var(--ui-surface-2)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-500)]">
                {t("comingSoon")}
              </span>
            </UnifiedCard>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl btn-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:opacity-95"
          >
            {t("backHome")}
          </Link>
        </div>
      </ContentPageLayout>
    </div>
  );
}
