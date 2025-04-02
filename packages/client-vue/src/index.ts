// --- expose our package exports
import Upmind from "@upmind-automation/headless-vue";

export * from "@upmind-automation/headless-vue";
export { default as Upm } from "./Upmind.vue";
export * from "./components";
export * from "./modules";

// export type { ActorRef } from "xstate";

// --- alternative implementation ----------------------------------------------

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

class UpmindClient {
  private status: UpmindStatus = UpmindStatus.notInitialised;
  // ---
  app: UpmindProps["app"] | undefined;
  pop: UpmindProps["pop"];
  i18n: UpmindProps["i18n"];
  router: UpmindProps["router"];
  analytics: UpmindProps["analytics"];

  // ---
  constructor() {
    console.debug("Upmind Client has started");
  }

  init({ app, pop, router, i18n, analytics }: UpmindProps): Promise<void> {
    // NB: Only initialise once
    if (this.status != UpmindStatus.notInitialised) return Promise.resolve();

    this.status = UpmindStatus.initialising;

    return Upmind.init({ app, pop, analytics }).then(() => {
      this.app = Upmind.app;
      this.pop = Upmind.pop;
      this.analytics = Upmind.analytics;
      this.router = router;
      this.i18n = i18n;

      return Promise.all([this.initRouter(), this.initI18n()]).then(() => {
        this.status = UpmindStatus.initialised;
      });
    });
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
const upmindClient = new UpmindClient();
export default upmindClient;
