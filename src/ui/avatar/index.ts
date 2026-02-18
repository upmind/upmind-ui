import { defineCustomElement } from "vue";
import Avatar from "./Avatar.ce.vue";
import { variants } from "./avatar.config";
import { parseVariants, type VariantValues } from "../../utils";

export { default as Avatar } from "./Avatar.ce.vue";
export { type AvatarProps } from "./types";

export const UpmAvatar = defineCustomElement(Avatar);

export const AVATAR_COLORS = parseVariants(variants.color);
export const AVATAR_SIZES = parseVariants(variants.size);
export const AVATAR_SHAPES = parseVariants(variants.shape);
export const AVATAR_FIT = parseVariants(variants.fit);

export type AVATAR_COLORS = VariantValues<typeof AVATAR_COLORS>;
export type AVATAR_SIZES = VariantValues<typeof AVATAR_SIZES>;
export type AVATAR_SHAPES = VariantValues<typeof AVATAR_SHAPES>;
export type AVATAR_FIT = VariantValues<typeof AVATAR_FIT>;
