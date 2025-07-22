<template>
  <div class="menu-container">
    <div v-show="activeMenuRef === 'gis'">
      <GISMenu />
      <hr>
    </div>
    <div v-show="activeMenuRef === 'bim'">
      <BIMMenuFlyTo />
      <hr>
      <BIMMenuProjects />
      <hr>
    </div>
    <div v-show="activeMenuRef === 'iot'">
      <IoTMenuFLyTo />
      <hr>
      <IoTMenuSensors />
      <hr>
    </div>
    <div v-show="activeMenuRef === 'dash'">
      <i>Dashboard Menu here</i>
      <hr>
    </div>
    <button class="menu-button" @click="resetViewer"><b>Reset Viewer</b></button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { ProjectInfo, IfcClassesInfo, SensorData } from "../types/types";
import { useServerStore } from "../stores/useServerStore";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useNavbarStore } from "../stores/useNavbarStore";
import { useOSMAddRemove } from "../composables/useOSMAddRemove";
import { useTilesetAddRemove } from "../composables/useTilesetAddRemove";
import { useSensorsUtils } from "../composables/useSensorsUtils";
import BIMMenuFlyTo from "./BIMMenuFlyTo.vue";
import BIMMenuProjects from "./BIMMenuProjects.vue";
import GISMenu from "./GISMenu.vue";
import IoTMenuSensors from "./IoTMenuSensors.vue";
import IoTMenuFLyTo from "./IoTMenuFLyTo.vue";

const { buildProjectsUrl, buildClassesUrl, buildSensorsUrl } = useServerStore();
const { availableProjectsMapRef, availableIfcClassesRef, availableSensorsMapRef } = useCesiumStore();
const { activeMenuRef } = useNavbarStore();
const { removeOSMBuildings } = useOSMAddRemove();
const { removeAllTilesets } = useTilesetAddRemove();
const { removeAllSensors } = useSensorsUtils();

onMounted(async () => {
  const projects: ProjectInfo[] = await getAvailableProjects();
  const classes: IfcClassesInfo[] = await getAvailableIfcClasses();
  const sensors: SensorData[] = await getAvailableSensors();
  projects.forEach((pi: ProjectInfo) => {
    availableProjectsMapRef.value.set(pi.project_id, pi);
  });
  availableIfcClassesRef.value = classes;
  sensors.forEach((sns: SensorData) => {
    availableSensorsMapRef.value.set(sns.sensor_id, sns);
  });
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

async function getAvailableSensors() {
  const full_url = buildSensorsUrl();
  const resp = await fetch(full_url);
  const sensors = await resp.json();
  return sensors;
}

function resetViewer() {
  removeOSMBuildings();
  removeAllTilesets();
  removeAllSensors();
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
  max-height: calc(90vh - 3rem);
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #2f2f2f #464646;
}

i {
  color: #666;
}
</style>
