// ---external
import { createGtm } from "@gtm-support/vue-gtm";
import { VueQueryPlugin } from "@tanstack/vue-query";

// ---internal
import router from "../router";

import {
  useUpmind,
  useBrand,
  useSession,
  useSystem,
  useBasket,
  utils,
  vueQueryPluginOptions,
} from "@upmind-automation/client-vue";

import { initializeLottie } from "@upmind-automation/upmind-ui";

// --- types
import type { App, Plugin } from "vue";
import type { VueQueryPluginOptions } from "@tanstack/vue-query";

// -----------------------------------------------------------------------------

const upmindPlugin: Plugin = {
  install: (app: App): void => {
    // wait for our system to be ready
    useUpmind({
      name: import.meta.env.VITE_API_NAME,
      apiUrl: import.meta.env.VITE_API_URL,
      region: import.meta.env.VITE_API_REGION,
    }).then(() => {
      // lets initialize our api query client
      app.use(VueQueryPlugin, vueQueryPluginOptions);
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
        })
        .catch(error => {
          console.warn("Error loading brand", error);
          // do nothing, no analytics;
        });
      useSession();
      useBasket();
      initializeLottie();
    });
    // ---
    const { track } = utils.useTracking();
    router
      .isReady()
      .then(track)
      .catch(error => {
        console.warn("Error tracking route change", error);
        // do nothing, no tracking;
      });
  },
};

export default upmindPlugin;
