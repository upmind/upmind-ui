import { registerAnimations, type AnimationImportMap } from "@upmind/ui";
import useUpmind, { type UpmindProps } from "@upmind-automation/headless";
import { registerIcons, type IconImportMap } from "./components/icon";
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------
// NB we expose UpmindClient instead of just useUpmind so the icon import map a
// host passes is registered with the client-vue resolver before init.

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
    // Icons resolve via the client-vue resolver (new <Icon>, flags/providers).
    if (!isEmpty(props.icons)) {
      registerIcons(props.icons);
    }

    // AnimatedIcon self-registers the <lord-icon> element, but its animation
    // registry is seeded only from the DS's bundled set — a host's own Lottie
    // JSON is unresolvable unless registered here.
    if (!isEmpty(props.animations)) {
      registerAnimations(props.animations);
    }

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
