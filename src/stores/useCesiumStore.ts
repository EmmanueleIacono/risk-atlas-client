import {computed, ref, watch} from "vue";
import type {Viewer, Cesium3DTileset} from "cesium";
import { ProjectInfo, ViewerBbox, IfcClassesInfo, TilesetLocationInfo, DataSourceEntityData } from "../types/types";

const viewerRef = ref<Viewer | null>(null);
const currentViewerBboxRef = ref<ViewerBbox>({
  south: 0.0,
  west: 0.0,
  north: 0.0,
  east: 0.0
});

const availableProjectsMapRef = ref<Map<string, ProjectInfo>>(new Map());
const availableIfcClassesRef = ref<IfcClassesInfo[]>([]);

const tilesetsMapRef = ref<Map<string, Cesium3DTileset>>(new Map()); // reactive hashmap of tileset elements
const tilesetsLocationsMapRef = ref<Map<string, TilesetLocationInfo>>(new Map()); // reactive hashmap of {proj_id, lon, lat} locations of tilesets

const availableIfcClassesList = computed(() => {
  const merged_lists = availableIfcClassesRef.value.map(ifc_class_info => ifc_class_info.ifc_classes);
  const merged_flat_list = [
    ...new Set(
      merged_lists
        .flat()
        .sort()
        .filter(ifc_class => !["IfcProject", "IfcSite", "IfcBuilding", "IfcBuildingStorey"].includes(ifc_class)) // excluding top-level classes
    )
  ];

  return merged_flat_list;
});

const selectedDataSourceEntityRef = ref<DataSourceEntityData | null>(null);

export function useCesiumStore() {
  return {
    viewerRef,
    currentViewerBboxRef,
    availableProjectsMapRef,
    availableIfcClassesRef,
    tilesetsMapRef,
    tilesetsLocationsMapRef,
    availableIfcClassesList,
    selectedDataSourceEntityRef,
  };
}
