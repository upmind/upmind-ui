// --- external
import { inspect } from "@xstate/inspect";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { first } from "lodash-es";

// --- internal
import { useQuery } from "./";
import { useBrand, useSystem, useDataLayer, useTracking } from "./modules";
import { useSystemRecaptcha } from "./modules/system";
import { useSession } from "./modules/session";

// --- utils
import { usePOP, useSessionStorage } from "./utils";

// --- types
import type { IApiPop } from "./utils/usePOP";

// ---
export enum UpmindStatus {
  notInitialised = "",
  initialised = "initialised",
  initialising = "initialising",
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

  constructor() {}

  init({ mode, pop, analytics, recaptcha, debug }: UpmindProps): Promise<void> {
    if (this.status != UpmindStatus.notInitialised)
      throw new Error(
        `[headless] Upmind has already been initialised, please use the isReady() method to check if Upmind is ready`
      );
    this.status = UpmindStatus.initialising;
    this.initPlugins();

    this.debug = debug;
    this.mode = mode ?? "default";
    this.pop = pop;
    this.analytics = analytics;
    this.recaptcha = recaptcha;

    return usePOP(pop)
      .isReady()
      .then(() => {
        if (this.mode == "express") {
          this.status = UpmindStatus.initialised;
          return;
        }
        Promise.all([
          this.initDebugging(),
          this.initHeadless(),
          this.initRecaptcha(),
          this.initAnalytics(),
        ]).then(() => {
          this.status = UpmindStatus.initialised;
        });
      });
  }

  private initPlugins() {
    this.plugins ??= {};
    // const { queryClient } = useQuery();
    this.plugins.vueQuery = {
      plugin: VueQueryPlugin,
      options: {
        // queryClient,
        enableDevtoolsV6Plugin: true,
      },
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
        iframe: false,
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
    const { init } = useSystemRecaptcha();
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

  isReady(): Promise<void> {
    return new Promise(resolve =>
      setTimeout(() => {
        if (this.status == UpmindStatus.notInitialised) {
          resolve();
        }
      }, 100)
    );
  }
}

const upmind = new Upmind();
export default upmind;
