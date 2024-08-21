import { type VariantProps } from "class-variance-authority";
import type { avatarVariant } from "./avatar.config";

export { default as Avatar } from "./AvatarConsolidated.ce.vue";
export { default as AvatarImage } from "./AvatarImage.vue";
export { default as AvatarFallback } from "./AvatarFallback.vue";

export { avatarVariant } from "./avatar.config";
export type AvatarVariants = VariantProps<typeof avatarVariant>;
