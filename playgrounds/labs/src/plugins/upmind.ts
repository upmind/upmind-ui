import type { App, Plugin } from "vue";
import { useApi, useBrand, useSession, useSystem } from "@upmind/headless-vue";

const upmindPlugin: Plugin = {
  install: (app: App): void => {
    useApi();
    // lets initialize our system, brand + session machines as they are global
    useSystem();
    useBrand();
    useSession();
  },
};

export default upmindPlugin;
