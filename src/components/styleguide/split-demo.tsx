"use client";

import { RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type SplitDemoProps = {
  /** SplitTextReveal lines, rendered by the (server) styleguide page. */
  children: ReactNode;
  replayLabel: string;
};

/** Styleguide only: replays the SplitTextReveal lines by remounting them. */
export function SplitDemo({ children, replayLabel }: SplitDemoProps) {
  const [run, setRun] = useState(0);
  return (
    <div className="space-y-6">
      <div key={run} className="space-y-4">
        {children}
      </div>
      <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
        <RotateCcw aria-hidden />
        {replayLabel}
      </Button>
    </div>
  );
}
