import type { Feature } from "flatgeobuf";
import type { Color } from "cesium";

type NavbarItem = {
  id: string;
  name: string;
};

type ViewerBbox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

type GeoJSONFeatureCollection = {
  type: string;
  features: Feature[];
};

type DataSourceEntityData = {
  id: string;
  data_source_name: string;
};

type ProjectInfo = {
  project_id: string;
  project_description: string | null;
};

type IfcClassesInfo = {
  project_id: string;
  ifc_classes: string[];
};

type TilesetLocationInfo = {
  tileset_id: string,
  longitude: number,
  latitude: number
};

type PointLocationInfo = {
  // id: number,
  id: string,
  lon: number,
  lat: number
};

type AdminBoundType = "region" | "province" | "municipality";

type HazardType = "flooding" | "landslide" | "seismic";

type FloodCodes = "LPH" | "MPH" | "HPH";
type LandslideCodes = "P1" | "P2" | "P3" | "P4" | "AA";

type HazardBucket =
  | "low"
  | "medium"
  | "high"
  | "very_high"
  | "attention"
  | "unknown";

type CategoricalHazardConfig<TCode extends string> = {
  kind: "categorical";
  geometry: "polygon";
  codeFieldCandidates: string[];
  codeToBucket: Record<TCode, HazardBucket>;
  fillByBucket: Record<HazardBucket, Color>;
  outline: Color;
};

type ContinuousHazardConfig = {
  kind: "continuous";
  geometry: "point";
  valueFieldCandidates: string[]; // e.g. ["ag", "AG", ...]
  min: number; // 0.0
  max: number; // 0.2804
  colorFromValue: (v: number) => Color;
  pointSize: number;
  outline?: Color;
};

type HazardConfigByType = {
  flooding: CategoricalHazardConfig<FloodCodes>;
  landslide: CategoricalHazardConfig<LandslideCodes>;
  seismic: ContinuousHazardConfig;
};

type HazardScore = {
  id: string;
  score: number;
};

type SensorData = {
  sensor_id: string,
  name: string,
  description: string,
  lat: number,
  lon: number,
  ground_h: number,
  project_id: string | null,
  element_id: string | null
};

type SensorPayload = {
  sensor_id: string,
  timestamp: string, // ISO string
  measurement: number | Record<string, number>,
  units: string | Record<string, string>,
};

export {
  NavbarItem,
  ViewerBbox,
  GeoJSONFeatureCollection,
  DataSourceEntityData,
  ProjectInfo,
  IfcClassesInfo,
  TilesetLocationInfo,
  PointLocationInfo,
  AdminBoundType,
  HazardType,
  HazardBucket,
  HazardConfigByType,
  HazardScore,
  SensorData,
  SensorPayload,
}
