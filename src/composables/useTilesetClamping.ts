import { Transforms, Cartesian3, Math as CsmMath } from "cesium";
import type { Cesium3DTileset } from "cesium";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useCesiumUtils } from "./useCesiumUtils";

const { viewerRef } = useCesiumStore();
const { extractTilesetBaseLocation, computeTerrainHeightAtLocation } = useCesiumUtils();

async function clampTilesetToTerrain(tileset: Cesium3DTileset) {
  const viewer = viewerRef.value;
  if (!viewer) return;

  // 1) getting the tileset's root transform matrix
  const root_carto = extractTilesetBaseLocation(tileset);

  // 2) sampling terrain height at that position
  try {
    const root_carto_lon_degs = CsmMath.toDegrees(root_carto.longitude);
    const root_carto_lat_degs = CsmMath.toDegrees(root_carto.latitude);
    const terrain_height = await computeTerrainHeightAtLocation(root_carto_lon_degs, root_carto_lat_degs);

    // 3) building new transform matrix
    const position = Cartesian3.fromRadians(
      root_carto.longitude,
      root_carto.latitude,
      terrain_height ?? 0
    );

    // 4) applying new transform matrix to tileset's root
    // this approach works for tilesets created with the IFC-to-3DTiles converter
    // might not work for other tilesets - it all depends on where the "transform" matrix gets stored
    tileset.root.transform = Transforms.eastNorthUpToFixedFrame(position);
  } catch (err) {
    console.error("An error occured while updating the tileset's height:\n");
    console.error(err);
  }

  // what if here I return the tileset?
}

function attachClampWhenVisible(tileset: Cesium3DTileset) {
  function onTileVisible(ts: Cesium3DTileset) {
    clampTilesetToTerrain(tileset);
    tileset.tileVisible.removeEventListener(onTileVisible);
  }
  tileset.tileVisible.addEventListener(onTileVisible);
}

export function useTilesetClamping() {
  return {
    clampTilesetToTerrain,
    attachClampWhenVisible
  };
}
