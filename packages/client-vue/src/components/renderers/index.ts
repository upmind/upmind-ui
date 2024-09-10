import { registerEntry } from "@upmind/upwind";

// -----------------------------------------------------------------------------

import DomainRenderer, { tester as domainTest } from "./DomainRenderer.vue";

// -----------------------------------------------------------------------------

export const additionalRenderers = [registerEntry(DomainRenderer, domainTest)];
