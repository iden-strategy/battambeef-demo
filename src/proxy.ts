import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intl = createMiddleware(routing);

/**
 * Old URLs from before the navigation restructure. Temporary (307) because the structure may
 * still change. Every target is one of these fixed strings: nothing from the request's path or
 * query is copied into it, and the query string is dropped. Unprefixed old URLs (/beef-cuts) get
 * their locale from next-intl first, then match here. A hash on the old link (#loin) is kept by
 * the browser when the target has none.
 */
const MOVED: ReadonlyMap<string, string> = new Map([
  ["/en/farm-to-table", "/en/about#farm-to-table"],
  ["/km/farm-to-table", "/km/about#farm-to-table"],
  ["/en/beef-cuts", "/en/business/cuts"],
  ["/km/beef-cuts", "/km/business/cuts"],
  ["/en/beef-knowledge", "/en/business/knowledge"],
  ["/km/beef-knowledge", "/km/business/knowledge"],
  ["/en/for-business", "/en/business"],
  ["/km/for-business", "/km/business"],
]);

export default function proxy(request: NextRequest) {
  const target = MOVED.get(request.nextUrl.pathname);
  // Only the origin of the request URL is used: `target` is an absolute path.
  if (target) return NextResponse.redirect(new URL(target, request.nextUrl.origin), 307);
  return intl(request);
}

export const config = {
  // Skip Next internals, the robots file and anything with a file extension (images, fonts).
  matcher: ["/((?!_next|_vercel|robots\\.txt|.*\\..*).*)"],
};
