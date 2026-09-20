import { ModuleViz3D } from './ModuleViz3D';

interface Props {
  /** Load as % of capacity (0–100). */
  loadPct: number;
  className?: string;
}

export function EnergyFlowViz({ loadPct, className = '' }: Props) {
  return <ModuleViz3D moduleId="energy" dataValue={loadPct} className={className} />;
}
