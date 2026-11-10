import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { SplitTextReveal } from "@/components/motion/split-text-reveal";
import { Button } from "@/components/ui/button";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/metadata";

export const generateMetadata = () => pageMetadata("notFound");

/** 404 in brand style: "Holy Cow. This page isn't here." with ways back in. */
export default async function NotFound() {
  const t = await getTranslations("pages.notFound");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`pages.notFound.${key}`);
  return (
    <section
      data-surface="dark"
      className="flex min-h-[80svh] items-end pt-[calc(var(--header-h)+env(safe-area-inset-top)+4rem)] pb-16 md:pb-24"
    >
      <div className="container-page">
        <Reveal trigger="mount">
          <p className="label tabular text-label" lang={k("label")}>
            {t("label")}
          </p>
        </Reveal>
        <SplitTextReveal
          as="h1"
          text={t("title")}
          lang={k("title")}
          trigger="mount"
          delay={0.1}
          accent="."
          className="display-xl mt-5 max-w-[14ch] text-balance"
        />
        <Reveal trigger="mount" delay={0.35}>
          <p className="body-lg mt-6 max-w-xl text-muted-foreground" lang={k("line")}>
            {t("line")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 md:mt-10">
            <Button asChild size="lg">
              <Link href="/" lang={k("back")}>
                {t("back")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/beef-cuts" lang={k("cuts")}>
                {t("cuts")}
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
