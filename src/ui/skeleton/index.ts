import { defineCustomElement } from "vue";
import Skeleton from "./Skeleton.ce.vue";

export { default as Skeleton } from "./Skeleton.ce.vue";
export { default as SkeletonList } from "./SkeletonList.vue";
export * from "./types";

export const UpmSkeleton = defineCustomElement(Skeleton);
