<template>
  <div class="domain-menu-container">
    <details class="menu-details" open>
      <summary class="menu-summary">Available Sensor Data</summary>
      <div class="options-container">
        <button @click="toggleIoTOverlay">IoT chart</button>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { useGlobalStore } from "../stores/useGlobalStore";

let overlay_bool: boolean = false;
const { updateActiveOverlayRef } = useGlobalStore();

function toggleIoTOverlay() {
  if (overlay_bool) {
    updateActiveOverlayRef(null);
    overlay_bool = false;
  } else {
    updateActiveOverlayRef('iot');
    overlay_bool = true;
  }
}
</script>

<style scoped>
</style>
