import { type VariantProps } from "class-variance-authority";

export { default as UwAlert } from "./Alert.ce.vue";

export { alertConfig } from "./alert.config";
export type AlertVariants = VariantProps<typeof alertConfig>;
