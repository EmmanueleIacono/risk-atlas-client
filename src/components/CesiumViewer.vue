<template>
  <div class="cesium-container" ref="containerRef"></div>
</template>

<script setup lang="ts">
import { useCesiumStore } from "../stores/useCesiumStore";
import { ref, onMounted } from "vue";
import { Camera, Viewer, createWorldTerrainAsync, NearFarScalar, Rectangle } from "cesium";
import { useCesiumUtils } from "../composables/useCesiumUtils";
import { useTilesetClamping } from "../composables/useTilesetClamping";

const home_EU = {
  west: -0.2222,
  south: 0.63626,
  east: 0.7169,
  north: 1.2155
};

const containerRef = ref<HTMLDivElement | null>(null);

const { viewerRef, tilesetsMapRef } = useCesiumStore();
const { updateCurrentBbox } = useCesiumUtils();
const { attachClampWhenVisible } = useTilesetClamping();

onMounted(async () => {
  if (containerRef.value) {
    // home button location settings
    Camera.DEFAULT_VIEW_RECTANGLE = new Rectangle(home_EU.west, home_EU.south, home_EU.east, home_EU.north);

    // viewer init
    viewerRef.value = new Viewer(
      containerRef.value,
      {
        // WIDGETS OPTIONS
        homeButton: true, // default home relocation button
        sceneModePicker: false, // 3D, 2D, Columbus
        baseLayerPicker: true, // base map image layers
        navigationHelpButton: true, // the "?" button
        navigationInstructionsInitiallyVisible: false, // if true, it opens at first launch
        infoBox: true, // the "property panel" that shows up when clicking on an item
        animation: false, // bottom-left animation widget
        timeline: false, // bottom timeline widget
        fullscreenButton: false, // bottom-right full screen button
        // SHADOWS
        shadows: false, // determines if shadows are cast by light sources
        // TERRAIN
        terrainProvider: await createWorldTerrainAsync(),
      }
    );

    // settings to allow navigation below the surface:
    viewerRef.value.scene.screenSpaceCameraController.minimumZoomDistance = -50.0; // Allow zooming below ground
    viewerRef.value.scene.globe.depthTestAgainstTerrain = false; // Disable depth test against terrain to see below ground
    viewerRef.value.scene.globe.translucency.enabled = true;
    viewerRef.value.scene.globe.translucency.frontFaceAlphaByDistance = new NearFarScalar(10, 0.5, 50, 1.0);
    viewerRef.value.scene.globe.translucency.backFaceAlpha = 1;
    viewerRef.value.scene.terrainProviderChanged.addEventListener(() => {
      for (const ts of tilesetsMapRef.value.values()) {
        attachClampWhenVisible(ts);
      }
    });

    viewerRef.value.camera.moveEnd.addEventListener(onCameraMoveEnd);

  }
});

function onCameraMoveEnd() {
  updateCurrentBbox();
}
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: calc(100vh - 3rem);
  margin: 0;
  padding: 0;
}
</style>
