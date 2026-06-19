"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ClickableRow({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <TableRow
      onClick={() => router.push(href)}
      className={cn(
        "cursor-pointer hover:bg-[hsl(var(--gold)/0.06)] transition-colors",
        className,
      )}
    >
      {children}
    </TableRow>
  );
}
