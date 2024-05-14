// --- utils
import { keys, last, reduce, includes, startCase, set } from "lodash-es";

const iconsImport = import.meta.glob(`@icons/**/*.svg`, {
  as: "raw",
  eager: false,
});
// -----------------------------------------------------------------------------

export const useIcons = (filter?: string) => {
  const icons = reduce(
    keys(iconsImport),
    (result, key) => {
      if (filter && !includes(key, filter)) return result;
      const icon = last(key.split("/"))?.replace(".svg", "");
      if (icon) set(result, icon, startCase(icon));
      return result;
    },
    {}
  );

  return icons;
};
