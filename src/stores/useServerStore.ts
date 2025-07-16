const raw_server_root: string = import.meta.env.VITE_ROOT_SERVER_URL;
const raw_websocket_root: string = import.meta.env.VITE_WS_URL;

// removing trailing slashes
const server_root = raw_server_root.replace(/\/+$/, "");
const websocket_root = raw_websocket_root.replace(/\/+$/, "");

function buildProjectsUrl() {
  return `${server_root}/tilesets/projects`;
}

function buildClassesUrl() {
  return `${server_root}/elements/ifc_classes`;
}

function buildTilesetUrl(project_id: string) {
  const clean_project_id: string = project_id.replace(/^\/+/, "");
  return `${server_root}/tilesets/${clean_project_id}`;
}

function buildOSMBuildingsUrl() {
  return `${server_root}/geospatial/fgb/osm/buildings`;
}

function buildFloodHazardUrl() {
  return `${server_root}/risk-scores/hazards/flood`;
}

function buildWsBaseSensorsUrl() {
  return `${websocket_root}/ws-sensors`;
}

export function useServerStore() {
  return {
    buildProjectsUrl,
    buildClassesUrl,
    buildTilesetUrl,
    buildOSMBuildingsUrl,
    buildFloodHazardUrl,
    buildWsBaseSensorsUrl,
  };
}
