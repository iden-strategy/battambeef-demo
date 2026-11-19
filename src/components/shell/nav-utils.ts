export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * aria-current for a top-level menu link: "page" only on the exact page it links to, "true" on a
 * page inside its section (e.g. For Business on /business/cuts). The visual highlight follows
 * isActivePath, so it looks the same in both cases.
 */
export function navCurrent(pathname: string, href: string): "page" | "true" | undefined {
  if (pathname === href) return "page";
  return isActivePath(pathname, href) ? "true" : undefined;
}
