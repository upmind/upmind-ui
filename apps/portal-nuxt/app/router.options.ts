import type { RouterConfig } from "@nuxt/schema";
// -----------------------------------------------------------------------------

const routerOptions: RouterConfig = {
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 }
};

export default routerOptions;
