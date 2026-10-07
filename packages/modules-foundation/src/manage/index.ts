// -----------------------------------------------------------------------------
/**
 * @module foundation/manage
 * @description The reusable collection-manage kit: a row list, a mutate form, and shared frames.
 */

export { default as Manage } from "./Manage.vue";
export { default as ManageForm } from "./Form.vue";
export { default as ManageSkeleton } from "./Skeleton.vue";

export type {
  ManageRendererProps,
  MinimalListComposable,
  MinimalMutateComposable
} from "./types";
