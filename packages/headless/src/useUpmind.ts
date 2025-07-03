// --- external
import { unref } from "vue";
import { inspect } from "@xstate/inspect";
import { type QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

// --- internal
import {
  useI18n,
  useBrand,
  useLocale,
  useSystem,
  useSession,
  useTracking,
  useRecaptcha,
  useDataLayer,
  type GlobbedFiles
} from "./modules";
import { first } from "lodash-es";
import { useRouting } from "./modules/routing/useRouting";
import { Flow, useQuery } from "./modules";

// --- utils
import {
  usePOP,
  DetailedError,
  responseCodes,
  useSessionStorage,
  ErrorOrigin
} from "./utils";

// --- types
import type { IApiPop } from "./utils";
import type { I18n } from "vue-i18n";
import type { Router } from "vue-router";

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
}

// -----------------------------------------------------------------------------

class Upmind {
  private status: UpmindStatus = UpmindStatus.notInitialised;
  debug: UpmindProps["debug"];
  mode: UpmindProps["mode"] = "default";
  pop: UpmindProps["pop"];
  plugins: UpmindProps["plugins"] = {};
  analytics: UpmindProps["analytics"];
  recaptcha: UpmindProps["recaptcha"];
  i18n: UpmindProps["i18n"];
  router: UpmindProps["router"];
  queryClient: QueryClient;

  constructor() {
    this.queryClient = useQuery().queryClient;
  }

  init({
    mode,
    pop,
    analytics,
    recaptcha,
    router,
    i18n,
    debug
  }: UpmindProps): Promise<void> {
    if (this.status != UpmindStatus.notInitialised)
      throw new DetailedError(
        `Upmind has already been initialised, please use the isReady() method to check if Upmind is ready`,
        responseCodes.Conflict,
        ErrorOrigin.Headless
      );
    this.status = UpmindStatus.initialising;
    this.debug = debug;
    this.mode = mode ?? "default";
    this.pop = pop;
    this.analytics = analytics;
    this.recaptcha = recaptcha;
    this.router = router;
    this.i18n = i18n;

    this.initPlugins();
    this.initDebugging();

    return usePOP(this.pop)
      .isReady()
      .then(async () => {
        if (this.mode != "express") {
          await this.initHeadless().then(() => {
            this.initRecaptcha();
            this.initAnalytics();
            this.initRouter();
            this.initI18n();
          });
        }

        this.status = UpmindStatus.initialised;
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

  private async initHeadless() {
    if (!this.pop) return;
    useSystem();
    useBrand();
    useSession();
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
      .then((analytics: any) => analytics?.gtm?.container_id);
    if (this.analytics.gtm.containerId) {
      dataLayer({ gtm_start: new Date().getTime(), event: "gtm.js" }).push(
        false
      );
      const firstScript = first(document.getElementsByTagName("script"));
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute(
        "src",
        `https://www.googletagmanager.com/gtm.js?id=${this.analytics.gtm.containerId}${this.analytics.gtm?.dataLayer && this.analytics.gtm.dataLayer != "dataLayer" ? `&l=${this.analytics.gtm?.dataLayer}` : ""}`
      );
      firstScript?.parentNode
        ? firstScript.parentNode.insertBefore(script, firstScript)
        : document.head.appendChild(script);
    }
    dataLayer().withPage().withUser().push(false);
  }

  private async initRouter() {
    if (!this.router?.instance) return;
    useRouting(this.router.instance, this.router.flows);
  }

  private async initI18n() {
    if (!this.i18n?.instance) return;

    const defaultLocale = unref(this.i18n.instance.global.locale);
    const locale = useLocale(defaultLocale).locale.value; //TODO: use brand or user locale

    // then load our i18n messages from any provided files (globbed)
    const { loadLocaleMessages, setLocale } = useI18n(
      this.i18n.instance,
      this.i18n.files
    );
    loadLocaleMessages(locale);
    setLocale(locale);
  }
  // ---------------------------------------------------------------------------

  isReady(): Promise<void> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.status !== UpmindStatus.notInitialised) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }
}

const upmind = new Upmind();
export default upmind;
