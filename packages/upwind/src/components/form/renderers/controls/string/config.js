import { upwConfig } from "../../../../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig("flex-1 bg-transparent leading-normal outline-none"),
  // ------------------------------------------------------------
  // Attribute based Classes: These are conditional based on the component props
  // Each Attribute is an object of key value pairs where key is the attribute value that can be passed to the component
  attributes: {
    size: {
      target: "root",
      options: {
        sm: upwConfig("px-3 py-2 text-sm"),
        default: upwConfig("px-3 py-3"),
        lg: upwConfig("px-3 py-4 text-lg"),
      },
    },
  },
};
