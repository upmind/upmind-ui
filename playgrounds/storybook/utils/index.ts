// --- exports
export * from "./useIcons";

// --- utils
import { useIcons } from "./useIcons";
import { keys } from "lodash";
// ----------------------------------------------------------------------------

const flags = useIcons("flags");
const icons = useIcons();

enum colors {
  primary = "Primary",
  secondary = "Secondary",
  accent = "Accent",
  neutral = "Neutral",
  success = "Success",
  error = "Error",
  warning = "Warning",
  info = "Info",
  current = "Current",
}

enum sizes {
  sm = "Small",
  md = "Medium",
  lg = "Large",
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
  icon: {
    options: keys(icons),
    control: {
      type: "select",
      labels: icons,
    },
  },
  flag: {
    options: keys(flags),
    control: {
      type: "select",
      labels: flags,
    },
  },
};
