import type { App, Plugin } from "vue";
import { useApi, useBrand, useSession } from "@upmind/vue";
import { useSystem } from "@/modules/system";

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

    app.provide("upmind", api);
  }
};

export default upmindPlugin;
