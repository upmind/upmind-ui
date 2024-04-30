import type { App, Plugin } from "vue";
import {
  useApi,
  useBrand,
  useI18n,
  useSession,
  useSystem,
} from "@upmind/client";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $upmind: ReturnType<typeof useApi>;
  }
}

const upmindPlugin: Plugin = {
  install: (app: App): void => {
    const api = useApi();

    // lets initialize our system, brand + session machines as they are global
    useSystem();
    useBrand();
    useSession();

    const i18n = useI18n();

    app.provide("upmind", api);
    app.provide("i18n", i18n);
  },
};

export default upmindPlugin;
