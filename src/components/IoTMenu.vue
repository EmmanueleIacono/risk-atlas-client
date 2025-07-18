<template>
  <div class="domain-menu-container">
    <details class="menu-details">
      <summary class="menu-summary">Fly to</summary>
      <!-- <div v-if="sensorsMapRef.size > 0" class="options-container"></div> -->
      <div class="options-container"></div>
    </details>
    <hr>
    <details class="menu-details" open>
      <summary class="menu-summary">Available Sensor Data</summary>
      <div class="options-container">
        <div v-for="sens in availableSensorsRef.values()">
          <input class="menu-input-cbx" type="checkbox" v-model="selectedSensorsRef" :id="`cbx-${sens.sensor_id}`" :value="sens.sensor_id">
          <label class="menu-input-cbx" :for="`cbx-${sens.sensor_id}`">{{ sens.name ? sens.name : sens.sensor_id }}</label>
        </div>
      </div>
      <button @click="toggleIoTOverlay">IoT chart</button>
    </details>
    <hr>
    <button :class="`menu-button${(sensorsLoadingRef ? ' sensors-loading' : '') + (selectedSensorsRef.length <= 0 ? ' no-selection' : '')}`" :disabled="sensorsLoadingRef || selectedSensorsRef.length <= 0" @click="loadSelectedSensors"><b>Load sensors</b></button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useGlobalStore } from "../stores/useGlobalStore";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useCesiumUtils } from "../composables/useCesiumUtils";

let overlay_bool: boolean = false;
const { updateActiveOverlayRef } = useGlobalStore();
const { availableSensorsRef, selectedSensorsRef } = useCesiumStore();
const { createSphere } = useCesiumUtils();

const sensorsLoadingRef = ref<boolean>(false);

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
  if (selectedSensorsRef.value.length <= 0) return;
  // removeAllSensors(); // MUST IMPLEMENT
  sensorsLoadingRef.value = true;
  console.log("selected sensors:\n");
  selectedSensorsRef.value.forEach(s => {
    console.log(s);
  });
  console.log("all sensors:");
  console.log(availableSensorsRef.value);
  sensorsLoadingRef.value = false;

  availableSensorsRef.value.forEach(async s => {
    await createSphere(
      s.name,
      s.lon,
      s.lat,
      s.ground_h,
      0.5,
      {
        "Sensor ID": s.sensor_id,
        "Name": s.name,
        "Sensor description": s.description,
        "Latitude": s.lat,
        "Longitude": s.lon,
        "Height above ground": s.ground_h,
      }
    );
  });
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
