import { defineAsyncComponent } from "vue";

export * from "./section";
export * from "./form";
export * from "./navigation";
export * from "./manage";
export * from "./footer";
export * from "./layout";
export * from "./header";
export * from "./emailHistory";

export const UpmLocale = defineAsyncComponent(
  () => import("./LocaleSwitcher.vue")
);
