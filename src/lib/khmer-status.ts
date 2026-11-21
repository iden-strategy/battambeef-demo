import type { KhmerTranslationStatus } from "@/lib/data/site";

/** The "Khmer translation is a draft" notice shows on Khmer pages only, and only while the status is "draft". */
export function showKhmerDraftNotice(locale: string, status: KhmerTranslationStatus): boolean {
  return locale === "km" && status === "draft";
}
