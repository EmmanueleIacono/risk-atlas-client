<template>
  <div class="domain-menu-container">
    <details class="menu-details">
      <summary class="menu-summary">Fly to</summary>
      <div v-if="sensorsMapRef.size > 0" class="options-container">
        <div v-for="[id, sens_ent] in sensorsMapRef.entries()">
          <button
            class="menu-button"
            @click="flyToSensor(sens_ent)"
          >
            {{ availableSensorsMapRef.get(id)?.name ?? availableSensorsMapRef.get(id)?.sensor_id }}
          </button>
        </div>
      </div>
      <p v-else><i>No sensors loaded</i></p>
    </details>
  </div>
</template>

<script setup lang="ts">
import { useCesiumStore } from "../stores/useCesiumStore";
import { useSensorsUtils } from "../composables/useSensorsUtils";

const { availableSensorsMapRef, sensorsMapRef } = useCesiumStore();
const { flyToSensor } = useSensorsUtils();
</script>

<style scoped>
p {
  color: #666;
}
</style>
