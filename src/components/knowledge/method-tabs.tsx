"use client";

import { Tabs } from "radix-ui";
import type { ReactNode } from "react";

export type MethodTab = { id: string; label: string; lang?: string; panel: ReactNode };

/**
 * The cooking method selector: accessible tabs (Radix: arrow keys, Home/End, tab/tabpanel
 * roles). Panels are rendered on the server and passed in. The chip row scrolls inside its own
 * box on small screens (never the page) and wraps from 768px. Panels fade in (no movement).
 */
export function MethodTabs({ methods, label, labelLang }: { methods: MethodTab[]; label: string; labelLang?: string }) {
  return (
    <Tabs.Root defaultValue={methods[0]?.id} className="mt-10 md:mt-14">
      <Tabs.List
        aria-label={label}
        lang={labelLang}
        className="-mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
      >
        {methods.map((m) => (
          <Tabs.Trigger
            key={m.id}
            value={m.id}
            lang={m.lang}
            className="body inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] border-current/40 px-5 font-semibold transition-colors duration-150 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground [@media(hover:hover)]:hover:border-current"
          >
            {m.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {methods.map((m) => (
        <Tabs.Content key={m.id} value={m.id} className="panel-fade mt-8 rounded-2xl focus-visible:outline-offset-4 md:mt-10">
          {m.panel}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
