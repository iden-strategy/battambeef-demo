"use client";

import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { cursorTarget } from "@/components/motion/cursor-target";
import { Button } from "@/components/ui/button";

type RecipeDialogProps = {
  /** Visible button text ("View recipe") and its accessible name ("View recipe: Beef lok lak"). */
  open: { text: string; label: string; lang?: string };
  close: { text: string; lang?: string };
  title: { text: string; lang?: string };
  /** The recipe, rendered on the server. */
  children: ReactNode;
};

/**
 * "View recipe" on a recipe card and the recipe it opens. Radix Dialog gives the focus trap,
 * Escape, scroll lock and focus return. The button's overlay covers the whole card, so the card
 * is one tap target (inside the carousel, a drag or a tap on a side card never opens it).
 */
export function RecipeDialog({ open, close, title, children }: RecipeDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          variant="link"
          aria-label={open.label}
          lang={open.lang}
          className="h-11 after:absolute after:inset-0 after:z-20 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-ring"
          {...cursorTarget("view")}
        >
          {open.text}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-fade fixed inset-0 z-[80] bg-brand-charcoal/85" />
        <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6">
          <Dialog.Content
            data-surface="dark"
            aria-describedby={undefined}
            className="dialog-rise pointer-events-auto relative max-h-full w-full max-w-3xl overflow-y-auto overscroll-contain rounded-2xl bg-card p-6 shadow-2xl sm:p-8 md:p-10"
          >
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={close.text}
                lang={close.lang}
                className="absolute top-3 right-3 z-10 bg-brand-charcoal/70 hover:bg-brand-charcoal"
              >
                <X />
              </Button>
            </Dialog.Close>
            <Dialog.Title className="title-lg pe-12 [--fs:clamp(1.75rem,1.3rem+2vw,3rem)]" lang={title.lang}>
              {title.text}
            </Dialog.Title>
            {children}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
