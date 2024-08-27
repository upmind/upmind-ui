// --- utils
import { keys, last, reduce, includes, startCase, set } from "lodash-es";

const iconsImport = import.meta.glob(`@icons/**/*.svg`, {
  as: "raw",
  eager: false,
  import: "default",
});

const iconsUrls = import.meta.glob(`@icons/**/*.svg`, {
  eager: true,
  import: "default",
});
// -----------------------------------------------------------------------------

export const useIcons = (filter?: string) => {
  const icons = reduce(
    keys(iconsImport),
    (result, key) => {
      if (filter && !includes(key, filter)) return result;
      const icon = last(key.split("/"))?.replace(".svg", "");
      const svg = iconsImport[key];
      if (icon) set(result, startCase(icon), svg);
      return result;
    },
    {}
  );

  return icons;
};

export const useIconUrls = (filter?: string) => {
  const icons = reduce(
    keys(iconsUrls),
    (result, key) => {
      if (filter && !includes(key, filter)) return result;
      const icon = last(key.split("/"))?.replace(".svg", "").toUpperCase();
      set(result, icon, key);
      return result;
    },
    {}
  );

  return icons;
};
