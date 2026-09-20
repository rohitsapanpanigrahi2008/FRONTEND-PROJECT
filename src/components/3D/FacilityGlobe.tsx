import { ModuleViz3D } from './ModuleViz3D';

interface Props {
  healthScore: number;
  className?: string;
}

export function FacilityGlobe({ healthScore, className = '' }: Props) {
  return <ModuleViz3D moduleId="overview" dataValue={healthScore} className={className} autoRotate />;
}
