// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Skeleton } from "./Skeleton.ce.vue";

// --- custom elements
import Skeleton from "./Skeleton.ce.vue";
export const UwSkeleton = defineCustomElement(Skeleton);
