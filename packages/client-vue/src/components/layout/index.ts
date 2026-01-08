import { defineAsyncComponent } from "vue";

export const UpmLayout = defineAsyncComponent(() => import("./Layout.vue"));
export const UpmContainer = defineAsyncComponent(
  () => import("./components/container/Container.vue")
);
export const UpmColumn = defineAsyncComponent(
  () => import("./components/column/Column.vue")
);
export const UpmRibbon = defineAsyncComponent(
  () => import("./components/ribbon/Ribbon.vue")
);
export const UpmContent = defineAsyncComponent(
  () => import("./components/content/Content.vue")
);
export const UpmRoot = defineAsyncComponent(
  () => import("./components/root/Root.vue")
);

export type { LayoutProps } from "./types";
export { LAYOUT_VARIANTS } from "./types";

export { useLayout } from "./useLayout";
export type { LayoutProps as UseLayoutProps } from "./types";
