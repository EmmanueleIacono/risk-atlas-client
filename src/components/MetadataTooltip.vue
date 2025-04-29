<template>
  <div v-if="visible" class="cesium-tooltip" :style="tooltipStyle" v-html="tooltipHtml">
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, CSSProperties } from "vue";
import { Color, defined, ScreenSpaceEventHandler, ScreenSpaceEventType } from "cesium";
import { useCesiumStore } from "../stores/useCesiumStore";

const {viewerRef} = useCesiumStore();

const x = ref<number>(0);
const y = ref<number>(0);
const z = ref<number>(0);
const tooltipHtml = ref<string>("");
const visible = ref<boolean>(false);
const previousPickedTiles = ref<any[]>([]);

let handler: ScreenSpaceEventHandler | null = null;

// this computes the CSS style object of the tooltip
const tooltipStyle = computed<CSSProperties>(() => {
  return {
    position: "absolute",
    left: x.value + "px",
    top: y.value + "px",
    backgroundColor: "black",
    color: "white",
    padding: "14px",
    pointerEvents: "none",
    blockSize: "fit-content"
  }
});

// this builds the HTML for a metadata object
function createMetadataHtml(title: string, metadata: any) {
  if (!defined(metadata)) return "";

  const propertyKeys = metadata.getPropertyIds();
  let html = `<b>${title}:</b><br>`;

  for (const key of propertyKeys) {
    const value = metadata.getProperty(key);
    html += `&nbsp;&nbsp;${key}: ${value}<br>`;
  }

  return html;
}

// this handles the mouse movement events
function onMouseMove(movement: any) {
  if (!viewerRef.value) return;

  const canvas_rect = viewerRef.value.scene.canvas.getBoundingClientRect(); // canvas space
  const local = movement.endPosition;

  previousPickedTiles.value.forEach(p => {
    p.content._tile.color = undefined;
  });

  const picked = viewerRef.value.scene.pick(local);
  if (!picked || !picked.content) { // nothing picked? hide the tooltip
    visible.value = false;
    return;
  }

  let text = "";

  // tile metadata (other metadata types can be added later)
  const tileMetadata = picked.content.tile?.metadata;
  if (tileMetadata) {
    text += createMetadataHtml("Tile metadata", tileMetadata);
  }

  // update tooltip position/content
  x.value = local.x + canvas_rect.left;
  y.value = local.y + canvas_rect.top;
  tooltipHtml.value = text;
  visible.value = !!text; // visible if there IS text to show

  previousPickedTiles.value.push(picked);
  picked.content._tile.color = new Color(1, 0, 0, .5);
}

// this handles the mouse (left) click events
function onLeftClick(movement: any) {
  if (!viewerRef.value) return;

  const pickedObject = viewerRef.value.scene.pick(movement.position);
  console.log("Picked object:", pickedObject);
}

// utility "throttle" function to attempt at fixing the slow update of the tooltip
function throttle<T extends (...args: any[]) => void>(fn: T, wait: number): T {
  let lastTime = 0;
  return function throttled(this: any, ...args: Parameters<T>) {
      const now = Date.now();
      if (now - lastTime >= wait) {
        lastTime = now;
        fn.apply(this, args);
      }
    } as T;
}

const onMouseMoveThrottled = throttle(onMouseMove, 50); // 50 ms -> 20 times per second

onMounted(() => {
  handler = new ScreenSpaceEventHandler(viewerRef.value?.scene.canvas);

  handler.setInputAction(onMouseMoveThrottled, ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction(onLeftClick, ScreenSpaceEventType.LEFT_CLICK);
});

onBeforeUnmount(() => {
  // cleaning up the event handler
  if (handler) {
    handler.destroy();
    handler = null;
  }
});
</script>

<style scoped>
</style>
