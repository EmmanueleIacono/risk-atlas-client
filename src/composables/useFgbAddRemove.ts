import {
  GeoJsonDataSource,
  Color,
  PolygonGraphics,
  HeightReference,
  defined,
  PointGraphics,
} from "cesium";
import {
  GeoJSONFeatureCollection,
  AdminBoundType,
  HazardType,
  HazardBucket,
  HazardConfigByType
} from "../types/types";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useGISDataStore } from "../stores/useGISDataStore";
import { useServerStore } from "../stores/useServerStore";
import { useFlatGeoBufAsGeoJSON } from "./useFlatGeobufAsGeoJSON";

const adminStyleByType = {
  region: {
    fill: Color.fromCssColorString("rgba(185, 195, 205, 0.4)"),
    outline: Color.fromCssColorString("rgba(170, 180, 190, 1)"),
    outlineWidth: 3,
  },
  province: {
    fill: Color.fromCssColorString("rgba(185, 195, 205, 0.45)"),
    outline: Color.fromCssColorString("rgba(155, 165, 175, 1)"),
    outlineWidth: 2,
  },
  municipality: {
    fill: Color.fromCssColorString("rgba(185, 195, 205, 0.5)"),
    outline: Color.fromCssColorString("rgba(140, 150, 160, 1)"),
    outlineWidth: 1.5,
  },
} as const;

const hazardConfig: HazardConfigByType = {
  flooding: {
    kind: "categorical",
    geometry: "polygon",
    codeFieldCandidates: ["scenario_code", "Scenario code"],
    codeToBucket: {
      LPH: "low",
      MPH: "medium",
      HPH: "high"
    },
    fillByBucket: {
      low: Color.fromCssColorString("rgba(84, 181, 255, 0.45)"),
      medium: Color.fromCssColorString("rgba(40, 132, 220, 0.50)"),
      high: Color.fromCssColorString("rgba(17, 82, 170, 0.60)"),
      very_high: Color.fromCssColorString("rgba(17, 82, 170, 0.65)"),
      attention: Color.fromCssColorString("rgba(17, 82, 170, 0.50)"),
      unknown: Color.fromCssColorString("rgba(120, 120, 120, 0.50)"),
    },
    outline: Color.fromCssColorString("rgba(18, 92, 187, 1)"),
  },

  landslide: {
    kind: "categorical",
    geometry: "polygon",
    codeFieldCandidates: ["scenario_code", "Scenario code"],
    codeToBucket: {
      P1: "low",
      P2: "medium",
      P3: "high",
      P4: "very_high",
      AA: "attention"
    },
    fillByBucket: {
      low: Color.fromCssColorString("rgba(191, 120, 85, 0.45)"),
      medium: Color.fromCssColorString("rgba(170, 87, 60, 0.50)"),
      high: Color.fromCssColorString("rgba(142, 58, 45, 0.60)"),
      very_high: Color.fromCssColorString("rgba(110, 35, 32, 0.65)"),
      attention: Color.fromCssColorString("rgba(172, 142, 35, 0.50)"), // dark yellow
      unknown: Color.fromCssColorString("rgba(120, 120, 120, 0.50)"),
    },
    outline: Color.fromCssColorString("rgba(96, 43, 30, 1)"),
  },

  seismic: {
    kind: "continuous",
    geometry: "point",
    valueFieldCandidates: ["ag", "AG", "Peak Ground Acceleration - standard (%g)"],
    min: 0.0,
    max: 0.2804,
    colorFromValue: (v: number) => seismicRampFromNormalized((v - 0.0) / (0.2804 - 0.0)),
    pointSize: 30,
    outline: Color.fromCssColorString("rgba(40, 40, 40, 0.90)"),
  },
};

const { viewerRef, currentViewerBboxRef } = useCesiumStore();
const {
  RegionAdminBoundsDsRef,
  ProvinceAdminBoundsDsRef,
  MunicipalityAdminBoundsDsRef,
  FloodHazardDsRef,
  LandslideHazardDsRef,
  SeismicHazardDsRef
} = useGISDataStore();
const {
  buildFgbRegionAdminBoundsUrl,
  buildFgbProvinceAdminBoundsUrl,
  buildFgbMunicipalityAdminBoundsUrl,
  buildFgbFloodHazardUrl,
  buildFgbLandslideHazardUrl,
  buildFgbSeismicHazardUrl
} = useServerStore();
const { fetchFgbAsGeoJSON } = useFlatGeoBufAsGeoJSON();

async function getAdminBoundsGeoJSON(type: AdminBoundType) {
  let rawFgbUrl = "";
  if (type === "region") rawFgbUrl = buildFgbRegionAdminBoundsUrl();
  if (type === "province") rawFgbUrl = buildFgbProvinceAdminBoundsUrl();
  if (type === "municipality") rawFgbUrl = buildFgbMunicipalityAdminBoundsUrl();

  // computing bbox for OSM request
  const bbox = [
    currentViewerBboxRef.value.west,
    currentViewerBboxRef.value.south,
    currentViewerBboxRef.value.east,
    currentViewerBboxRef.value.north
  ].join(',');

  const fullFgbUrl: string = `${rawFgbUrl}?bbox=${bbox}&epsg=4326`;

  try {
    const geojson = await fetchFgbAsGeoJSON(fullFgbUrl);
    return geojson;
  } catch (er) {
    console.error(`Error fetching ${type} admin bounds GeoJSON:`, er);
  }
}

/**
 * Fetch FGB hazard data from server and return as GeoJSON
 */
async function getHazardGeoJSON(type: HazardType) {
  let rawFgbUrl = "";
  if (type === "flooding") rawFgbUrl = buildFgbFloodHazardUrl();
  if (type === "landslide") rawFgbUrl = buildFgbLandslideHazardUrl();
  if (type === "seismic") rawFgbUrl = buildFgbSeismicHazardUrl();

  // computing bbox for OSM request
  const bbox = [
    currentViewerBboxRef.value.west,
    currentViewerBboxRef.value.south,
    currentViewerBboxRef.value.east,
    currentViewerBboxRef.value.north
  ].join(',');

  const fullFgbUrl: string = `${rawFgbUrl}?bbox=${bbox}&epsg=4326`;

  try {
    const geojson = await fetchFgbAsGeoJSON(fullFgbUrl);
    return geojson;
  } catch (er) {
    console.error(`Error fetching ${type} hazard GeoJSON:`, er);
  }
}

async function addAdminBoundsLayer(
  type: AdminBoundType,
  geojson: GeoJSONFeatureCollection
) {
  if (!viewerRef.value || !geojson) return;

  const dsName = `admin-bounds-${type}`;
  const adminDs = new GeoJsonDataSource(dsName);

  const loaded = await adminDs.load(geojson, {
    clampToGround: true,
  });

  viewerRef.value.dataSources.add(loaded);

  const style = adminStyleByType[type];
  loaded.entities.values.forEach((ent) => {
    if (!ent.polygon) return;

    const pg = new PolygonGraphics({
      material: style.fill,
      outline: true,
      outlineColor: style.outline,
      outlineWidth: style.outlineWidth,
      heightReference: HeightReference.CLAMP_TO_TERRAIN,
    });

    ent.polygon.material = pg.material;
    ent.polygon.outline = pg.outline;
    ent.polygon.outlineColor = pg.outlineColor;
    ent.polygon.outlineWidth = pg.outlineWidth;
    ent.polygon.heightReference = pg.heightReference;
  });

  if (type === "region") RegionAdminBoundsDsRef.value = adminDs;
  if (type === "province") ProvinceAdminBoundsDsRef.value = adminDs;
  if (type === "municipality") MunicipalityAdminBoundsDsRef.value = adminDs;
}

/**
 * Add hazard FGB layer to Cesium viewer
 */
async function addHazardLayer(
  type: HazardType,
  geojson: GeoJSONFeatureCollection
) {
  if (!viewerRef.value || !geojson) return;

  const dsName = `hazard-${type}`;
  const hazardDataSource = new GeoJsonDataSource(dsName);

  const loaded = await hazardDataSource.load(geojson, {
    clampToGround: true,
  });

  viewerRef.value.dataSources.add(loaded);

  // Set style based on feature properties (scenario)
  loaded.entities.values.forEach((ent) => {
    const props = ent.properties?.getValue(viewerRef.value?.clock.currentTime) ?? {};
    const cfg = hazardConfig[type];

    if (cfg.kind === "categorical") {
      if (!ent.polygon) return;

      const rawCode = pickFirstString(props, cfg.codeFieldCandidates);
      const bucket = resolveBucket(type as "flooding" | "landslide", rawCode);
      const fill = cfg.fillByBucket[bucket];

      const style = new PolygonGraphics({
        material: fill,
        outline: true,
        outlineColor: cfg.outline,
        heightReference: HeightReference.CLAMP_TO_TERRAIN,
      });

      ent.polygon.material = style.material;
      ent.polygon.outline = style.outline;
      ent.polygon.outlineColor = style.outlineColor;
      ent.polygon.heightReference = style.heightReference;

    } else {
      const ag = pickFirstNumber(props, cfg.valueFieldCandidates);
      if (ag == null) return;
  
      const agClampled = clamp(ag, cfg.min, cfg.max);
      const color = cfg.colorFromValue(agClampled);

      // disabling the default billboard display for points
      ent.billboard = undefined;
      ent.label = undefined;

      ent.point = new PointGraphics({
        pixelSize: cfg.pointSize,
        color: color,
        outlineColor: cfg.outline,
        outlineWidth: 2,
        heightReference: HeightReference.CLAMP_TO_TERRAIN,
      });
    }
  });

  // Store reference for later removal
  if (type === "flooding") FloodHazardDsRef.value = hazardDataSource;
  if (type === "landslide") LandslideHazardDsRef.value = hazardDataSource;
  if (type === "seismic") SeismicHazardDsRef.value = hazardDataSource;
}

function removeAdminBoundsLayer(type: AdminBoundType) {
  if (!viewerRef.value) return;

  const refMap = {
    region: RegionAdminBoundsDsRef,
    province: ProvinceAdminBoundsDsRef,
    municipality: MunicipalityAdminBoundsDsRef,
  };

  const dsRef = refMap[type];
  if (defined(dsRef.value)) {
    viewerRef.value.dataSources.remove(dsRef.value);
    dsRef.value = null;
  }
}

/**
 * Remove hazard layer from Cesium viewer
 */
function removeHazardLayer(type: HazardType) {
  if (!viewerRef.value) return;

  const refMap = {
    flooding: FloodHazardDsRef,
    landslide: LandslideHazardDsRef,
    seismic: SeismicHazardDsRef,
  };

  const dsRef = refMap[type];
  if (defined(dsRef.value)) {
    viewerRef.value.dataSources.remove(dsRef.value);
    dsRef.value = null;
  }
}

async function fetchAndAddAdminBounds(type: AdminBoundType) {
  removeAdminBoundsLayer(type);
  const geojson = await getAdminBoundsGeoJSON(type);
  if (geojson) await addAdminBoundsLayer(type, geojson);
}

/**
 * Combined helper: fetch + add
 */
async function fetchAndAddHazard(type: HazardType) {
  removeHazardLayer(type); // avoids repeated overlaps
  const geojson = await getHazardGeoJSON(type);
  if (geojson) await addHazardLayer(type, geojson);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickFirstString(props: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = props[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

function pickFirstNumber(props: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = props[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const p = Number(v);
      if (Number.isFinite(p)) return p;
    }
  }
  return undefined;
}

function seismicRampFromNormalized(t: number): Color {
  const green = Color.fromCssColorString("#2ecc71"); // low
  const yellow = Color.fromCssColorString("#f1c40f");
  const orange = Color.fromCssColorString("#e67e22");
  const red = Color.fromCssColorString("#c0392b"); // high

  const tt = clamp(t, 0, 1);
  const out = new Color();

  if (tt <= 1 / 3) return Color.lerp(green, yellow, tt * 3, out);
  if (tt <= 2 / 3) return Color.lerp(yellow, orange, (tt - 1 / 3) * 3, out);
  return Color.lerp(orange, red, (tt - 2 / 3) * 3, out);
}

function resolveBucket(type: "flooding" | "landslide", codeRaw?: string): HazardBucket {
  if (!codeRaw) return "unknown";
  const code = codeRaw.trim().toUpperCase();
  return hazardConfig[type].codeToBucket[code as keyof typeof hazardConfig[typeof type]["codeToBucket"]] ?? "unknown";
}

export function useFgbAddRemove() {
  return {
    getAdminBoundsGeoJSON,
    getHazardGeoJSON,
    addAdminBoundsLayer,
    addHazardLayer,
    removeAdminBoundsLayer,
    removeHazardLayer,
    fetchAndAddAdminBounds,
    fetchAndAddHazard,
  };
}
