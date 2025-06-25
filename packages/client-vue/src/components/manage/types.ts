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

export type MinimalMutateComposable = (
  id?: string | any, // its very generic, usually a string but can be any other type
  ...args: any
) => {
  isReady: () => Promise<boolean>;
  meta: ComputedRef<Record<string, boolean>>;
  model:
    | ComputedRef<Record<string, any>>
    | Ref<Record<string, any> | undefined>;
  schema: ComputedRef<JsonSchema | undefined>;
  uischema: ComputedRef<UISchemaElement | undefined>;
  errors: ComputedRef<QueryResponseError["message"] | undefined>;
  validationErrors: ComputedRef<ValidationErrorObject[] | undefined>;
  update: (value?: Record<string, any>) => Promise<any>;
  clear: () => void;
  input: (value: Record<string, any>) => Promise<any> | void | undefined;
  stop: () => void;
};

export type ManageRendererProps = {
  useList: MinimalListComposable;
  useMutate: MinimalMutateComposable;
};
