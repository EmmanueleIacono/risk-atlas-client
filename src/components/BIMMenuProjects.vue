<template>
  <div class="domain-menu-container">
    <details class="menu-details" open>
      <summary class="menu-summary">Available Projects</summary>
      <div class="options-container">
        <div v-for="proj in availableProjectsMapRef.values()">
          <input class="menu-input-cbx" type="checkbox" v-model="selectedProjectsRef" :id="`cbx-${proj.project_id}`" :value="proj.project_id">
          <label class="menu-input-cbx" :for="`cbx-${proj.project_id}`">{{ proj.project_description ? proj.project_description : proj.project_id }}</label>
        </div>
      </div>
    </details>
    <hr>
    <details class="menu-details">
      <summary class="menu-summary">Filters</summary>
      <div class="options-container">
        <div v-for="ifc_class in availableIfcClassesList">
          <input
            class="menu-input-cbx"
            v-model="selectedIfcClassesRef"
            type="checkbox"
            :id="`cbx-${ifc_class}`"
            :value="ifc_class"
            :disabled="!applicableIfcClasses.has(ifc_class)"
          >
          <label :class="`menu-input-cbx${applicableIfcClasses.has(ifc_class) ? '' : ' not-applicable'}`" :for="`cbx-${ifc_class}`">{{ifc_class}}</label>
        </div>
      </div>
    </details>
    <hr>
    <button :class="`menu-button${(tilesetsLoadingRef ? ' tilesets-loading' : '') + (selectedProjectsRef.length <= 0 ? ' no-selection' : '')}`" :disabled="tilesetsLoadingRef || selectedProjectsRef.length <= 0" @click="loadSelectedProjects"><b>Load projects</b></button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { IfcClassesInfo } from "../types/types";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useTilesetAddRemove } from "../composables/useTilesetAddRemove";
import { useCesiumUtils } from "../composables/useCesiumUtils";

const {
  availableProjectsMapRef,
  availableIfcClassesRef,
  availableIfcClassesList,
  tilesetsMapRef
} = useCesiumStore();

const {
  add3DTilesetToViewer,
  removeAllTilesets
} = useTilesetAddRemove();

const {
  flyToTileset
} = useCesiumUtils();

const selectedProjectsRef = ref<string[]>([]);
const selectedIfcClassesRef = ref<string[]>([]);
const tilesetsFilterParamsRef = ref<IfcClassesInfo[]>([]);
const tilesetsLoadingRef = ref<boolean>(false);

const applicableIfcClasses = computed<Set<string>>(() => {
  const classes_set = new Set<string>();

  selectedProjectsRef.value.forEach(proj_id => {
    const info = availableIfcClassesRef.value.find(item => item.project_id === proj_id);
    if (info) {
      info.ifc_classes.forEach(cls => classes_set.add(cls));
    }
  });

  return classes_set;
});

watch(applicableIfcClasses, new_set => {
  selectedIfcClassesRef.value = selectedIfcClassesRef.value.filter(cls => new_set.has(cls));
});

async function loadSelectedProjects() {
  if (selectedProjectsRef.value.length <= 0) return;
  removeAllTilesets();
  tilesetsLoadingRef.value = true;
  tilesetsFilterParamsRef.value = [];

  // 1) group selected ifc classes by selected project, based on availableIfcClassesRef
  selectedProjectsRef.value.forEach(proj => {
    const tileset_filter_params: IfcClassesInfo = {project_id: "", ifc_classes: []};
    tileset_filter_params.project_id = proj;
    const belongingIfcClasses = selectedIfcClassesRef.value.filter(cls => {
      const prj_cls_info = availableIfcClassesRef.value.find(avl_prj => avl_prj.project_id === proj);
      return prj_cls_info?.ifc_classes.includes(cls);
    });
    tileset_filter_params.ifc_classes = belongingIfcClasses;
    tilesetsFilterParamsRef.value.push(tileset_filter_params);
  });

  // 2) build a list of tileset endpoints with filters query parameters
  for (const proj of tilesetsFilterParamsRef.value) {
    const filters: string | null = proj.ifc_classes.length > 0 ? proj.ifc_classes.join(";") : null;
    const tileset_req_url: string = filters ? `${proj.project_id}?filters=${encodeURIComponent(filters)}` : `${proj.project_id}`;

    // 3) add each tileset to viewer scene
    await add3DTilesetToViewer(tileset_req_url);
  }
  // 4) once updated all tilesets' height, fly to the last one added
  const last_index: number = selectedProjectsRef.value.length - 1;
  if (last_index >= 0 && selectedProjectsRef.value.length > 0) {
    const last_index_project_id: string = selectedProjectsRef.value[last_index];
    const last_tileset = tilesetsMapRef.value.get(last_index_project_id);
    flyToTileset(last_tileset);
  }
  tilesetsLoadingRef.value = false;
}
</script>

<style scoped>
.tilesets-loading {
  cursor: wait;
}

.no-selection {
  cursor: not-allowed;
}

.not-applicable {
  cursor: not-allowed;
}
</style>
