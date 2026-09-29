/**
 * @module foundation/renderers
 * @description The form-control registry.
 */
import type { UISchemaElement } from "@jsonforms/core";
import type { FormProps } from "@upmind/ui";

export type FormRendererEntry = NonNullable<
  FormProps["additionalRenderers"]
>[number];

export type UseFormRenderers = {
  renderers: FormRendererEntry[];
};

export type MissingControlRendererProps = {
  uischema: UISchemaElement;
};
