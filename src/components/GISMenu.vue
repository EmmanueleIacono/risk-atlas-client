<template>
  <div class="domain-menu-container">
    <details class="menu-details" open>
      <summary class="menu-summary">Available GIS Data</summary>
      <div class="options-container">
        <div>
          <input
            class="menu-input-cbx"
            v-model="OSMToLoadRef"
            type="checkbox"
            id="cbx-osm"
            :disabled="OSMDisabledRef"
          >
          <label class="menu-input-cbx" for="cbx-osm">OSM Buildings</label>
        </div>
        <div class="admin-bounds-container">
          <p class="admin-bounds-title"><b>Administrative Boundaries</b></p>
          <div>
            <input
              class="menu-input-cbx"
              v-model="adminBoundsRegionsToLoadRef"
              type="checkbox"
              id="cbx-regn"
            >
            <label class="menu-input-cbx" for="cbx-regn">Regions</label>
          </div>
          <div>
            <input
              class="menu-input-cbx"
              v-model="adminBoundsProvincesToLoadRef"
              type="checkbox"
              id="cbx-prov"
            >
            <label class="menu-input-cbx" for="cbx-prov">Provinces</label>
          </div>
          <div>
            <input
              class="menu-input-cbx"
              v-model="adminBoundsCitiesToLoadRef"
              type="checkbox"
              id="cbx-city"
            >
            <label class="menu-input-cbx" for="cbx-city">Municipalities</label>
          </div>
        </div>
        <div class="hazard-data-container">
          <p class="hazard-data-title"><b>Hazard Maps</b></p>
          <div>
            <input
              class="menu-input-cbx"
              v-model="hazardMapsFloodToLoadRef"
              type="checkbox"
              id="cbx-fld"
            >
            <label class="menu-input-cbx" for="cbx-fld">Flood</label>
          </div>
          <div>
            <input
              class="menu-input-cbx"
              v-model="hazardMapsLandslideToLoadRef"
              type="checkbox"
              id="cbx-lnd"
            >
            <label class="menu-input-cbx" for="cbx-lnd">Landslide</label>
          </div>
          <div>
            <input
              class="menu-input-cbx"
              v-model="hazardMapsSeismicToLoadRef"
              type="checkbox"
              id="cbx-ssm"
            >
            <label class="menu-input-cbx" for="cbx-ssm">Seismic</label>
          </div>
        </div>
      </div>
    </details>
    <hr>
    <div class="gis-controls">
      Update mode:
      <input type="radio" id="manual" :value="false" v-model="autoUpdateRef">
      <label for="manual">Manual</label>
      <input type="radio" id="auto" :value="true" v-model="autoUpdateRef">
      <label for="auto">Auto</label>
      <button v-if="!autoUpdateRef" @click="reloadGISData" class="menu-button">Load GIS Data</button>
      <button @click="loadHazardScores" class="menu-button">Assess Flood Hazard</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Cartographic, Entity, Color } from "cesium";
import { useGlobalStore } from "../stores/useGlobalStore";
import { useGISDataStore } from "../stores/useGISDataStore";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useOSMAddRemove } from "../composables/useOSMAddRemove";
import { useHazardUtils } from "../composables/useHazardUtils";
import { useGeoUtils } from "../composables/useGeoUtils";
import { useGlobalUtils } from "../composables/useGlobalUtils";
import { useCesiumUtils } from "../composables/useCesiumUtils";
import { PointLocationInfo } from "../types/types";
import { useFgbAddRemove } from "../composables/useFgbAddRemove";

const { loading } = useGlobalStore();
const { MAX_OSM_FETCH_HEIGHT } = useGISDataStore();
const { currentViewerBboxRef, viewerRef } = useCesiumStore();
const { getOSMBuildings, addOSMBuildings, removeOSMBuildings, extrudeOSMBuildings, collectOSMPositions } = useOSMAddRemove();
const { fetchAndAddHazard, removeHazardLayer } = useFgbAddRemove();
const { getFloodHazardScores } = useHazardUtils();
const { computeCentroid } = useGeoUtils();
const { getGradientColor } = useGlobalUtils();
const { colorDataSourceEntity, colorDataSourceEntityById } = useCesiumUtils();

const autoUpdateRef = ref<boolean>(false);
const OSMDisabledRef = ref<boolean>(true);
const OSMToLoadRef = ref<boolean>(false);
const adminBoundsRegionsToLoadRef = ref<boolean>(false);
const adminBoundsProvincesToLoadRef = ref<boolean>(false);
const adminBoundsCitiesToLoadRef = ref<boolean>(false);
const hazardMapsFloodToLoadRef = ref<boolean>(false);
const hazardMapsLandslideToLoadRef = ref<boolean>(false);
const hazardMapsSeismicToLoadRef = ref<boolean>(false);

watch(() => [currentViewerBboxRef.value, OSMToLoadRef.value, autoUpdateRef.value], async () => {
  if (!viewerRef.value) return;
  const cartoHeight = Cartographic.fromCartesian(viewerRef.value.camera.position).height;
  OSMDisabledRef.value = cartoHeight >= MAX_OSM_FETCH_HEIGHT;
  if (OSMDisabledRef.value) OSMToLoadRef.value = false;

  if (!autoUpdateRef.value) return; // if manual update, do nothing
  await reloadGISData();
}, {
  deep: true
});

async function reloadGISData() {
  loading.value = true;
  if (OSMToLoadRef.value) {
    const osmGeoJSON = await getOSMBuildings();
    if (osmGeoJSON) {
      removeOSMBuildings(); // remove previous OSM data, if any
      await addOSMBuildings(osmGeoJSON); // add the new OSM data
      extrudeOSMBuildings(); // extrude the OSM data
    }
  } else {
    removeOSMBuildings();
    // removeHazardLayer("landslide");
    // removeHazardLayer("seismic");
  }
  if (hazardMapsFloodToLoadRef.value) {
    await fetchAndAddHazard("flooding");
  } else {
    removeHazardLayer("flooding");
  }
  loading.value = false;
}

async function loadHazardScores() {
  loading.value = true;
  const entityPositionData = collectOSMPositions();
  // console.log(entityPositionData);
  if (!entityPositionData) return;

  const entityIdMap = new Map<string, Entity>();

  const entityCentroids = entityPositionData.map(ent => {
    const entity = ent?.entity;
    const entityCoords = ent?.coordinates;
    if (!entity || !entityCoords) return;

    entityIdMap.set(entity.id, entity);

    const centroid = computeCentroid(entityCoords);
    return {
      entity,
      centroid,
    };
  });

  const entityPoints = entityCentroids
    .filter(ec => ec != null && ec != undefined)
    .map((ec): PointLocationInfo => {
      return {
        // id: parseInt(ec.entity.id),
        id: (ec.entity.id).toString(),
        lon: ec.centroid.lon,
        lat: ec.centroid.lat,
      };
    });

  console.log("entity points:\n", entityPoints);
  const floodHazardScore = await getFloodHazardScores(entityPoints);
  console.log(`flood hazard scores:\n`, floodHazardScore);
  for (const score of floodHazardScore) {
    const entityId = (score.id).toString();
    const entityScore: number = score.score;
    const entityScoreColor = getGradientColor(entityScore);
    // console.log("score: ", entityScore, " color: ", entityScoreColor);
    const cesiumMaterialColor = Color.fromBytes(entityScoreColor.r, entityScoreColor.g, entityScoreColor.b, 180);
    const cesiumOutlineColor = Color.fromBytes(entityScoreColor.r, entityScoreColor.g, entityScoreColor.b, 255);
    // const entity = entityIdMap.get(entityId);
    // if (!entity) {
    //   console.log("NO ENTITY FOR ID: ", entityId);
    //   continue;
    // }
    // colorDataSourceEntity(entity, cesiumMaterialColor, cesiumOutlineColor);
    colorDataSourceEntityById('osm-geojson', entityId, cesiumMaterialColor, cesiumOutlineColor);
  }
  loading.value = false;
}
</script>

<style scoped>
.admin-bounds-container,
.hazard-data-container {
  padding: 10px 7px;
}

.admin-bounds-title,
.hazard-data-title {
  margin: 0;
  color: #fff;
}

.gis-controls {
  color: #fff;
}
</style>
