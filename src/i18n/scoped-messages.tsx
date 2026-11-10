import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { pickClientMessages } from "@/i18n/client-messages";

/**
 * Sends extra message sections to the client components inside it only (e.g. "forms" for the
 * enquiry forms), so the rest of the site never downloads them. A nested provider replaces the
 * outer messages, so the site-wide client sections are included again.
 */
export async function ScopedMessages({ namespaces, children }: { namespaces: string[]; children: ReactNode }) {
  const messages = pickClientMessages(await getMessages(), namespaces);
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
