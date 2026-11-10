import { getTranslations } from "next-intl/server";
import { Marquee } from "@/components/motion/marquee";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { cn } from "@/lib/utils";

/**
 * Slim campaign band (Home after the statement, About before the footer).
 * raised: one step lighter than charcoal, so the band reads as its own strip.
 */
export async function MarqueeBand({ raised = false }: { raised?: boolean }) {
  const t = await getTranslations("home");
  const lang = await getFallbackLang();
  return (
    <div
      data-surface="dark"
      className={cn("border-y border-border py-5 md:py-7", raised && "bg-card")}
      lang={lang("home.marquee")}
    >
      <Marquee
        items={t("marquee").split("|")}
        speed={50}
        itemClassName="display-marquee"
        separator={<span aria-hidden className="mx-[0.6em] inline-block size-[0.6rem] shrink-0 rounded-full bg-primary md:size-3" />}
      />
    </div>
  );
}
