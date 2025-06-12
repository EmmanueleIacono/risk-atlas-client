import { ref } from "vue";
import type { DataSource } from "cesium";

const MAX_OSM_FETCH_HEIGHT = 5_000;

const lastBboxStrRef = ref<string | null>(null);
const OSMBuildingsDsRef = ref<DataSource | null>(null);

export function useGISDataStore() {
    return {
        MAX_OSM_FETCH_HEIGHT,
        lastBboxStrRef,
        OSMBuildingsDsRef
    };
}
