<template>
  <div class="domain-menu-container">
    <details class="menu-details">
      <summary class="menu-summary">Fly to</summary>
      <div v-if="tilesetsMapRef.size > 0" class="options-container">
        <div v-for="[id, ts] in tilesetsMapRef.entries()">
          <button class="menu-button" @click="flyToTileset(ts)">{{ availableProjectsMapRef.get(id)?.project_description ?? availableProjectsMapRef.get(id)?.project_id }}</button>
        </div>
      </div>
      <p v-else><i>No tilesets loaded</i></p>
    </details>
  </div>
</template>

<script setup lang="ts">
import { useCesiumStore } from "../stores/useCesiumStore";
import { useCesiumUtils } from "../composables/useCesiumUtils";

const { availableProjectsMapRef, tilesetsMapRef } = useCesiumStore();
const { flyToTileset } = useCesiumUtils();
</script>

<style scoped>
p {
  color: #666;
}
</style>
