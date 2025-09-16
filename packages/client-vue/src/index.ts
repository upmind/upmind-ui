// --- expose our package exports
export * from "@upmind-automation/headless";
export { default as Upm } from "./Upmind.vue";
export * from "./components";
export * from "./modules";

// --- internal
import useUpmind, { type UpmindProps } from "@upmind-automation/headless";
import themes from "./assets/themes";

// --- utils
import { keyBy, merge, values } from "lodash-es";

// -----------------------------------------------------------------------------
// NB we expose UpmindClient instead of just useUpmind as we want to inject our defined themes
// This allows for greater flexibility and customization when using the Upmind client

class UpmindClient {
  constructor() {}

  init(props: UpmindProps): Promise<void> {
    // merge our client themes with any provided themes
    props.themes = values(
      merge({}, keyBy(themes, "id"), keyBy(props.themes, "id"))
    );

    return useUpmind.init(props);
  }

  // ---------------------------------------------------------------------------

  get analytics() {
    return useUpmind.analytics;
  }

  get debug() {
    return useUpmind.debug;
  }

  get i18n() {
    return useUpmind.i18n;
  }

  get mode() {
    return useUpmind.mode;
  }
  get plugins() {
    return useUpmind.plugins;
  }

  get pop() {
    return useUpmind.pop;
  }

  get queryClient() {
    return useUpmind.queryClient;
  }

  get recaptcha() {
    return useUpmind.recaptcha;
  }

  get router() {
    return useUpmind.router;
  }

  storefrontUrl?: string;
  themes?: UpmindProps["themes"];

  isReady(): Promise<void> {
    return useUpmind.isReady();
  }
}

const upmindClient = new UpmindClient();
export default upmindClient;
