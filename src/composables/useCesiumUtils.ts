import { Cesium3DTileset, Cartographic, Matrix4, Cartesian4, Cartesian3, Rectangle } from "cesium";
import { useCesiumStore } from "../stores/useCesiumStore";

const { viewerRef } = useCesiumStore();

function cleanProjectId(raw_project_id: string): string {
  const clean_tileset_id: string = raw_project_id.includes("?filters=") ? raw_project_id.split("?filters=")[0] : raw_project_id;
  return clean_tileset_id;
}

function extractTilesetBaseLocation(tileset: Cesium3DTileset): Cartographic {
  const tileset_transform: Cartesian4 = Matrix4.getColumn(tileset.root.transform, 3, new Cartesian4());
  const tileset_location_cartesian = new Cartesian3(tileset_transform.x, tileset_transform.y, tileset_transform.z);
  const tileset_location_carto = Cartographic.fromCartesian(tileset_location_cartesian);

  return tileset_location_carto;
}

function createRectangleFromPoint(longitude_rads: number, latitude_rads: number): Rectangle {
  const circle_radius_mt: number = 200; // radius of encircled circle in meters
  const earth_radius_mt: number = 6_378_137; // radius of Earth in meters

  // calculating the lon and lat offset in radians
  const lon_radius_rads = circle_radius_mt / (earth_radius_mt * Math.cos(latitude_rads)); // for lon, the distance varies with cosine of lat
  const lat_radius_rads = circle_radius_mt / earth_radius_mt;

  const rectangle = new Rectangle(
    longitude_rads - lon_radius_rads, // west
    latitude_rads - lat_radius_rads, // south
    longitude_rads + lon_radius_rads, // east
    latitude_rads + lat_radius_rads // north
  );

  return rectangle;
}

function flyToTileset(tileset: Cesium3DTileset | undefined) {
  if (!tileset) return;

  const tileset_carto = extractTilesetBaseLocation(tileset);
  const flyTo_position: Rectangle = createRectangleFromPoint(tileset_carto.longitude, tileset_carto.latitude);
  viewerRef.value?.camera.flyTo({
    destination: flyTo_position,
    complete: async () => { // once the camera has arrived over the tileset's location, I zoom on it
      await viewerRef.value?.flyTo(tileset, {
        duration: 3,
      });
    }
  });
}

export function useCesiumUtils() {
  return {
    cleanProjectId,
    extractTilesetBaseLocation,
    createRectangleFromPoint,
    flyToTileset
  };
}
