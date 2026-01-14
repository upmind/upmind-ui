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

// --- expose standalone parts for custom layouts (e.g. Nuxt)
export const UpmHeader = defineAsyncComponent(
  () => import("./components/header/Header.vue")
);
export const UpmFooter = defineAsyncComponent(
  () => import("./components/footer/Footer.vue")
);
export const UpmPage = defineAsyncComponent(
  () => import("./components/page/Page.vue")
);
export const UpmMain = defineAsyncComponent(
  () => import("./components/main/Main.vue")
);

//  --- export modules and components
export * from "./components";
export * from "./modules";

// -----------------------------------------------------------------------------

import useUpmindClient from "./useUpmindClient";
export default useUpmindClient;
