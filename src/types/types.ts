import type { Feature } from "flatgeobuf";

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
  id: number,
  lon: number,
  lat: number
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
}
