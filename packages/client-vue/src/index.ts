// --- expose our package exports
export * from "@upmind-automation/headless";
export { default as Upm } from "./Upmind.vue";
export * from "./components";
export * from "./modules";

// -----------------------------------------------------------------------------

import useUpmindClient from "./useUpmindClient";
export default useUpmindClient;
