// TopBlur — progressive frosted glass blur at viewport top
"use client";

import { cn } from "@/lib/utils";

interface TopBlurProps {
  layers?: number;
  className?: string;
}

export function TopBlur({ layers = 6, className }: TopBlurProps) {
  return (
    <div className={cn("top-blur", className)} aria-hidden="true">
      {Array.from({ length: layers }, (_, i) => i + 1).map((layer) => (
        <div
          key={layer}
          className={cn("top-blur__panel", `top-blur__panel--${layer}`)}
        />
      ))}
    </div>
  );
}
