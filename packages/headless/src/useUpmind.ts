// --- external
import { nextTick, Ref, ref, unref } from "vue";
import { inspect } from "@xstate/inspect";
import { type QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

// --- internal
import {
  type GlobbedFiles,
  useBrand,
  useDataLayer,
  useLocalisation,
  useRecaptcha,
  useSession,
  useSystem,
  useTracking
} from "./modules";
import { first, get } from "lodash-es";
import { useRouting } from "./modules/routing/useRouting";
import { useTheming } from "./modules/theming/useTheming";
import { Flow, useQuery } from "./modules";

// --- utils
import {
  usePOP,
  DetailedError,
  responseCodes,
  useSessionStorage,
  ErrorOrigin,
  useScripts
} from "./utils";

// --- types
import type { IApiPop } from "./utils";
import type { Router } from "vue-router";
import type { Theme } from "./modules/theming";
import type { I18n, Composer } from "vue-i18n";
import { BrandConfigKeys } from "@upmind-automation/types";

// ---
export enum UpmindStatus {
  notInitialised = "",
  initialised = "initialised",
  initialising = "initialising"
}

export interface UpmindProps {
  mode?: "default" | "express";
  pop?: IApiPop;
  debug?: boolean;
  storefrontUrl?: string; // URL of the storefront, used in the app
  // plugins are registered by the Upmind instance, so we can use them in the app
  plugins?: Record<string, { plugin: any; options?: any }>;
  recaptcha?: { siteKey?: string; enabled?: boolean };
  analytics?: {
    gtm?: { containerId?: string; dataLayer?: string };
    enabled?: boolean;
    debug?: boolean;
  };
  router?: {
    instance: Router;
    flows?: Flow[] | (() => Flow[]);
  };
  i18n?: {
    instance: I18n;
    files: GlobbedFiles;
    debug?: boolean;
  };

  themes?: Theme[];
}

// -----------------------------------------------------------------------------

export class Upmind {
  status: Ref<UpmindStatus> = ref(UpmindStatus.notInitialised);
  analytics: UpmindProps["analytics"];
  debug: UpmindProps["debug"];
  i18n: UpmindProps["i18n"];
  mode: UpmindProps["mode"] = "default";
  plugins: UpmindProps["plugins"] = {};
  pop: UpmindProps["pop"];
  queryClient: QueryClient;
  recaptcha: UpmindProps["recaptcha"];
  router: UpmindProps["router"];
  storefrontUrl?: string;
  themes?: UpmindProps["themes"];

  constructor() {
    const { queryClient } = useQuery();
    this.queryClient = queryClient;
  }

  init({
    analytics,
    debug,
    i18n,
    mode,
    pop,
    recaptcha,
    router,
    storefrontUrl,
    themes
  }: UpmindProps): Promise<void> {
    if (this.status.value != UpmindStatus.notInitialised)
      throw new DetailedError(
        (i18n?.instance.global as Composer).t("error.upmind_initialised"),
        responseCodes.Conflict,
        ErrorOrigin.Headless
      );
    this.status.value = UpmindStatus.initialising;
    this.debug = debug;
    this.mode = mode ?? "default";
    this.pop = pop;
    this.analytics = analytics;
    this.recaptcha = recaptcha;
    this.router = router;
    this.i18n = i18n;
    this.storefrontUrl = storefrontUrl;
    this.themes = themes;

    this.initPlugins();
    this.initDebugging();

    return usePOP(this.pop)
      .isReady()
      .then(async () => {
        // Bail out if we are in express mode
        if (this.mode == "express") return;

        // NB: set up our locale, but dont wait for our i18n packages to load
        this.initLocalisation();

        // then initialise our core modules and wait for them to be ready
        return (
          Promise.all([
            useBrand().isReady(),
            useSystem().isReady(),
            useSession().isReady()
          ])
            // start with our render blocking initialisations
            .then(() => Promise.all([this.initTheming(), this.initRouter()]))
            .then(() => {
              // then do our non render blocking initialisations
              this.initRecaptcha();
              this.initAnalytics();
            })
        );
      })
      .finally(() => {
        this.status.value = UpmindStatus.initialised;
      });
  }

  private initPlugins() {
    this.plugins ??= {};
    this.plugins.vueQuery = {
      plugin: VueQueryPlugin,
      options: {
        queryClient: this.queryClient,
        enableDevtoolsV6Plugin: true
      }
    };
  }

  private async initDebugging() {
    const { get, set } = useSessionStorage();

    // We now persist debugging to sessionStorage so we can debug an entire session
    // without having to pass the debug flag in the URL every time.

    const queryParams = new URLSearchParams(window?.location?.search);

    // always honor the debug flag in the URL
    if (queryParams.has("debug")) set("debug", true);

    // otherwise read our debugging flag from session storage or fallback to the default ( true if DEV )
    const debugging = get("debug") ?? this.debug;
    this.debug = debugging;

    // finally start the inspector if debugging is enabled
    if (debugging)
      inspect({
        // url: "https://stately.ai/registry/editor/inspect",
        // url: "https://statecharts.io/inspect",
        // url: "https://stately.ai/viz?inspect", // (default)
        iframe: false
      });
  }

  private async initRecaptcha() {
    if (
      !this.recaptcha?.enabled ||
      !this.recaptcha.siteKey ||
      this.mode == "express"
    )
      return;

    const { init } = useRecaptcha();

    init(this.recaptcha.siteKey);
  }

  private async initAnalytics() {
    if (!this.analytics?.enabled) return;
    const { init: initTracking } = useTracking();
    initTracking();
    this.analytics.gtm ??= {};
    const { init, id, dataLayer } = useDataLayer(
      this.analytics?.gtm?.dataLayer
    );
    this.analytics.gtm.dataLayer = id;
    init();

    this.analytics.gtm.containerId ??= await useBrand()
      .getAnalytics()
      .then((data: any) =>
        get(data, BrandConfigKeys.ANALYTICS_GTM_CONTAINER_ID)
      );

    if (this.analytics.gtm.containerId) {
      dataLayer({ gtm_start: new Date().getTime(), event: "gtm.js" }).push(
        false
      );

      useScripts().load(
        "gtm",
        `https://www.googletagmanager.com/gtm.js?id=${this.analytics.gtm.containerId}${this.analytics.gtm?.dataLayer && this.analytics.gtm.dataLayer != "dataLayer" ? `&l=${this.analytics.gtm?.dataLayer}` : ""}`,
        { prepend: true }
      );
    }
    dataLayer().withPage().withUser().push(false);
  }

  private async initRouter() {
    if (!this.router?.instance) return;
    useRouting(this.router.instance, this.router.flows);
  }

  private async initTheming() {
    const { isReady } = useTheming(this.themes);
    await isReady();
  }

  private async initLocalisation() {
    const { isReady } = useLocalisation(this.i18n?.instance, this.i18n?.files);
    return isReady();
  }
  // ---------------------------------------------------------------------------

  isReady(): Promise<void> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.status.value !== UpmindStatus.notInitialised) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }
}

const upmind = new Upmind();
export default upmind;
