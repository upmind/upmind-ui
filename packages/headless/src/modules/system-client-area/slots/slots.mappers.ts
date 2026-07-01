/** @internal */
import { useTranslateField, useTranslateName } from "../../../utils";
import type { ClientTemplateSlot } from "./slots.types";
import type { IClientTemplateSlot } from "@upmind-automation/types";

export function parseClientSlot(raw: IClientTemplateSlot): ClientTemplateSlot {
  return {
    id: raw.id,
    code: raw.code,
    title: useTranslateName(raw),
    categoryId: raw.category_id,
    description: useTranslateField(raw, "description"),
    ...(raw.category && {
      category: {
        id: raw.category.id,
        code: raw.category.code,
        title: useTranslateName(raw.category)
      }
    })
  };
}
