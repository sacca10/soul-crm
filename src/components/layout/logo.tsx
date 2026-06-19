"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Logo de SOUL: isotipo (public/purple.png) + wordmark "SOUL".
 * Si la imagen no está disponible, cae con gracia al wordmark solo
 * (no muestra ícono de imagen rota).
 */
export function Logo({
  className,
  markSize = 28,
  showWordmark = true,
  wordmark = "SOUL",
  wordmarkClassName,
}: {
  className?: string;
  markSize?: number;
  showWordmark?: boolean;
  wordmark?: string;
  wordmarkClassName?: string;
}) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {imgOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/purple.png"
          alt="SOUL"
          style={{ height: markSize, width: "auto" }}
          onError={() => setImgOk(false)}
          className="object-contain"
        />
      )}
      {showWordmark && (
        <span
          className={cn(
            "font-bold tracking-[0.28em] text-gold-gradient",
            wordmarkClassName,
          )}
        >
          {wordmark}
        </span>
      )}
    </div>
  );
}
