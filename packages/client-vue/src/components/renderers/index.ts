import { registerEntry } from "@upmind/upwind";

// -----------------------------------------------------------------------------

import DomainRenderer, { tester as domainTest } from "./DomainRenderer.vue";

// -----------------------------------------------------------------------------

export const formRenderers = [registerEntry(DomainRenderer, domainTest)];
