//--- utils
import { get } from "lodash-es";

// --------------------------------------------------------

export const useTranslateField = (item: Object, field: string) => {
  const translated = get(item, `${field}_translated`, get(item, field));
  return translated;
};

// check for a translated name, if it exists, use it, otherwise use the default
export const useTranslateName = (item: any) =>
  item?.name_translated || item.name;
