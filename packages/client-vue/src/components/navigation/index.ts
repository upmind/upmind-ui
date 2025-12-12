import { defineAsyncComponent } from "vue";

export const UpmBack = defineAsyncComponent(() => import("./Back.vue"));
export const UpmShare = defineAsyncComponent(() => import("./Share.vue"));
