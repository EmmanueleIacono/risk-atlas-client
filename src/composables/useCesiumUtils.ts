import { Cesium3DTileset, Cartographic, Color, Matrix4, Cartesian4, Cartesian3, Rectangle, Math as CsmMath, PolygonGraphics, Entity, sampleTerrainMostDetailed, VerticalOrigin, Cartesian2, HeightReference, PropertyBag, EllipsoidTerrainProvider } from "cesium";
import { useCesiumStore } from "../stores/useCesiumStore";
import { useGlobalStore } from "../stores/useGlobalStore";

const { viewerRef, currentViewerBboxRef } = useCesiumStore();
const { deepTealCesiumColor, aquaAccentCesiumColor } = useGlobalStore();

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

function updateCurrentBbox() {
  if (!viewerRef.value) return;

  const rect = viewerRef.value.camera.computeViewRectangle();
  if (!rect) return;

  currentViewerBboxRef.value.south = CsmMath.toDegrees(rect.south);
  currentViewerBboxRef.value.west = CsmMath.toDegrees(rect.west);
  currentViewerBboxRef.value.north = CsmMath.toDegrees(rect.north);
  currentViewerBboxRef.value.east = CsmMath.toDegrees(rect.east);
}

function colorDataSourceEntityById(
  dataSourceName: string,
  id: string | number,
  materialColor: Color | undefined = undefined,
  outlineColor: Color | undefined = undefined
) {
  if (!viewerRef.value) return;

  if (typeof id === 'number') id = id.toString();

  const dataSource = viewerRef.value.dataSources.getByName(dataSourceName)[0];
  const entity = dataSource.entities.getById(id);

  if (!entity || !entity.polygon) return;

  // dummy prop container
  const propContainer = new PolygonGraphics({
    material: materialColor,
    outlineColor: outlineColor,
  });

  if (materialColor) entity.polygon.material = propContainer.material;
  if (outlineColor) entity.polygon.outlineColor = propContainer.outlineColor;
}

function colorDataSourceEntity(
  entity: Entity,
  materialColor: Color | undefined = undefined,
  outlineColor: Color | undefined = undefined
) {
  if (!viewerRef.value) return;

  if (!entity || !entity.polygon) return;

  // dummy prop container
  const propContainer = new PolygonGraphics({
    material: materialColor,
    outlineColor: outlineColor,
  });

  if (materialColor) entity.polygon.material = propContainer.material;
  if (outlineColor) entity.polygon.outlineColor = propContainer.outlineColor;
}

async function computeTerrainHeightAtLocation(
  longitude_degs: number,
  latitude_degs: number
): Promise<number | void> {
  if (!viewerRef.value) return;
  const viewer = viewerRef.value;

  let terrain_height: number;
  try {
    if (viewer.terrainProvider instanceof EllipsoidTerrainProvider) { // if ellipsoid, terrain height is assumed as 0
      terrain_height = 0;
    } else {
      const cartographics = Cartographic.fromDegrees(longitude_degs, latitude_degs);
      const [updated_carto] = await sampleTerrainMostDetailed(
        viewer.terrainProvider,
        [cartographics],
        true
      );
      terrain_height = updated_carto.height ?? 0;
    }
    return terrain_height;
  } catch (err) {
    console.error("An error occured while computing the terrain height:\n");
    console.error(err);
  }
}

async function createSphere(
  name: string,
  longitude: number,
  latitude: number,
  height_from_ground: number,
  radius: number = 1000,
  properties: { [key: string]: any } = {},
): Promise<Entity | undefined> {
  if (!viewerRef.value) return;

  const terrainHeight = await computeTerrainHeightAtLocation(longitude, latitude);
  const finalHeight = (terrainHeight ?? 0) + height_from_ground;

  const position = Cartesian3.fromDegrees(
    longitude,
    latitude,
    finalHeight
  );

  let props_bag: PropertyBag | undefined;
  let descr: string | undefined;
  if (Object.entries(properties).length > 0) {
    props_bag = new PropertyBag(properties);
    descr = makeInfoBoxDescription(properties);
  }

  const sphere = viewerRef.value.entities.add(
    {
      position: position,
      ellipsoid: {
        radii: new Cartesian3(radius, radius, radius),
        material: deepTealCesiumColor,
      },
      label: {
        text: name,
        font: '10pt sans-serif',
        fillColor: aquaAccentCesiumColor,
        showBackground: true,
        backgroundColor: Color.BLACK,
        backgroundPadding: new Cartesian2(5, 5),
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -radius * 50),
        heightReference: HeightReference.NONE, // using NONE so the label stays glued to the sphere's position
      },
      properties: props_bag,
      name: name,
      description: descr,
    }
  );

  return sphere;
}

function makeInfoBoxDescription(props: { [key: string]: any }): string {
  // building a simple HTML table of key/valye rows
  const rows = Object.entries(props)
    .map(([key, val]) =>
      `<tr>
        <th><b>${key}</b></th>
        <td>${val}</td>
      </tr>`
    )
    .join('');

  return `<table class="cesium-infoBox-defaultTable">${rows}</table>`; // class name "cesium-infoBox-defaultTable" ensures same style of default Cesium InfoBox
}

export function useCesiumUtils() {
  return {
    cleanProjectId,
    extractTilesetBaseLocation,
    createRectangleFromPoint,
    flyToTileset,
    updateCurrentBbox,
    colorDataSourceEntityById,
    colorDataSourceEntity,
    computeTerrainHeightAtLocation,
    createSphere,
    makeInfoBoxDescription,
  };
}
