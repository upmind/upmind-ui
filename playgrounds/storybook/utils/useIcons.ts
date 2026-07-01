import { keys, last, reduce, includes, startCase, set } from "lodash-es";

// const iconsRaw = import.meta.glob(`@icons/**/*.svg`, {
//   as: "raw",
//   eager: true,
//   import: "default",
// });

const iconsImport = import.meta.glob(`@icons/**/*.svg`, {
  eager: true,
  import: "default"
});
// -----------------------------------------------------------------------------

export enum iconOutput {
  URL = "url",
  NAME = "name"
  // SVG = "svg",
}

export const useIcons = (
  output: iconOutput = iconOutput.NAME,
  filter?: string
) => {
  const icons = reduce(
    keys(iconsImport),
    (result, key) => {
      if (filter && !includes(key, filter)) return result;
      let value: any = null;
      switch (output) {
        case iconOutput.URL:
          value = last(key.split("/"))?.replace(".svg", "").toUpperCase();
          if (value) set(result, value, key);

        // case iconOutput.SVG:
        //   value = last(key.split("/"))?.replace(".svg", "");
        //   const svg = iconsRaw[key];
        //   if (value) set(result, startCase(value), svg);

        case iconOutput.NAME:
        default:
          value = last(key.split("/"))?.replace(".svg", "");
          if (value) set(result, startCase(value), value);
      }

      return result;
    },
    {}
  );

  return icons;
};
