import { variants } from "./link.config";
import { keys } from "lodash-es";

export { default as Link } from "./Link.ce.vue";
export { type LinkProps } from "./types";

export const LINK_COLORS = keys(variants.color);
export const LINK_SIZES = keys(variants.size);
