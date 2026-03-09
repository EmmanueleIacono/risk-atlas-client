<template>
  <div v-if="visible" class="cesium-tooltip" :style="tooltipStyle" v-html="tooltipHtml">
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, CSSProperties } from "vue";
import { Color, DataSource, defined, Entity, GeoJsonDataSource, PolygonHierarchy, ScreenSpaceEventHandler, ScreenSpaceEventType } from "cesium";
import { DataSourceEntityData } from "../types/types";
import { useGlobalStore } from "../stores/useGlobalStore";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useCesiumUtils } from "../composables/useCesiumUtils";

const { defaultMaterialCesiumColor, defaultOutlineCesiumColor, deepTealCesiumColor, aquaAccentCesiumColor } = useGlobalStore();
const { viewerRef, selectedDataSourceEntityRef } = useCesiumStore();
const { colorDataSourceEntityById } = useCesiumUtils();

const x = ref<number>(0);
const y = ref<number>(0);
const z = ref<number>(0);
const tooltipHtml = ref<string>("");
const visible = ref<boolean>(false);
const previousPickedTiles = ref<any[]>([]);

let handler: ScreenSpaceEventHandler | null = null;

const previousSelectedStyleRef = ref<{
  data_source_name: string;
  id: string;
  polygonMaterial?: any;
  polygonOutlineColor?: any;
  pointColor?: any;
  pointOutlineColor?: any;
  billboardColor?: any;
} | null>(null);

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
  if (!pickedObject) { // no selection? default-color previous selection and remove it from ref
    if (selectedDataSourceEntityRef.value) {
      restoreCapturedStyle();
      selectedDataSourceEntityRef.value = null;
    }
  } else { // something is selected? proceed
    console.log("Picked object:", pickedObject);

    if (pickedObject.id && pickedObject.id instanceof Entity) {
      const entity = pickedObject.id as Entity;
      const entityId = entity.id;
      const entityCollection = entity.entityCollection;
      const entityCollectionOwner = entityCollection.owner;
      if (entityCollectionOwner instanceof DataSource || entityCollectionOwner instanceof GeoJsonDataSource) {
        const owner = entityCollectionOwner as DataSource;
        const entityCollectionName = owner.name;

        const entityData: DataSourceEntityData = {
          id: entityId,
          data_source_name: entityCollectionName,
        };

        if (
          selectedDataSourceEntityRef.value &&
          selectedDataSourceEntityRef.value.id === entityData.id &&
          selectedDataSourceEntityRef.value.data_source_name === entityData.data_source_name
        ) return;

        if (selectedDataSourceEntityRef.value) {
          // first, if present, reset the coloring of the previous selection
          restoreCapturedStyle();
        }
        previousSelectedStyleRef.value = captureEntityStyle(entityData);
        // color highlight the new selection
        colorDataSourceEntityById(
          entityData.data_source_name,
          entityData.id,
          deepTealCesiumColor,
          aquaAccentCesiumColor
        );
        // then, update the selected entity ref
        selectedDataSourceEntityRef.value = entityData;
      }

      const hierarchy = entity.polygon?.hierarchy?.getValue(viewerRef.value.clock.currentTime);
      if (hierarchy instanceof PolygonHierarchy) {
        const polygonHierarchy = hierarchy as PolygonHierarchy;
        console.log("polygon POSITIONS:\n", polygonHierarchy.positions);
      }
    }
  }
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

// some helpers
function findEntityInDataSource(dataSourceName: string, id: string): Entity | null {
  if (!viewerRef.value) return null;
  const ds = viewerRef.value.dataSources.getByName(dataSourceName)[0];
  if (!ds) return null;
  return ds.entities.getById(id) ?? null;
}

function captureEntityStyle(data: DataSourceEntityData) {
  const e = findEntityInDataSource(data.data_source_name, data.id);
  if (!e) return null;
  return {
    data_source_name: data.data_source_name,
    id: data.id,
    polygonMaterial: e.polygon?.material,
    polygonOutlineColor: e.polygon?.outlineColor,
    pointColor: e.point?.color,
    pointOutlineColor: e.point?.outlineColor,
    billboardColor: e.billboard?.color,
  };
}

function restoreCapturedStyle() {
  const s = previousSelectedStyleRef.value;
  if (!s) return;
  const e = findEntityInDataSource(s.data_source_name, s.id);
  if (!e) return;
  if (e.polygon) {
    e.polygon.material = s.polygonMaterial;
    e.polygon.outlineColor = s.polygonOutlineColor;
  }
  if (e.point) {
    e.point.color = s.pointColor;
    e.point.outlineColor = s.pointOutlineColor;
  }
  if (e.billboard) {
    e.billboard.color = s.billboardColor;
  }
  previousSelectedStyleRef.value = null;
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
