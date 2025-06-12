import { Cartographic, GeoJsonDataSource, PolygonGraphics, Color } from "cesium";
import { GeoJSONFeatureCollection } from "../types/types";
import { useServerStore } from "../stores/useServerStore";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useGISDataStore } from "../stores/useGISDataStore";
import { useFlatGeoBufAsGeoJSON } from "./useFlatGeobufAsGeoJSON";

const { buildOSMBuildingsUrl } = useServerStore();
const { viewerRef, currentViewerBboxRef } = useCesiumStore();
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
      console.log(`ent n. ${idx} height:\n`, ent.polygon.height);
      console.log(`ent n. ${idx} heightReference:\n`, ent.polygon.heightReference);
      console.log(`ent n. ${idx} extrudedHeightReference:\n`, ent.polygon.extrudedHeightReference);
  
      // workaround for clean TypeScript
      // a) creating dummy object
      const propContainer = new PolygonGraphics({
        extrudedHeight: extrusion,
        material: Color.fromBytes(180, 180, 180, 255),
        outline: true,
        outlineColor: Color.fromBytes(128, 128, 128, 255),
      });

      // b) extracting dummy object properties (with "Property" type)
      const contExtH = propContainer.extrudedHeight;
      const contMat = propContainer.material;
      const contOutl = propContainer.outline;
      const contOutlCol = propContainer.outlineColor;

      // c) assigning "Proper" property objects to entity
      ent.polygon.extrudedHeight = contExtH;
      ent.polygon.material = contMat;
      ent.polygon.outline = contOutl;
      ent.polygon.outlineColor = contOutlCol;
    } catch (er) {
      console.error('Error extruding building:', er);
    }
  });
}

export function useOSMAddRemove() {
  return {
    getOSMBuildings,
    addOSMBuildings,
    removeOSMBuildings,
    extrudeOSMBuildings,
  };
}
