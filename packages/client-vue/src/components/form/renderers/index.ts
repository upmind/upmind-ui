import { registerEntry } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

import DomainRenderer, { tester as domainTest } from "./DomainRenderer.vue";

// -----------------------------------------------------------------------------

export const formRenderers = [registerEntry(DomainRenderer, domainTest)];
