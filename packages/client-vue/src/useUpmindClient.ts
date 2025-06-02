import Upmind, {
  type UpmindProps,
  UpmindStatus,
} from "@upmind-automation/headless-vue";

// --- alternative implementation ----------------------------------------------

import { useRouting } from "./modules/routing";
import { useI18n } from "./modules/system/i18n";

// ---types
import type { I18n } from "vue-i18n";
import type { Router } from "vue-router";
import type { Flow } from "@upmind-automation/headless-vue";
import type { GlobbedFiles } from "./modules/system/i18n/types";

// ---

interface UpmindClientProps extends UpmindProps {
  router?: {
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
    pop,
    router,
    i18n,
    recaptcha,
    analytics,
  }: UpmindClientProps): Promise<void> {
    // NB: Only initialise once
    if (this.status != UpmindStatus.notInitialised) return Promise.resolve();

    this.status = UpmindStatus.initialising;
    this.pop = pop;
    this.analytics = analytics;
    this.recaptcha = recaptcha;
    this.router = router;
    this.i18n = i18n;
    this.initPlugins();

    return Upmind.init({ pop, recaptcha, analytics }).then(() => {
      return Promise.all([this.initRouter(), this.initI18n()]).then(() => {
        this.status = UpmindStatus.initialised;
      });
    });
  }

  private initPlugins() {
    this.plugins = Upmind.plugins ?? {};
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
