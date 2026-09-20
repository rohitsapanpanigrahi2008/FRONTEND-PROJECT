import { ModuleViz3D } from './ModuleViz3D';

interface Props {
  /** PM2.5 or AQI normalised to 0–100 for the visual binding. */
  normalizedLevel: number;
  className?: string;
}

export function AirQualityViz({ normalizedLevel, className = '' }: Props) {
  return <ModuleViz3D moduleId="air-quality" dataValue={normalizedLevel} className={className} />;
}
