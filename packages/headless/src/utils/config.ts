import { ref } from "vue";

/**
 * Global configuration state for the headless library.
 * This is used to share simple state like 'admin mode' across modules
 * without creating circular dependencies between useUpmind and the modules.
 */
export const isAdmin = ref(false);
export const storefrontUrl = ref<string | undefined>(undefined);
