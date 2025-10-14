// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";

// --- vue elements
export { default as Avatar } from "./Avatar.ce.vue";
export { type AvatarProps } from "./types";

// --- custom elements
import Avatar from "./Avatar.ce.vue";
export const UpmAvatar = defineCustomElement(Avatar);

// types
import { variants } from "./avatar.config";
export const AVATAR_COLORS = keys(variants.color);
export const AVATAR_SIZES = keys(variants.size);
export const AVATAR_SHAPES = keys(variants.shape);
export const AVATAR_FIT = keys(variants.fit);
