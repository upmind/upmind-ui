// lets initialize our api query client and register it with the vue app
import type { VueQueryPluginOptions } from "@tanstack/vue-query";
import { useQuery as useUpmindQuery } from "@upmind-automation/headless";

const { queryClient } = useUpmindQuery();

export const vueQueryPluginOptions: VueQueryPluginOptions = {
  // @ts-ignore : minor mismatch of type between vue and core query client
  queryClient,
  enableDevtoolsV6Plugin: true,
};
