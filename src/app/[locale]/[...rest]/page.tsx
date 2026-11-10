import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/metadata";

// Unknown paths inside a locale render the localized not-found page. Its title and description
// are set here: metadata exported from not-found.tsx is not applied.
export const generateMetadata = () => pageMetadata("notFound");

export default function CatchAll() {
  notFound();
}
