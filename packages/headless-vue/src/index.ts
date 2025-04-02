export * from "./modules";
export * as utils from "./utils";

export { useQuery, type IApiPop } from "@upmind-automation/headless";
import { useUpmind, useQuery } from "@upmind-automation/headless";

// --- alternative implementation ----------------------------------------------
import {
  VueQueryPlugin,
  type VueQueryPluginOptions,
} from "@tanstack/vue-query";

import {
  useBrand,
  useSession,
  useSystem,
  useBasket,
  useDataLayer,
  useTracking,
} from "./modules";
// import { useRouting } from "./modules/routing";

// ---types
import type { App } from "vue";
import type { IApiPop } from "@upmind-automation/headless-vue";
import { first } from "lodash-es";

// ---
enum UpmindStatus {
  notInitialised = "",
  initialised = "initialised",
  initialising = "initialising",
}

interface UpmindProps {
  app: App;
  pop?: IApiPop;
  analytics?: {
    gtm?: {
      containerId?: string;
      dataLayer?: string;
    };
    enabled?: boolean;
    debug?: boolean;
  };
}

class Upmind {
  private status: UpmindStatus = UpmindStatus.notInitialised;
  // ---
  app: UpmindProps["app"] | undefined;
  pop: UpmindProps["pop"];
  analytics: UpmindProps["analytics"];

  // ---
  constructor() {
    console.debug("Upmind has started");
  }

  init({ app, pop, analytics }: UpmindProps): Promise<void> {
    // NB: Only initialise once
    if (this.status != UpmindStatus.notInitialised) return Promise.reject();

    this.status = UpmindStatus.initialising;

    this.app = app;
    this.pop = pop;
    this.analytics = analytics;

    return useUpmind(pop).then(() => {
      Promise.all([this.initHeadless(), this.initAnalytics()]).then(() => {
        this.status = UpmindStatus.initialised;
      });
    });
  }

  private async initHeadless() {
    // lets initialize our api query client and register it with the vue app
    const { queryClient } = useQuery();
    const vueQueryPluginOptions: VueQueryPluginOptions = {
      // @ts-ignore : minor mismatch of type between vue and core query client
      queryClient,
      enableDevtoolsV6Plugin: true,
    };

    this.app?.use(VueQueryPlugin, vueQueryPluginOptions);

    // init our core modules
    useSystem();
    useBrand();
    useSession();
    // useBasket(); // we dont need this on startup
  }

  private async initAnalytics() {
    //  --- Initialise our Upmind tracking cookie and store the utm params
    const { init: initTracking } = useTracking();
    initTracking();

    // --- Initialise our dataLayer (bail if analytics is not enabled)
    if (!this.analytics?.enabled) return;
    this.analytics.gtm ??= {}; // ensure we have a gtm object
    const { init, id, dataLayer } = useDataLayer(
      this.analytics?.gtm?.dataLayer
    );
    this.analytics.gtm.dataLayer = id; // ensure the data layer name matches
    init();

    // --- Implement Google Tag Manager
    // IF we have a container id given to us OR in the brand settings
    // Add GTM the script, allowing for a custom data layer name, (default is dataLayer)
    this.analytics.gtm.containerId ??= await useBrand()
      .getAnayltics()
      .then(analytics => analytics?.gtm?.container_id);

    if (this.analytics.gtm.containerId) {
      dataLayer({ gtm_start: new Date().getTime(), event: "gtm.js" }).push();

      const firstScript = first(document.getElementsByTagName("script"));
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute(
        "src",
        `https://www.googletagmanager.com/gtm.js?id=${this.analytics.gtm.containerId}${
          this.analytics.gtm?.dataLayer &&
          this.analytics.gtm.dataLayer != "dataLayer"
            ? `&l=${this.analytics.gtm?.dataLayer}`
            : ""
        }`
      );
      // insert before the first script tag or append to head
      firstScript?.parentNode
        ? firstScript.parentNode.insertBefore(script, firstScript)
        : document.head.appendChild(script);
    }

    // --- Finally push our initial payload to the data layer
    dataLayer().withPage().withUser().push();
  }

  // ---
  isReady(): Promise<void> {
    return new Promise(resolve =>
      setTimeout(() => {
        if (this.status == UpmindStatus.notInitialised) resolve();
      }, 100)
    );
  }
}

// --- create a singleton provider of Upmind
const upmind = new Upmind();
export default upmind;
