import { Cartographic, Entity, Math as CsmMath, Cartesian3, ConstantPositionProperty } from "cesium";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useCesiumUtils } from "../composables/useCesiumUtils";

const { viewerRef, sensorsMapRef, availableSensorsMapRef } = useCesiumStore();
const { computeTerrainHeightAtLocation } = useCesiumUtils();

function addSensorToSensorsMap(
  sensor_id: string,
  sensor_sphere: Entity
) {
  if (!viewerRef.value) return;

  sensorsMapRef.value.set(sensor_id, sensor_sphere);
}

function flyToSensor(sensor_sphere: Entity) {
  const pos = sensor_sphere.position?.getValue(viewerRef.value?.clock.currentTime);
  if (pos) {
    viewerRef.value?.camera.flyTo({
      destination: pos,
      duration: 3,
    });
  }
}

async function updateSensorPositions() {
  sensorsMapRef.value.forEach(async (s, id) => {
    const pos = s.position?.getValue(viewerRef.value?.clock.currentTime);
    if (!pos) return;

    const pos_carto = Cartographic.fromCartesian(pos);
    console.log("old terrain_height: ", pos_carto.height);
    const lon_degs = CsmMath.toDegrees(pos_carto.longitude);
    const lat_degs = CsmMath.toDegrees(pos_carto.latitude);
    const terrain_height = await computeTerrainHeightAtLocation(lon_degs, lat_degs);
    const sensor_ground_height = availableSensorsMapRef.value.get(id)?.ground_h;
    if (typeof terrain_height !== "number" || typeof sensor_ground_height !== "number") return;
    console.log("new terrain_height: ", terrain_height);
    const new_sensor_height = terrain_height + sensor_ground_height;

    const new_pos = Cartesian3.fromDegrees(lon_degs, lat_degs, new_sensor_height);
    const new_pos_prop = new ConstantPositionProperty(new_pos);
    s.position = new_pos_prop;
  });
}

function removeAllSensors() {
  if (!viewerRef.value) return;

  sensorsMapRef.value.forEach(sensor => {
    viewerRef.value?.entities.remove(sensor);
  });

  sensorsMapRef.value = new Map();
}

export function useSensorsUtils() {
  return {
    addSensorToSensorsMap,
    flyToSensor,
    updateSensorPositions,
    removeAllSensors,
  };
}
