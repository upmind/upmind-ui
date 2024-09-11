// --- exports
export * from "./useIcons";

// --- utils
import { useIcons, iconOutput } from "./useIcons";
import { keys, values, invert } from "lodash-es";

// ----------------------------------------------------------------------------

const iconUrls = useIcons(iconOutput.URL);
const icons = useIcons(iconOutput.NAME);
// const iconSvgs = useIcons();

enum colors {
  base = "Base",
  primary = "Primary",
  secondary = "Secondary",
  accent = "Accent",
  promotion = "Promotion",
  destructive = "Destructive",
  success = "Success",
  info = "Info",
  error = "Error",
  warning = "Warning",
}
enum baseSizes {
  sm = "Small",
  md = "Medium",
  lg = "Large",
}

enum sizes {
  xs = "Extra Small",
  sm = "Small",
  md = "Medium",
  lg = "Large",
  icon = "Icon",
}
enum allSizes {
  xs = "Extra Small",
  sm = "Small",
  md = "Medium",
  lg = "Large",
  xl = "Extra Large",
  "2xl" = "2 Extra Large",
}

enum placements {
  "top" = "Top",
  "bottom" = "Bottom",
  "left" = "Left",
  "right" = "Right",
  "bottom-start" = "Bottom Start",
  "bottom-end" = "Bottom End",
  "top-start" = "Top Start",
  "top-end" = "Top End",
  "left-start" = "Left Start",
  "left-end" = "Left End",
  "right-start" = "Right Start",
  "right-end" = "Right End",
}

export const useSystemArgTypes = {
  placement: {
    options: keys(placements),
    control: {
      type: "select",
      labels: placements,
    },
  },

  color: {
    options: keys(colors),
    control: {
      type: "select",
      labels: colors,
    },
  },
  size: {
    options: keys(sizes),
    control: {
      type: "radio",
      labels: sizes,
    },
  },
  baseSizes: {
    options: keys(baseSizes),
    control: {
      type: "radio",
      labels: baseSizes,
    },
  },
  allSizes: {
    options: keys(allSizes),
    control: {
      type: "radio",
      labels: allSizes,
    },
  },
  icon: {
    options: values(icons),
    control: {
      type: "select",
      labels: invert(icons),
    },
  },
  // iconSvgs: {
  //   options: values(iconSvgs),
  //   control: {
  //     type: "select",
  //     labels: invert(iconSvgs),
  //   },
  // },
  flag: {
    options: values(iconUrls),
    control: {
      type: "select",
      labels: invert(iconUrls),
    },
  },
};
