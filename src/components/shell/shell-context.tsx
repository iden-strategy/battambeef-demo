"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ShellState = {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
};

const ShellContext = createContext<ShellState | null>(null);

/** Shared shell state: the header menu and the mobile bottom bar both need to know if the menu is open. */
export function ShellProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const value = useMemo(() => ({ menuOpen, setMenuOpen }), [menuOpen]);
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <ShellProvider>");
  return ctx;
}
