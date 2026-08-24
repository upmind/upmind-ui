export * from "./section";
export * from "./form";
// Expose the Icon resolver so app consumers (velia/hosting) can drop the
// old-lib <Icon> — the new lib is lucide-only and has no string-name resolver.
export { Icon } from "./icon";
export type { IconProps, IconRef } from "./icon";
export * from "./navigation";
export * from "./manage";
export * from "./footer";
export * from "./layout";
export * from "./header";
export * from "./shell";
export { default as UpmLocale } from "./LocaleSwitcher.vue";
export { default as UpmOverlayController } from "./overlays/OverlayController.vue";
export { useOverlayRoute } from "./overlays/useOverlayRoute";
export type { UseOverlayRoute } from "./overlays/useOverlayRoute";
