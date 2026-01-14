// --- external
import { defineAsyncComponent } from "vue";

// -----------------------------------------------------------------------------

// --- expose our package exports
export * from "@upmind-automation/headless";

// --- expose composables
export {
  useConfig,
  provideConfig,
  injectConfig
} from "@upmind-automation/headless";

// --- expose our Upmind component
export const Upm = defineAsyncComponent(() => import("./Upmind.vue"));

//  --- export modules and components
export * from "./components";
export * from "./modules";

// -----------------------------------------------------------------------------

import useUpmindClient from "./useUpmindClient";
export default useUpmindClient;
