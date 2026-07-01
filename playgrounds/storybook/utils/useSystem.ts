import {
  type ArgType,
  colors,
  sizes,
  allSizes,
  placements,
  variants,
  align
} from "./types";
import { useIcons, iconOutput } from "./useIcons";
import { keys, values, invert } from "lodash-es";

// --- types

// ----------------------------------------------------------------------------

const iconUrls = useIcons(iconOutput.URL);
const icons = useIcons(iconOutput.NAME);
// const iconSvgs = useIcons();

export const useSystemArgTypes: Record<string, ArgType> = {
  variant: {
    options: keys(variants),
    control: {
      type: "select",
      labels: variants
    }
  },
  placement: {
    options: keys(placements),
    control: {
      type: "select",
      labels: placements
    }
  },

  color: {
    options: keys(colors),
    control: {
      type: "select",
      labels: colors
    }
  },
  size: {
    options: keys(sizes),
    control: {
      type: "radio",
      labels: sizes
    }
  },

  allSizes: {
    options: keys(allSizes),
    control: {
      type: "radio",
      labels: allSizes
    }
  },
  icon: {
    options: values(icons),
    control: {
      type: "select",
      labels: invert(icons)
    }
  },
  align: {
    options: keys(align),
    control: {
      type: "select",
      labels: align
    }
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
      labels: invert(iconUrls)
    }
  }
};
