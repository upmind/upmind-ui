// ---  external
import { rootVariants, itemVariants } from "../button-group/buttonGroup.config";
// -----------------------------------------------------------------------------

// One attached segmented group, shared borders, no gap — `ButtonGroup`'s own
// chrome rather than a second copy of it, so the two treatments cannot drift.
export default {
  toggleGroup: {
    root: rootVariants,
    item: itemVariants
  }
};
