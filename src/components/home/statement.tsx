import { Snowflake } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { InlinePill } from "@/components/motion/inline-pill";
import { Reveal } from "@/components/motion/reveal";
import { SplitTextReveal, type SplitPart } from "@/components/motion/split-text-reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { getStatementPills } from "@/lib/data";

const STAGGER = 0.026;

/**
 * "LOCAL BEEF ● FROM / BATTAMBANG ● / CHILLED 72 HOURS ●" with round photos between the phrases.
 * The three lines break only from 1024px; narrower screens wrap naturally. In Khmer the pills
 * stay between the same phrases (each phrase is its own message).
 */
export async function Statement() {
  const t = await getTranslations("home.statement");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`home.statement.${key}`);
  const pills = getStatementPills();
  // Pills spring in roughly when the letters before them arrive.
  const delayAfter = (text: string) => text.replace(/\s/g, "").length * STAGGER;
  const ab = `${t("a")}${t("b")}${t("c")}`;

  const text: SplitPart[] = [
    `${t("a")} `,
    { node: <InlinePill src={pills.cow} objectPosition="30% 40%" delay={delayAfter(t("a"))} /> },
    ` ${t("b")} `,
    { br: true, className: "max-lg:hidden" },
    `${t("c")} `,
    { node: <InlinePill src={pills.field} delay={delayAfter(ab)} /> },
    " ",
    { br: true, className: "max-lg:hidden" },
    `${t("d")} `,
    { text: t("e"), className: "text-accent-text" },
    " ",
    {
      node: pills.coldRoom ? (
        <InlinePill src={pills.coldRoom} delay={delayAfter(ab + t("d") + t("e"))} />
      ) : (
        // Placeholder until a cold-room photo exists.
        <InlinePill className="[&_[data-reveal]]:bg-primary" widthEm={1.5} delay={delayAfter(ab + t("d") + t("e"))}>
          <Snowflake aria-hidden className="size-[0.5em] text-primary-foreground" strokeWidth={2.5} />
        </InlinePill>
      ),
    },
  ];

  return (
    <section
      data-surface="dark"
      aria-labelledby="statement-heading"
      className="section flex min-h-[100svh] items-center"
    >
      <div className="container-page text-center">
        <p className="label text-label" lang={k("label")}>
          {t("label")}
        </p>
        <SplitTextReveal
          as="h2"
          id="statement-heading"
          text={text}
          lang={k("a")}
          rise="0.55em"
          tilt={3}
          stagger={STAGGER}
          amount={0.35}
          className="display-statement mx-auto mt-6 max-w-[16ch] text-balance lg:max-w-none"
        />
        <Reveal className="mx-auto mt-10 max-w-xl md:mt-14">
          <p className="body-lg text-muted-foreground" lang={k("body")}>
            {t("body")}
          </p>
          <Button asChild variant="link" className="body mt-5 h-11">
            <Link href="/farm-to-table" lang={k("link")}>
              {t("link")}
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
