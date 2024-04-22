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

export const useSystemArgTypes = {
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
