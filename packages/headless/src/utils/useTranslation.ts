//--- utils
import { get } from "lodash-es";

// ---
export const useTranslateField = (item: object, field: string) =>
  get(item, `${field}_translated`, get(item, field));

// check for a translated name, if it exists, use it, otherwise use the default
export const useTranslateName = (item: any) =>
  get(item, "name_translated", get(item, "name"));
