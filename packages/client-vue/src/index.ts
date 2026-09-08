import useUpmindClient from "./useUpmindClient";

// Side-effect import: contributes this package's form renderers into
// `foundation`'s §7 socket. Listed in `sideEffects` so a bundler keeps it.
import "./feature";

export * from "@upmind-automation/headless";

// --- expose shared types
export type { StorefrontRoute } from "./types";

// --- expose composables
export {
  useConfig,
  provideConfig,
  injectConfig
} from "@upmind-automation/headless";

// --- expose our Upmind component
export { default as Upm } from "./Upmind.vue";

// --- expose standalone parts for custom layouts (e.g. Nuxt)
export { default as UpmHeader } from "./components/header/Header.vue";
export { default as UpmFooter } from "./components/footer/Footer.vue";
export { default as UpmPage } from "./components/page/Page.vue";
export { default as UpmMain } from "./components/main/Main.vue";

//  --- export modules and components
export * from "./components";
// -----------------------------------------------------------------------------
export * from "./modules";
export { clientVueFeature } from "./feature";
export default useUpmindClient;
