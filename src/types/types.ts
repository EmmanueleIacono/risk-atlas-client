type NavbarItem = {
  name: string;
};

type ProjectInfo = {
  project_id: string;
  project_description: string | null;
};

type IfcClassesInfo = {
  project_id: string;
  ifc_classes: string[];
};

type TilesetLocationInfo = {
  tileset_id: string,
  longitude: number,
  latitude: number
};

export {
  NavbarItem,
  ProjectInfo,
  IfcClassesInfo,
  TilesetLocationInfo
}
