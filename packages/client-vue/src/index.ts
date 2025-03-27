// --- expose our package exports

export * from "@upmind-automation/headless-vue";
export { default as Upm } from "./Upmind.vue";
export * from "./components";
export * from "./modules";

// export type { ActorRef } from "xstate";

// --- alternative implementation ----------------------------------------------
import {
  VueQueryPlugin,
  type VueQueryPluginOptions,
} from "@tanstack/vue-query";

import {
  useUpmind,
  useQuery,
  useBrand,
  useSession,
  useSystem,
  useBasket,
  useDataLayer,
  useTracking,
} from "@upmind-automation/headless-vue";
import { useRouting } from "./modules/routing";
import { useI18n } from "./modules/system/i18n";

// ---types
import type { App } from "vue";
import type { I18n } from "vue-i18n";
import type { Router } from "vue-router";
import type { Flow, IApiPop } from "@upmind-automation/headless-vue";
import type { GlobbedFiles } from "./modules/system/i18n/types";
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
  router?: {
    provider: Router;
    flows?: Flow[];
  };
  i18n?: {
    provider: I18n;
    files: GlobbedFiles;
    debug?: boolean;
  };
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
  i18n: UpmindProps["i18n"];
  router: UpmindProps["router"];
  analytics: UpmindProps["analytics"];

  // ---
  constructor() {
    // console.debug("Upmind started");
  }

  init({ app, pop, router, i18n, analytics }: UpmindProps) {
    // NB: Only initialise once
    if (this.status != UpmindStatus.notInitialised) return;

    this.status = UpmindStatus.initialising;

    this.app = app;
    this.pop = pop;
    this.router = router;
    this.i18n = i18n;
    this.analytics = analytics;

    useUpmind(pop).then(() => {
      Promise.all([
        this.initHeadless(),
        this.initRouter(),
        this.initI18n(),
        this.initAnalytics(),
      ]).then(() => {
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

  private async initRouter() {
    if (!this.router?.provider) return;
    useRouting(this.router.provider, this.router.flows);
  }

  private async initI18n() {
    if (!this.i18n?.provider) return;

    const locale = "en"; //TODO: use brand or user locale

    // then load our i18n messages from any provided files (globbed)
    const { loadLocaleMessages, setLocale } = useI18n(
      this.i18n.provider,
      this.i18n.files
    );
    loadLocaleMessages(locale);
    setLocale(locale);
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
