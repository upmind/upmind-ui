import { type QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { inspect } from "@xstate/inspect";
import { type Ref, ref } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "./modules/brand";
import { useDataLayer, useTracking } from "./modules/system-analytics";
import { useLocale, useLocalisation } from "./modules/system-localisation";
import { useRecaptcha } from "./modules/system-recaptcha";
import { useRoutingEngine } from "./modules/routing";
import { useSessionStore } from "./modules/session-store";
import { useSystem } from "./modules/system";
import { useQuery } from "./modules/query";
import { useRouting } from "./modules/routing/useRouting";
import { useTheming } from "./modules/theming/useTheming";
import {
  usePOP,
  DetailedError,
  responseCodes,
  useSessionStorage,
  ErrorOrigin,
  useScripts
} from "./utils";
import { get, isFunction } from "lodash-es";
import type { Funnels, FunnelWatcher } from "./modules/routing";
import type { GlobbedFiles } from "./modules/system-localisation";
import type { SessionStoreConfig } from "./modules/session-store/session-store.types";
import type { Theme } from "./modules/theming";
import type { IApiPop } from "./utils";
import type { I18n, Composer } from "vue-i18n";
import type { Router } from "vue-router";

declare global {
  interface Window {
    /**
     * The live headless system — the entire public API — exposed by
     * {@link Upmind.initTestMode} only when the app is initialised with
     * `testMode: true`; `undefined` in production builds.
     */
    Upmind?: typeof import("./index");
  }
}

// ---
/**
 * Enumeration representing the initialisation status of the Upmind instance.
 *
 * @enum {string}
 */
export enum UpmindStatus {
  /**
   * The Upmind instance has not yet been initialised.
   */
  notInitialised = "",
  /**
   * The Upmind instance has completed its initialisation process and is ready for use.
   */
  initialised = "initialised",
  /**
   * The Upmind instance is currently in the process of initialising.
   */
  initialising = "initialising"
}

/**
 * Interface defining the properties required to initialise the Upmind instance.
 * These properties configure various aspects of the headless library, including
 * mode, debugging, analytics, routing, internationalisation, and theming.
 */
export interface UpmindProps {
  /**
   * The operating mode of the Upmind instance.
   * - `default`: Standard operation with full headless module initialisation.
   * - `express`: A lighter mode, potentially skipping some render-blocking initialisations.
   * @default "default"
   */
  mode?: "default" | "express";
  /**
   * Configuration for the POP (Provider Of Providers) API.
   */
  pop?: IApiPop;
  /**
   * Enables debug mode for various components, including XState inspection.
   * @default false (derived from session storage or default)
   */
  debug?: boolean;
  /**
   * Exposes the entire live headless system on `window.Upmind` — every
   * composable and util — so Playwright e2e specs drive the same running system
   * the app uses (cache-invalidating, no raw HTTP). Host apps pass a build-time
   * signal that is statically `false` in production (e.g. Vite test mode /
   * `import.meta.dev`), so it dead-strips from prod builds. Unlike `debug`, there
   * is no URL/query/sessionStorage override — this prop is the only switch.
   * @default false
   */
  testMode?: boolean;
  /**
   * The base URL of the storefront application. Used for generating absolute URLs
   * and linking purposes within the headless library.
   */
  storefrontUrl?: string;
  /**
   * A record of plugins to be registered with the Upmind instance.
   * Each entry specifies the plugin constructor and optional configuration.
   *
   * @example
   * ```ts
   * plugins: {
   *   myPlugin: { plugin: MyCustomPlugin, options: { foo: 'bar' } }
   * }
   * ```
   */
  plugins?: Record<string, { plugin: any; options?: any }>;
  /**
   * Configuration for Google reCAPTCHA integration.
   */
  recaptcha?: {
    /** The reCAPTCHA site key. */
    siteKey?: string;
    /** Enables or disables reCAPTCHA. */
    enabled?: boolean;
  };
  /**
   * Configuration for analytics and tracking, primarily Google Tag Manager (GTM).
   */
  analytics?: {
    /** GTM-specific configuration. */
    gtm?: {
      /** The GTM container ID (e.g., 'GTM-XXXXXXX'). */
      containerId?: string;
      /** The name of the dataLayer array, if different from 'dataLayer'. */
      dataLayer?: string;
    };
    /** Enables or disables analytics tracking. */
    enabled?: boolean;
    /** Enables debug mode for analytics. */
    debug?: boolean;
  };
  /**
   * Configuration for Vue Router integration.
   */
  router?: {
    /** The Vue Router instance. */
    instance: Router;
    /** Whether to guard routes or not */
    guardRoutes?: boolean;
    /** A function to Register routing flows with the routing engine. */
    registerFunnels?: () => {
      defaultFunnel?: string;
      funnels?: Funnels;
      watchers?: FunnelWatcher[];
    };
  };
  /**
   * Configuration for Vue I18n internationalization.
   */
  i18n?: {
    /** The Vue I18n instance. */
    instance: I18n;
    /** Globbed files containing translation messages. */
    files: GlobbedFiles;
    /** Enables debug mode for i18n. */
    debug?: boolean;
  };
  /**
   * An array of theme configurations to be loaded and managed by the theming module.
   */
  themes?: Theme[];
  /**
   * Indicates whether the Upmind instance is running in admin mode.
   * This flag can be used to alter behavior such as API endpoints and payloads.
   * @default false
   */
  admin?: boolean;
  /**
   * The Upmind platform URL. Used as the redirect destination when
   * the brand is unavailable (no tenant for this domain).
   * No redirect occurs if not provided.
   */
  platformUrl?: string;
  /**
   * Scope restrictions. Controls which actor scopes are allowed in the Session store and can be activated.
   *
   * @example
   * ```ts
   * // Cart app: only client and guest
   * allowedScopes: [AccessRoleTypes.CLIENT, AccessRoleTypes.GUEST]
   *
   * // Admin app: only staff
   * allowedScopes: [AccessRoleTypes.STAFF]
   * ```
   */
  allowedScopes?: SessionStoreConfig["allowedScopes"];
}

// -----------------------------------------------------------------------------

/**
 * The core Upmind class, responsible for initialising and orchestrating all
 * headless modules and plugins. It acts as a singleton entry point for
 * configuring the Upmind headless library within a Vue application.
 */
export class Upmind {
  /**
   * Reactive reference to the current initialisation status of the Upmind instance.
   */
  status: Ref<UpmindStatus> = ref(UpmindStatus.notInitialised);
  /**
   * Analytics configuration, typically for Google Tag Manager.
   */
  analytics: UpmindProps["analytics"];
  /**
   * Indicates whether the Upmind instance is running in admin mode.
   */
  admin: boolean = false;
  /**
   * Debugging flag for enabling various debug features.
   */
  debug: UpmindProps["debug"];
  /**
   * Exposes the entire live headless system on `window.Upmind` in test mode.
   * Off by default.
   */
  testMode: UpmindProps["testMode"];
  /**
   * Internationalization configuration for Vue I18n.
   */
  i18n: UpmindProps["i18n"];
  /**
   * The operating mode of the Upmind instance ("default" or "express").
   */
  mode: UpmindProps["mode"] = "default";
  /**
   * A record of registered plugins.
   */
  plugins: UpmindProps["plugins"] = {};
  /**
   * Provider Of Providers (POP) API configuration.
   */
  pop: UpmindProps["pop"];

  private _queryClient?: QueryClient;

  /**
   * The Vue Query client, resolved lazily on first access. The singleton is
   * constructed at module load — inside cyclic import paths "./modules" may
   * not have finished evaluating yet, so useQuery() must not run eagerly.
   */
  get queryClient(): QueryClient {
    if (!this._queryClient) this._queryClient = useQuery().queryClient;
    return this._queryClient;
  }

  /**
   * Google reCAPTCHA configuration.
   */
  recaptcha: UpmindProps["recaptcha"];
  /**
   * Vue Router configuration.
   */
  router: UpmindProps["router"];
  /**
   * The base URL of the storefront application.
   */
  storefrontUrl?: string;
  /**
   * Theme configurations.
   */
  themes?: UpmindProps["themes"];
  /**
   * The Upmind platform URL for redirect when brand is unavailable.
   */
  platformUrl?: UpmindProps["platformUrl"];
  /**
   * Scope restrictions. Controls which actor scopes are allowed in the Session store and can be activated.
   */
  allowedScopes: UpmindProps["allowedScopes"];

  /**
   * Initialises the Upmind headless library with the provided configuration.
   * This method orchestrates the initialisation of all internal modules and plugins.
   *
   * @param props - An object containing initialisation properties.
   * @returns A promise that resolves when the Upmind instance is fully initialised.
   * @throws {DetailedError} If Upmind has already been initialised.
   */
  init({
    allowedScopes,
    analytics,
    debug,
    i18n,
    mode,
    platformUrl,
    pop,
    recaptcha,
    router,
    storefrontUrl,
    testMode,
    themes,
    admin
  }: UpmindProps): Promise<void> {
    if (this.status.value != UpmindStatus.notInitialised)
      throw new DetailedError(
        (i18n?.instance.global as Composer).t("error.upmind_initialised"),
        responseCodes.Conflict,
        ErrorOrigin.Headless
      );
    this.status.value = UpmindStatus.initialising;
    this.allowedScopes = allowedScopes;
    this.debug = debug;
    this.testMode = testMode;
    this.mode = mode ?? "default";
    this.pop = pop;
    this.analytics = analytics;
    this.recaptcha = recaptcha;
    this.router = router;
    this.i18n = i18n;
    this.storefrontUrl = storefrontUrl;
    this.themes = themes;
    this.admin = admin ?? false;
    this.platformUrl = platformUrl;

    this.initPlugins();
    this.initDebugging();
    this.initTestMode();

    return usePOP(this.pop)
      .isReady()
      .then(async () => {
        // Bail out if we are in express mode
        if (this.mode == "express") return;

        // NB: set up our locale, but dont wait for our i18n packages to load
        useLocale().setDefaultLocale();

        // then initialise our core modules and wait for them to be ready
        return (
          Promise.allSettled([
            useBrand().isReady(),
            useSystem().isReady(),
            useSessionStore().initStore({ allowedScopes: this.allowedScopes })
          ])
            // Brand unavailable — redirect to platform if configured
            .then(() => {
              const { meta } = useBrand();
              if (!meta.value.isAvailable && this.platformUrl) {
                window.location.href = this.platformUrl;
                return Promise.reject();
              }
            })
            // then initialise our localisation to ensure i18n is available to our app/composables/machines
            .then(() => this.initLocalisation())
            // and then we start with our render blocking initialisations
            .then(() => Promise.all([this.initTheming(), this.initRouter()]))
            // finally we do our non-render blocking initialisations
            .then(() => {
              this.initRecaptcha();
              this.initAnalytics();
            })
        );
      })
      .finally(() => {
        this.status.value = UpmindStatus.initialised;
      });
  }

  /**
   * Initialises internal plugins, currently including `VueQueryPlugin`.
   * This method sets up the `plugins` property based on internal defaults and provides options.
   * @private
   */
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

  /**
   * Initialises debugging features, including XState inspector, based on
   * `debug` prop and session storage.
   * @private
   */
  private async initDebugging() {
    const { get, set } = useSessionStorage();

    // We now persist debugging to sessionStorage so we can debug an entire session
    // without having to pass the debug flag in the URL every time.

    const queryParams = new URLSearchParams(window?.location?.search);

    // always honour the debug flag in the URL
    if (queryParams.has("debug")) set("debug", true);

    // otherwise read our debugging flag from session storage or fallback to the default (true if DEV)
    const debugging = get("debug") ?? this.debug;
    this.debug = debugging;

    // finally, start the inspector if debugging is enabled
    if (debugging)
      inspect({
        // url: "https://stately.ai/registry/editor/inspect",
        // url: "https://statecharts.io/inspect",
        // url: "https://stately.ai/viz?inspect", // (default)
        iframe: false
      });
  }

  /**
   * Exposes the entire live headless system on `window.Upmind` when `testMode`
   * is enabled; no-ops otherwise. Lets Playwright e2e specs drive the same
   * running system the app uses (real session, real query cache) instead of raw
   * HTTP that leaves the cache stale. The barrel is grabbed via a dynamic import
   * so it resolves after the module graph has fully evaluated — a static import
   * of the aggregator barrel would create the import-time cycle `code-style.md`
   * forbids. Unlike {@link initDebugging} there is no URL/query/sessionStorage
   * escape hatch — it attaches only when the host app opts in via `testMode`, so
   * it can never surface in a production build.
   * @private
   */
  private initTestMode(): void {
    if (!this.testMode) return;
    void import("./index")
      .then(Upmind => {
        window.Upmind = Upmind;
      })
      .catch(err => {
        // Surface a chunk-load failure here; otherwise window.Upmind silently
        // never attaches and every bridge helper times out with a misleading
        // "is the cart running in test mode?" message.
        console.error("Upmind test bridge failed to load", err);
      });
  }

  /**
   * Initialises reCAPTCHA integration if enabled.
   * @private
   */
  private async initRecaptcha() {
    if (this.mode == "express") return;

    const { init } = useRecaptcha();

    init(this.recaptcha?.siteKey, this.recaptcha?.enabled);
  }

  /**
   * Initialises analytics tracking, primarily Google Tag Manager (GTM).
   * It dynamically injects the GTM script and initialises the data layer.
   * @private
   */
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

  /**
   * Initialises Vue Router integration with defined flows.
   * @private
   */
  private async initRouter() {
    const { init, register } = useRoutingEngine();
    if (!this.router?.instance) return;

    // initialise the router engine with the router instance
    init(this.router.instance);

    // then register any funnels
    const config = isFunction(this.router?.registerFunnels)
      ? this.router.registerFunnels()
      : {};
    register(config);

    // finally, conditionally set up the router guards
    if (this.router.guardRoutes) useRouting(this.router.instance);
  }

  /**
   * Initialises the theming module with provided theme configurations.
   * @private
   * @returns A promise that resolves when theming is ready.
   */
  private async initTheming() {
    const { isReady } = useTheming(this.themes);
    await isReady();
  }

  /**
   * Initialises the internationalisation (i18n) module with the Vue I18n instance and translation files.
   * @private
   * @returns A promise that resolves when localisation is ready.
   */
  private async initLocalisation() {
    const { isReady } = useLocalisation(this.i18n?.instance, this.i18n?.files);
    return isReady();
  }
  // ---------------------------------------------------------------------------

  /**
   * Returns a promise that resolves when the Upmind instance has completed its
   * initialisation (status is `initialised` or `initialising`).
   * This method can be used to await the full readiness of the Upmind headless library.
   *
   * @returns A promise that resolves when Upmind is initialised.
   */
  async isReady(): Promise<void> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        // console.debug(
        //   "useUpmind",
        //   "isReady",
        //   this.status.value == UpmindStatus.initialised,
        //   { status: this.status.value }
        // );
        if (this.status.value == UpmindStatus.initialised) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }
}

const upmind = new Upmind();
export default upmind;
