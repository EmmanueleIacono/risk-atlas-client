import { ref } from "vue";

const loading = ref<boolean>(false);

export function useGlobalStore() {
    return {
        loading
    };
}
