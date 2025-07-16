import { ref } from "vue";
import { Color } from "cesium";

const defaultMaterialCesiumColor = Color.fromBytes(180, 180, 180, 255); // #b4b4b4
const defaultOutlineCesiumColor = Color.fromBytes(128, 128, 128, 255); // #808080
const deepTealCesiumColor = Color.fromBytes(0 , 123, 131, 255); // #007b83 (--RA-deep-teal)
const aquaAccentCesiumColor = Color.fromBytes(0 , 198, 179, 255); // #00c6b3 (--RA-aqua-accent)

const loading = ref<boolean>(false);
const activeOverlayRef = ref<string | null>(null);

function updateActiveOverlayRef(selected_overlay: string | null) {
  activeOverlayRef.value = selected_overlay;
}

export function useGlobalStore() {
  return {
    defaultMaterialCesiumColor,
    defaultOutlineCesiumColor,
    deepTealCesiumColor,
    aquaAccentCesiumColor,
    loading,
    activeOverlayRef,
    updateActiveOverlayRef,
  };
}
