import React from "react";
import { ArrowUpRightIcon, BookOpenIcon } from "lucide-react";
import Link from "@/lib/compat/Link";
import { useTranslations } from "@/lib/compat/intl";
import { ContentPageLayout } from "@/components/layouts/ContentPageLayout";
import { Surface } from "@/components/ui";

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
    <div className="mx-auto max-w-5xl py-6 sm:py-12">
      <ContentPageLayout title={t("title")} subtitle={t("description")}>
        <div className="space-y-8">
          {posts.map((post, idx) => {
            const isLead = idx === 0;
            return (
              <Surface
                key={idx}
                shape={isLead ? "layered" : "editorial"}
                tone={isLead ? "copper" : "default"}
                interactive={isLead}
                className={isLead ? "p-7 sm:p-9" : "pt-6"}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="pd-orb pd-shape-orbital pd-orb--copper mt-0.5 shrink-0">
                      <BookOpenIcon size={20} strokeWidth={1.6} />
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="pd-tabular text-xs font-medium tracking-wider text-[var(--pd-text-muted)]">
                          {safeText(post?.date)}
                        </span>
                        <span className="rounded-full border border-[var(--pd-copper-border)] bg-[var(--pd-copper-soft)] px-3 py-0.5 text-xs font-medium text-[var(--pd-copper)]">
                          {t("comingSoon")}
                        </span>
                      </div>
                      <h2 className="text-xl font-medium tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]">
                        {safeText(post?.title)}
                      </h2>
                      <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--pd-text-secondary)]">
                        {safeText(post?.excerpt)}
                      </p>
                    </div>
                  </div>
                  <span className="hidden shrink-0 text-[var(--pd-copper)] md:inline-flex">
                    <ArrowUpRightIcon size={20} strokeWidth={1.6} />
                  </span>
                </div>
              </Surface>
            );
          })}
        </div>

        <div className="flex justify-center pt-10">
          <Link href="/" className="pd-btn pd-btn--primary">
            {t("backHome")}
          </Link>
        </div>
      </ContentPageLayout>
    </div>
  );
}
