<template>
  <div class="domain-menu-container">
    <details class="menu-details" open>
      <summary class="menu-summary">Available Sensor Data</summary>
      <div class="options-container">
        <div v-for="sens in availableSensorsMapRef.values()">
          <input 
            class="menu-input-cbx"
            type="checkbox"
            v-model="selectedSensorsRef"
            :id="`cbx-${sens.sensor_id}`"
            :value="sens.sensor_id"
            :disabled="sensorsDisabledRef"
          >
          <label class="menu-input-cbx" :for="`cbx-${sens.sensor_id}`">{{ sens.name ? sens.name : sens.sensor_id }}</label>
        </div>
      </div>
    </details>
    <hr>
    <button
      :class="`menu-button${(sensorsLoadingRef ? ' sensors-loading' : '') + (selectedSensorsRef.length <= 0 ? ' no-selection' : '')}`"
      :disabled="sensorsDisabledRef || sensorsLoadingRef || selectedSensorsRef.length <= 0"
      @click="loadSelectedSensors"
    >
      <b>Load sensors</b>
    </button>
    <button
      class="menu-button"
      @click="toggleIoTOverlay"
    >
      <b>{{activeOverlayRef === 'iot' ? "Close" : "View"}} sensor chart</b>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Cartographic } from "cesium";
import { useGlobalStore } from "../stores/useGlobalStore";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useGISDataStore } from "../stores/useGISDataStore";
import { useCesiumUtils } from "../composables/useCesiumUtils";
import { useSensorsUtils } from "../composables/useSensorsUtils";

let overlay_bool: boolean = false;
const { activeOverlayRef, updateActiveOverlayRef } = useGlobalStore();
const { viewerRef, currentViewerBboxRef, availableSensorsMapRef, selectedSensorsRef } = useCesiumStore();
const { MAX_OSM_FETCH_HEIGHT } = useGISDataStore();
const { createSphere } = useCesiumUtils();
const { addSensorToSensorsMap, removeAllSensors } = useSensorsUtils();

const sensorsLoadingRef = ref<boolean>(false);
const sensorsDisabledRef = ref<boolean>(true);

watch(() => [currentViewerBboxRef.value], async () => {
  if (!viewerRef.value) return;
  const cartoHeight = Cartographic.fromCartesian(viewerRef.value.camera.position).height;
  sensorsDisabledRef.value = cartoHeight >= MAX_OSM_FETCH_HEIGHT;
}, {
  deep: true
});

function toggleIoTOverlay() {
  if (overlay_bool) {
    updateActiveOverlayRef(null);
    overlay_bool = false;
  } else {
    updateActiveOverlayRef('iot');
    overlay_bool = true;
  }
}

function loadSelectedSensors() {
  if (sensorsDisabledRef.value || sensorsLoadingRef.value || selectedSensorsRef.value.length <= 0) return;
  if (!viewerRef.value) return;

  const carto = Cartographic.fromCartesian(viewerRef.value.camera.position);
  const height = carto.height;

  if (height > MAX_OSM_FETCH_HEIGHT) { // if viewpoint is higher than allowed
    // remove previous sensors, if present
    removeAllSensors();
    return; // only fetch if viewpoint is within allowed height
  }

  removeAllSensors();
  sensorsLoadingRef.value = true;

  selectedSensorsRef.value.forEach(async s_id => {
    const sensor = availableSensorsMapRef.value.get(s_id);
    if (!sensor) return;

    const sensor_sphere = await createSphere(
      sensor.name,
      sensor.lon,
      sensor.lat,
      sensor.ground_h,
      0.5,
      {
        "Sensor ID": sensor.sensor_id,
        "Name": sensor.name,
        "Sensor description": sensor.description,
        "Latitude": sensor.lat,
        "Longitude": sensor.lon,
        "Height above ground": sensor.ground_h,
      }
    );

    if (sensor_sphere) addSensorToSensorsMap(sensor.sensor_id, sensor_sphere);
  });

  sensorsLoadingRef.value = false;
}
</script>

<style scoped>
.sensors-loading {
  cursor: wait;
}

.no-selection {
  cursor: not-allowed;
}

.not-applicable {
  cursor: not-allowed;
}
</style>
