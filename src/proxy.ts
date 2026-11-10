import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip Next internals, the robots file and anything with a file extension (images, fonts).
  matcher: ["/((?!_next|_vercel|robots\\.txt|.*\\..*).*)"],
};
