<template>
  <div class="cesium-container" ref="containerRef"></div>
</template>

<script setup lang="ts">
import { useCesiumStore } from "../stores/useCesiumStore";
import { ref, onMounted } from "vue";
import { Viewer, createWorldTerrainAsync, NearFarScalar, Cartesian3, Math } from "cesium";
import { useTilesetClamping } from "../composables/useTilesetClamping";

const NL = { // birdseye view over the whole NL
  lat: 50.356,
  lon: 5.217,
  z_from_ellipsoid: 120_000
};

const containerRef = ref<HTMLDivElement | null>(null);

const { viewerRef, tilesetsMapRef } = useCesiumStore();
const { attachClampWhenVisible } = useTilesetClamping();

onMounted(async () => {
  if (containerRef.value) {
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

    // fly to NL
    viewerRef.value.camera.flyTo({
      destination: Cartesian3.fromDegrees(NL.lon, NL.lat, NL.z_from_ellipsoid),
      orientation: {
        heading: Math.toRadians(0.0),
        pitch: Math.toRadians(-35.0),
      }
    });
  }
});
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
