import { defineAsyncComponent } from "vue";
export const UpmSection = defineAsyncComponent(() => import("./Section.vue"));

export type { SectionItem } from "./types";
