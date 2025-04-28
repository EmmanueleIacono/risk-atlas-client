const raw_server_root: string = import.meta.env.VITE_ROOT_SERVER_URL;

const server_root = raw_server_root.replace(/\/+$/, "");

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

export function useServerStore() {
  return {
    buildProjectsUrl,
    buildClassesUrl,
    buildTilesetUrl
  };
}
