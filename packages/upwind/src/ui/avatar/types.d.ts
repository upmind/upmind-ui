// --- external
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { avatarConfig } from "./avatar.config";
export type AvatarConfig = VariantProps<typeof avatarConfig>;
