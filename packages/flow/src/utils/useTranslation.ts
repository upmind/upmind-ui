//--- utils
import { get } from "lodash-es";

// --------------------------------------------------------

export const useTranslateField = (item: Object, field: string) => {
  const translated = get(item, `${field}_translated`, get(item, field));
  return translated;
};
