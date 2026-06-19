import { Badge } from "@/components/ui/badge";
import {
  ESTADO_PIPELINE_COLOR,
  ESTADO_PIPELINE_LABEL,
  type LeadEstadoPipeline,
} from "@/lib/domain";

export function EstadoBadge({ estado }: { estado: LeadEstadoPipeline }) {
  const color = ESTADO_PIPELINE_COLOR[estado];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: `${color}25`,
        color: color,
      }}
    >
      {ESTADO_PIPELINE_LABEL[estado]}
    </span>
  );
}

export function FuenteBadge({ fuente }: { fuente: string }) {
  return (
    <Badge variant="outline" className="text-xs">
      {fuente}
    </Badge>
  );
}
