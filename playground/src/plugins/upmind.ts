import type { App, Plugin } from "vue";
import { useApi } from "@/modules/api";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $upmind: ReturnType<typeof useApi>;
  }
}

const upmindPlugin: Plugin = {
  install: (app: App): void => {
    const api = useApi();
    app.provide("upmind", api);
  }
};

export default upmindPlugin;
