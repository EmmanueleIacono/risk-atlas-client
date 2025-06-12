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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useGlobalStore } from "../stores/useGlobalStore";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useOSMAddRemove } from "../composables/useOSMAddRemove";

const { loading } = useGlobalStore();
const { currentViewerBboxRef, viewerRef } = useCesiumStore();
const { getOSMBuildings, addOSMBuildings, removeOSMBuildings, extrudeOSMBuildings } = useOSMAddRemove();

const autoUpdateRef = ref<boolean>(false);
const OSMToLoadRef = ref<boolean>(false);
const adminBoundsRegionsToLoadRef = ref<boolean>(false);
const adminBoundsProvincesToLoadRef = ref<boolean>(false);
const adminBoundsCitiesToLoadRef = ref<boolean>(false);

watch(() => [currentViewerBboxRef.value, OSMToLoadRef.value, autoUpdateRef.value], async () => {
  if (!autoUpdateRef.value) return; // if manual update, do nothing
  await reloadGISData();
}, {
  deep: true
});

async function reloadGISData() {
  if (OSMToLoadRef.value) {
    loading.value = true;
    const osmGeoJSON = await getOSMBuildings();
    if (osmGeoJSON) {
      removeOSMBuildings(); // remove previous OSM data, if any
      await addOSMBuildings(osmGeoJSON); // add the new OSM data
      extrudeOSMBuildings(); // extrude the OSM data
    }
    loading.value = false;
  } else {
    removeOSMBuildings();
  }
}
</script>

<style scoped>
.admin-bounds-container {
  padding: 10px 7px;
}

.admin-bounds-title {
  margin: 0;
  color: #fff;
}

.gis-controls {
  color: #fff;
}
</style>
