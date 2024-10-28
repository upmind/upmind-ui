// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Skeleton } from "./Skeleton.ce.vue";
export { default as SkeletonList } from "./SkeletonList.vue";
export * from "./types";

// --- custom elements
import Skeleton from "./Skeleton.ce.vue";
export const UwSkeleton = defineCustomElement(Skeleton);
