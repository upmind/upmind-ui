import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type {
  ValidationErrorObject,
  QueryResponseError,
} from "@upmind-automation/headless";
import type { ComputedRef, Ref } from "vue";

// -----------------------------------------------------------------------------
/**
 * These types represent the shape of the composables used in the ManageRenderer.
 * They are designed to be minimal and focus on the essential properties and methods
 * needed for the renderer to function correctly.
 */
export type MinimalListComposable = (...args: any) => {
  isReady: () => Promise<boolean>;
  meta: ComputedRef<Record<string, boolean>>;
  data: ComputedRef<any[]> | Ref<any[]>;
  default: ComputedRef<any>;
};

export type MinimalMutateComposable = (...args: any) => {
  isReady: () => Promise<boolean>;
  meta: ComputedRef<Record<string, boolean>>;
  model: ComputedRef<Record<string, any>> | Ref<Record<string, any>>;
  update: (value?: Record<string, any>) => Promise<any>;
  clear: () => void;
  input: (value: Record<string, any>) => Promise<any>;
  schema: ComputedRef<JsonSchema>;
  uischema: ComputedRef<UISchemaElement>;
  stop: () => void;
  errors: ComputedRef<QueryResponseError["message"]>;
  validationErrors: ComputedRef<ValidationErrorObject[]>;
};

export type ManageRendererProps = {
  list: MinimalListComposable;
  mutate: MinimalMutateComposable;
};
