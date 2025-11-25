// useFgbAddRemove.ts
import {
  GeoJsonDataSource,
  Color,
  PolygonGraphics,
  HeightReference,
  defined,
} from "cesium";
import { GeoJSONFeatureCollection } from "../types/types";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useGISDataStore } from "../stores/useGISDataStore";
import { useServerStore } from "../stores/useServerStore";
import { useFlatGeoBufAsGeoJSON } from "./useFlatGeobufAsGeoJSON";

/**
 * Hazard layer color maps per "scenario" property value.
 * You can extend or tweak these as needed.
 */
const hazardColorMaps = {
  flooding: {
    low: Color.fromCssColorString("rgba(0, 150, 255, 0.3)"),
    medium: Color.fromCssColorString("rgba(0, 100, 200, 0.4)"),
    high: Color.fromCssColorString("rgba(0, 50, 150, 0.5)"),
  },
  landslide: {
    low: Color.fromCssColorString("rgba(139, 69, 19, 0.3)"),
    medium: Color.fromCssColorString("rgba(160, 82, 45, 0.4)"),
    high: Color.fromCssColorString("rgba(101, 67, 33, 0.5)"),
  },
  seismic: {
    low: Color.fromCssColorString("rgba(255, 100, 100, 0.3)"),
    medium: Color.fromCssColorString("rgba(200, 50, 50, 0.4)"),
    high: Color.fromCssColorString("rgba(150, 0, 0, 0.5)"),
  },
};

const outlineColors = {
  flooding: Color.fromCssColorString("rgba(0, 120, 255, 0.8)"),
  landslide: Color.fromCssColorString("rgba(120, 60, 20, 0.8)"),
  seismic: Color.fromCssColorString("rgba(180, 0, 0, 0.8)"),
};

const { viewerRef, currentViewerBboxRef } = useCesiumStore();
const { FloodHazardDsRef, LandslideHazardDsRef, SeismicHazardDsRef } = useGISDataStore();
const { buildFgbFloodHazardUrl, buildFgbLandslideHazardUrl, buildFgbSeismicHazardUrl } = useServerStore();
const { fetchFgbAsGeoJSON } = useFlatGeoBufAsGeoJSON();

/**
 * Fetch FGB hazard data from server and return as GeoJSON
 */
async function getHazardGeoJSON(type: "flooding" | "landslide" | "seismic") {
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

/**
 * Add hazard FGB layer to Cesium viewer
 */
async function addHazardLayer(
  type: "flooding" | "landslide" | "seismic",
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
    if (!ent.polygon) return;

    // Correct way to get evaluated property values from Cesium PropertyBag
    const props = ent.properties?.getValue();
    const scenario = props?.scenario?.toLowerCase?.() ?? "low";

    const fillColor = hazardColorMaps[type][scenario] || hazardColorMaps[type].low;
    const outlineColor = outlineColors[type];

    const style = new PolygonGraphics({
        material: fillColor,
        outline: true,
        outlineColor: outlineColor,
        heightReference: HeightReference.CLAMP_TO_TERRAIN,
    });

    ent.polygon.material = style.material;
    ent.polygon.outline = style.outline;
    ent.polygon.outlineColor = style.outlineColor;
    ent.polygon.heightReference = style.heightReference;
    });


  // Store reference for later removal
  if (type === "flooding") FloodHazardDsRef.value = hazardDataSource;
  if (type === "landslide") LandslideHazardDsRef.value = hazardDataSource;
  if (type === "seismic") SeismicHazardDsRef.value = hazardDataSource;
}

/**
 * Remove hazard layer from Cesium viewer
 */
function removeHazardLayer(type: "flooding" | "landslide" | "seismic") {
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

/**
 * Combined helper: fetch + add
 */
async function fetchAndAddHazard(type: "flooding" | "landslide" | "seismic") {
  const geojson = await getHazardGeoJSON(type);
  if (geojson) await addHazardLayer(type, geojson);
}

export function useFgbAddRemove() {
  return {
    getHazardGeoJSON,
    addHazardLayer,
    removeHazardLayer,
    fetchAndAddHazard,
  };
}
