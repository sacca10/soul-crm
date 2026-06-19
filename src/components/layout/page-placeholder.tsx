import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description?: string;
  stream?: "A" | "B" | "C" | "D";
}

const streamInfo: Record<NonNullable<PagePlaceholderProps["stream"]>, string> = {
  A: "Stream A · Foundation",
  B: "Stream B · Setter",
  C: "Stream C · Closer",
  D: "Stream D · Dirección y Marketing",
};

export function PagePlaceholder({ title, description, stream }: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </header>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Construction className="h-8 w-8 text-muted-foreground" />
          <div>
            <div className="font-medium">Página pendiente de construir</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {stream
                ? `Forma parte del ${streamInfo[stream]} del plan.`
                : "Definida en el plan, pendiente de implementación."}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
