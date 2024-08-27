// --- external
import { type VariantProps } from "class-variance-authority";

// --- components
export { default as UwCombobox } from "./Combobox.vue";
export { default as UwComboboxItem } from "./ComboboxItem.vue";

// --- types
import type { comboboxConfig } from "./combobox.config";
export type ComboboxConfig = VariantProps<typeof comboboxConfig>;
