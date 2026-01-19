import { defineAsyncComponent } from "vue";
export const UpmSection = defineAsyncComponent(() => import("./Section.vue"));
export const UpmSections = defineAsyncComponent(() => import("./Sections.vue"));

export type { SectionItem } from "./types";
