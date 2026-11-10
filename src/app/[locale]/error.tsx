"use client"; // Error boundaries must be Client Components

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";

/**
 * Shown when a page fails to render (inside the site layout, so header, footer and language
 * switch stay usable). Nothing is reported anywhere: the demo has no error service.
 */
export default function PageError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("errors");
  const lang = useFallbackLang();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      data-surface="dark"
      className="flex min-h-[70svh] items-end pt-[calc(var(--header-h)+env(safe-area-inset-top)+4rem)] pb-16"
    >
      <div className="container-page">
        <p className="label text-label" lang={lang("errors.eyebrow")}>
          {t("eyebrow")}
        </p>
        <h1 className="display-xl mt-5 max-w-[16ch] text-balance" lang={lang("errors.title")}>
          {t("title")}
        </h1>
        <p className="body-lg mt-6 max-w-xl text-muted-foreground" lang={lang("errors.line")}>
          {t("line")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => retry()}>
            <RotateCcw aria-hidden />
            <span lang={lang("errors.retry")}>{t("retry")}</span>
          </Button>
          <Button asChild variant="outline">
            <Link href="/" lang={lang("errors.home")}>
              {t("home")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
