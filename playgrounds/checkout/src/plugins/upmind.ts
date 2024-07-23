// ---external
import { createGtm } from "@gtm-support/vue-gtm";

// ---internal
import router from "../router";

import {
  useApi,
  useBrand,
  useSession,
  useSystem,
  useBasket,
  utils,
} from "@upmind/client-vue";

// --- types
import type { App, Plugin } from "vue";

// -----------------------------------------------------------------------------

const upmindPlugin: Plugin = {
  install: (app: App): void => {
    useApi();
    // lets initialize our system, brand + session machines as they are global
    useSystem();
    useBrand()
      .getAnayltics()
      .then(analytics => {
        // set up gtm if we have a container id
        if (!analytics?.gtm?.container_id) return;
        app.use(
          createGtm({
            id: analytics?.gtm?.container_id,
            dataLayerName: "upmDataLayer",
            debug: import.meta.env.DEV,
            vueRouter: router,
          })
        );
      });
    useSession();
    useBasket();

    // ---
    const { track } = utils.useTracking();
    router
      .isReady()
      .then(track)
      .catch(error => {
        // do nothing, no tracking;
      });
  },
};

export default upmindPlugin;
