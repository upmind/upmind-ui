import { variants } from "./button.config";
import { keys } from "lodash-es";

export { default as Button } from "./Button.ce.vue";
export { type ButtonProps } from "./types";

export const BUTTON_VARIANTS = keys(variants.variant);
export const BUTTON_SIZES = keys(variants.size);
export const BUTTON_ALIGNMENTS = keys(variants.align);
