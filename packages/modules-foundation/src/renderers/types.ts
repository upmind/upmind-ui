/**
 * @module foundation/renderers
 * @description The form-control registry.
 */
import type { FormProps } from "@upmind/ui";
import type { ShallowRef } from "vue";

export type FormRendererEntry = NonNullable<
  FormProps["additionalRenderers"]
>[number];

export type UseFormRenderers = {
  renderers: ShallowRef<FormRendererEntry[]>;
};
