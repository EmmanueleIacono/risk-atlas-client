import { ref } from "vue";

const activeMenuRef = ref<string | null>(null);

function updateActiveMenuRef(selected_menu: string | null) {
    activeMenuRef.value = selected_menu;
}

export function useNavbarStore() {
    return {
        activeMenuRef,
        updateActiveMenuRef
    };
}
