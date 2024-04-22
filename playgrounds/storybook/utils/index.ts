// ---utils
import { keys, last, reduce, map, startCase, set } from "lodash-es";

// -----------------------------------------------------------------------------

export const mapIcons = (path?: string) => {
  path = path?.replace("@icons/", "").replace("/*.svg");

  const safePath = path ? `@icons/${path}/*.svg` : "@icons/*.svg";

  const iconsImport = import.meta.glob(safePath, {
    as: "raw",
    eager: false,
  });

  const icons = reduce(
    keys(iconsImport),
    (result, key) => {
      const icon = last(key.split("/"))?.replace(".svg", "");
      set(result, icon, startCase(icon));
      return result;
    },
    {}
  );

  return icons;
};
