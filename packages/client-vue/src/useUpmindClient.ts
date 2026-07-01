import useUpmind, { type UpmindProps } from "@upmind-automation/headless";
import {
  registerIcons,
  registerAnimations,
  type IconImportMap,
  type AnimationImportMap
} from "@upmind-automation/upmind-ui";
import themes from "./assets/themes";
import { isEmpty, keyBy, merge, values } from "lodash-es";

// -----------------------------------------------------------------------------
// NB we expose UpmindClient instead of just useUpmind as we want to inject our defined themes
// This allows for greater flexibility and customization when using the Upmind client

class UpmindClient {
  constructor() {}

  /**
   * Initialize the Upmind client with the provided configuration.
   * @param props - Configuration options for the Upmind client
   */

  init(
    props: UpmindProps & {
      icons?: IconImportMap;
      animations?: AnimationImportMap;
    }
  ): Promise<void> {
    // merge our client themes with any provided themes
    props.themes = values(
      merge({}, keyBy(themes, "id"), keyBy(props.themes, "id"))
    );

    // Register icons and animations if provided
    if (!isEmpty(props.icons)) registerIcons(props.icons);
    if (!isEmpty(props.animations)) registerAnimations(props.animations);

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

  themes?: UpmindProps["themes"];

  async isReady(): Promise<void> {
    return useUpmind.isReady();
  }
}

const upmindClient = new UpmindClient();
export default upmindClient;
