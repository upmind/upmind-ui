// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Avatar } from "./Avatar.ce.vue";
export { type AvatarProps } from "./types";

// --- custom elements
import Avatar from "./Avatar.ce.vue";
export const UpmAvatar = defineCustomElement(Avatar);
