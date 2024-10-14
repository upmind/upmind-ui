import { registerEntry } from "@upmind-automation/upwind";

// -----------------------------------------------------------------------------

import DomainRenderer, { tester as domainTest } from "./DomainRenderer.vue";

// -----------------------------------------------------------------------------

export const additionalRenderers = [registerEntry(DomainRenderer, domainTest)];
