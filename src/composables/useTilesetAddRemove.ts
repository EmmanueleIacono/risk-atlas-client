import { Cesium3DTileset, type Cartographic } from "cesium";
import { useServerStore } from "../stores/useServerStore";
import { useCesiumStore } from "../stores/useCesiumStore";
import { TilesetLocationInfo } from "../types/types";
import { useTilesetClamping } from "./useTilesetClamping";
import { useCesiumUtils } from "./useCesiumUtils";

const { buildTilesetUrl } = useServerStore();
const { viewerRef, tilesetsMapRef, tilesetsLocationsMapRef } = useCesiumStore();
const { cleanProjectId, extractTilesetBaseLocation } = useCesiumUtils();
const { attachClampWhenVisible } = useTilesetClamping();

async function add3DTilesetToViewer(project_id: string) {
  try {
    const full_url = buildTilesetUrl(project_id);
    const tileset = await Cesium3DTileset.fromUrl(full_url, {
      debugShowBoundingVolume: false,
    });
    viewerRef.value?.scene.primitives.add(tileset);
    attachClampWhenVisible(tileset);
    const clean_project_id: string = cleanProjectId(project_id);
    addTilesetToMapRef(clean_project_id, tileset);
    const tileset_carto: Cartographic = extractTilesetBaseLocation(tileset);
    addTilesetLocationToMapRef(clean_project_id, tileset_carto.longitude, tileset_carto.latitude);
    return {
      tileset: tileset,
      tileset_id: clean_project_id
    }
  } catch (err) {
    console.error(`Error while creating the tileset: ${err}`);
  }
}

function addTilesetToMapRef(project_id: string, tileset: Cesium3DTileset) {
  tilesetsMapRef.value.set(project_id, tileset);
}

function addTilesetLocationToMapRef(
  tileset_id: string,
  longitude: number,
  latitude: number
): TilesetLocationInfo {
  const tileset_loc_info: TilesetLocationInfo = {
    tileset_id,
    longitude,
    latitude
  };

  tilesetsLocationsMapRef.value.set(tileset_id, tileset_loc_info);

  return tileset_loc_info;
}

function removeAllTilesets() {
  if (!viewerRef.value) return;

  tilesetsMapRef.value.forEach(ts => {
    viewerRef.value?.scene.primitives.remove(ts);
  });

  tilesetsMapRef.value = new Map();
  tilesetsLocationsMapRef.value = new Map();
}

export function useTilesetAddRemove() {
  return {
    add3DTilesetToViewer,
    removeAllTilesets,
  };
}
