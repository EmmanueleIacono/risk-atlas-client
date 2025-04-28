<template>
  <div class="menu-container">
    <FlyToMenu />
    <hr>
    <ProjectsMenu />
    <hr>
    <button class="menu-button" @click="removeAllTilesets"><b>Reset Viewer</b></button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { ProjectInfo, IfcClassesInfo } from "../types/types";
import { useServerStore } from "../stores/useServerStore";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useTilesetAddRemove } from "../composables/useTilesetAddRemove";
import FlyToMenu from "./FlyToMenu.vue";
import ProjectsMenu from "./ProjectsMenu.vue";

const { buildProjectsUrl, buildClassesUrl } = useServerStore();
const { availableProjectsMapRef, availableIfcClassesRef } = useCesiumStore();
const { removeAllTilesets } = useTilesetAddRemove();

onMounted(async () => {
  const projects: ProjectInfo[] = await getAvailableProjects();
  const classes: IfcClassesInfo[] = await getAvailableIfcClasses();
  projects.forEach((pi: ProjectInfo) => {
    availableProjectsMapRef.value.set(pi.project_id, pi);
  });
  availableIfcClassesRef.value = classes;
});

async function getAvailableProjects() {
  const full_url = buildProjectsUrl();
  const resp = await fetch(full_url);
  const projects = await resp.json();
  return projects;
}

async function getAvailableIfcClasses() {
  const full_url = buildClassesUrl();
  const resp = await fetch(full_url);
  const classes = await resp.json();
  return classes;
}
</script>

<style scoped>
.menu-container {
  position: absolute;
  top: calc(3rem + 10px);
  left: 10px;
  z-index: 1000; /* Ensure the menu appears above the Cesium viewer */
  background-color: rgba(0, 0, 0, 0.5); /* Grey transparent background */
  padding: 10px; /* Add padding for spacing */
  border-radius: 5px; /* Add border radius for rounded corners */
  max-height: 90vh;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #2f2f2f #464646;
}
</style>
