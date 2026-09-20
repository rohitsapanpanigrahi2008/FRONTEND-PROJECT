import { ModuleViz3D } from './ModuleViz3D';

interface Props {
  /** Max bin fill across zones (0–100). */
  maxFillPct: number;
  className?: string;
}

export function WasteManagementViz({ maxFillPct, className = '' }: Props) {
  return <ModuleViz3D moduleId="waste" dataValue={maxFillPct} className={className} />;
}
