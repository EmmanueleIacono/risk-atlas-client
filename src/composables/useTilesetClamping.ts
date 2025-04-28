import { Transforms, Cartesian3, sampleTerrainMostDetailed, EllipsoidTerrainProvider } from "cesium";
import type { Cesium3DTileset } from "cesium";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useCesiumUtils } from "./useCesiumUtils";

const { viewerRef } = useCesiumStore();
const { extractTilesetBaseLocation } = useCesiumUtils();

async function clampTilesetToTerrain(tileset: Cesium3DTileset) {
  const viewer = viewerRef.value;
  if (!viewer) return;

  // 1) getting the tileset's root transform matrix
  const root_carto = extractTilesetBaseLocation(tileset);

  // 2) sampling terrain height at that position
  try {
    let position: Cartesian3;
    if (viewer.terrainProvider instanceof EllipsoidTerrainProvider) { // if ellipsoid, terrain height is assumed as 0
      const ellips_height = 0;
      position = Cartesian3.fromRadians(
        root_carto.longitude,
        root_carto.latitude,
        ellips_height
      );
    } else {
      const [updated_carto] = await sampleTerrainMostDetailed(viewer.terrainProvider, [root_carto], true);
      const newHeight = updated_carto.height ?? 0;
      // 3) building new transform matrix
      position = Cartesian3.fromRadians( // could also use root_carto for lon/lat, they don't change
        updated_carto.longitude,
        updated_carto.latitude,
        newHeight
      );
    }
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
