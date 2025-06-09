import Upmind, {
  type UpmindProps,
  UpmindStatus,
} from "@upmind-automation/headless";

// --- alternative implementation ----------------------------------------------

import { useRouting } from "./modules/routing";
import { useI18n } from "./modules/system/i18n";

// ---types
import type { I18n } from "vue-i18n";
import type { Router } from "vue-router";
import type { Flow } from "@upmind-automation/headless";
import type { GlobbedFiles } from "./modules/system/i18n/types";

// ---

interface UpmindClientProps extends UpmindProps {
  router?: {
    enabled?: boolean;
    provider: Router;
    flows?: Flow[];
  };
  i18n?: {
    provider: I18n;
    files: GlobbedFiles;
    debug?: boolean;
  };
}

class UpmindClient {
  private status: UpmindStatus = UpmindStatus.notInitialised;
  // ---
  plugins: UpmindClientProps["plugins"];
  pop: UpmindClientProps["pop"];
  i18n: UpmindClientProps["i18n"];
  router: UpmindClientProps["router"];
  recaptcha: UpmindClientProps["recaptcha"];
  analytics: UpmindClientProps["analytics"];

  // ---
  constructor() {
    // console.debug("Upmind Client has started");
  }

  init({
    app,
    mode,
    pop,
    router,
    i18n,
    recaptcha,
    analytics,
    debug,
  }: UpmindClientProps) {
    // NB: Only initialise once
    if (this.status != UpmindStatus.notInitialised) return Promise.resolve();

    this.status = UpmindStatus.initialising;

    this.router = router;
    this.i18n = i18n;

    this.initPlugins();

    Upmind.init({ app, mode, pop, recaptcha, analytics, debug });
  }

  start(): Promise<void> {
    if (Upmind.mode == "express") {
      this.status = UpmindStatus.initialised;
      return Promise.resolve();
    }
    return Upmind.start().then(() => {
      return Promise.allSettled([this.initRouter(), this.initI18n()]).then(
        () => {
          this.status = UpmindStatus.initialised;
        }
      );
    });
  }
  // --- initialise the router and i18n after Upmind has started

  private initPlugins() {
    this.plugins = Upmind.plugins ?? {};
  }

  private async initRouter() {
    if (!this.router?.provider || !this.router.enabled) return;
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

  // ---
  isReady(): Promise<void> {
    return new Promise(resolve =>
      setTimeout(() => {
        if (this.status !== UpmindStatus.notInitialised) {
          resolve();
        }
      }, 100)
    );
  }
}

// --- create a singleton provider of Upmind
const upmindClient = new UpmindClient();
export default upmindClient;
