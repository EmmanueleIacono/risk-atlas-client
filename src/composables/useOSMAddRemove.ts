import { Cartographic, GeoJsonDataSource, PolygonGraphics, HeightReference, PolygonHierarchy, Math as CsmMath } from "cesium";
import { GeoJSONFeatureCollection, PointLocationInfo } from "../types/types";
import { useGlobalStore } from "../stores/useGlobalStore";
import { useServerStore } from "../stores/useServerStore";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useGISDataStore } from "../stores/useGISDataStore";
import { useFlatGeoBufAsGeoJSON } from "./useFlatGeobufAsGeoJSON";

const { defaultMaterialCesiumColor, defaultOutlineCesiumColor } = useGlobalStore();
const { buildOSMBuildingsUrl } = useServerStore();
const { viewerRef, currentViewerBboxRef, selectedDataSourceEntityRef } = useCesiumStore();
const { MAX_OSM_FETCH_HEIGHT, lastBboxStrRef, OSMBuildingsDsRef } = useGISDataStore();
const { fetchFgbAsGeoJSON } = useFlatGeoBufAsGeoJSON();

async function getOSMBuildings() {
  if (!viewerRef.value) return;

  const carto = Cartographic.fromCartesian(viewerRef.value.camera.position);
  const height = carto.height;

  if (height > MAX_OSM_FETCH_HEIGHT) { // if viewpoint is higher than allowed
    // remove previous OSM buildings, if present
    removeOSMBuildings();
    return; // only fetch if viewpoint is within allowed height
  }

  // computing bbox for OSM request
  const bbox = [
    currentViewerBboxRef.value.west,
    currentViewerBboxRef.value.south,
    currentViewerBboxRef.value.east,
    currentViewerBboxRef.value.north
  ].join(',');

  // avoiding re-fetch of same area
  if (bbox === lastBboxStrRef.value) {
    return;
  }
  lastBboxStrRef.value = bbox;

  const rawOsmUrl = buildOSMBuildingsUrl();
  const osmUrl = `${rawOsmUrl}?bbox=${bbox}&epsg=4326`;

  const respGeoJSON = await fetchFgbAsGeoJSON(osmUrl);
  return respGeoJSON;
}

async function addOSMBuildings(osmGeoJSON: GeoJSONFeatureCollection) {
  if (!viewerRef.value || !osmGeoJSON) return;

  // add geojson to viewer
  const osmDataSource = new GeoJsonDataSource('osm-geojson');
  viewerRef.value.dataSources.add(
    await osmDataSource.load(
      osmGeoJSON,
      {
        clampToGround: true
      }
    )
  );

  // add geojson to osm ref
  OSMBuildingsDsRef.value = osmDataSource;
}

function removeOSMBuildings() {
  if (!viewerRef.value) return;
  if (OSMBuildingsDsRef.value) {
    viewerRef.value.dataSources.remove(OSMBuildingsDsRef.value);
    OSMBuildingsDsRef.value = null;
    selectedDataSourceEntityRef.value = null;
  }
}

function extrudeOSMBuildings() {
  if (!viewerRef.value) return;

  const osmDataSource = viewerRef.value.dataSources.getByName('osm-geojson')[0];
  const entities = osmDataSource.entities.values;
  entities.forEach((ent, idx) => {
    if (!ent.polygon) return;
    console.log(`ent n. ${idx}:\n`, ent);

    try {
      let extrusion;
      if (ent.properties?.hasProperty('height') && ent.properties['height']) {
        extrusion = parseFloat(ent.properties['height']); // directly height of bld in meters
      }
      else if (ent.properties?.hasProperty('building:levels') && ent.properties['building:levels']) {
        extrusion = parseInt((ent.properties['building:levels'])) * 4; // 4m per floor
      }
      else {
        extrusion = 4; // default to 4m
      }

      // workaround for clean TypeScript
      // a) creating dummy object
      const propContainer = new PolygonGraphics({
        extrudedHeight: extrusion,
        heightReference: HeightReference.CLAMP_TO_TERRAIN,
        material: defaultMaterialCesiumColor,
        outline: true,
        outlineColor: defaultOutlineCesiumColor,
      });

      // b) assigning "proper" property objects (with "Property" type) to entity, from the dummy object
      ent.polygon.extrudedHeight = propContainer.extrudedHeight;
      ent.polygon.heightReference = propContainer.heightReference;
      ent.polygon.material = propContainer.material;
      ent.polygon.outline = propContainer.outline;
      ent.polygon.outlineColor = propContainer.outlineColor;
    } catch (er) {
      console.error('Error extruding building:', er);
    }
  });
}

function collectOSMPositions() {
  if (!viewerRef.value) return;

  const osmDataSource = viewerRef.value.dataSources.getByName('osm-geojson')[0];
  const entities = osmDataSource.entities.values;
  const entityPositions = entities.map(ent => {
    if (!ent.polygon) return;

    const hierarchy = ent.polygon.hierarchy?.getValue(viewerRef.value?.clock.currentTime);
    let coords: PointLocationInfo[] = [];
    if (hierarchy instanceof PolygonHierarchy) {
      const PolygonHierarchy = hierarchy as PolygonHierarchy;
      // POSITIONS are the Cartesian3 coords of each outside-ring point
      // HOLES are the Cartesian3 coords of each inside-ring point
      const position = PolygonHierarchy.positions;
      coords = position.map((cart, idx): PointLocationInfo => {
        const c = Cartographic.fromCartesian(cart);
        return {
          id: idx,
          lon: CsmMath.toDegrees(c.longitude),
          lat: CsmMath.toDegrees(c.latitude),
        };
      });
    }
    return {
      entity: ent,
      coordinates: coords,
    };
  });

  return entityPositions;
}

export function useOSMAddRemove() {
  return {
    getOSMBuildings,
    addOSMBuildings,
    removeOSMBuildings,
    extrudeOSMBuildings,
    collectOSMPositions,
  };
}
