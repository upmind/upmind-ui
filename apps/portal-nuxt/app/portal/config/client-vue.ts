// -----------------------------------------------------------------------------
/**
 * @module portal/config/client-vue
 * @description The stub a route renders where `@upmind-automation/client-vue`
 * already ships the surface. The sandbox mocks what is NEW; an existing
 * component over a headless module is named, not rebuilt. What each one must
 * still supply is listed in `docs/client-vue-adoption.md`.
 */

import { ROW_LAYOUT } from "../content/types";
import { CLIENT_VUE_STUB_TITLE, clientVueProse } from "../mock/client-vue";
import { EMPTY_STATE_MODULE_ID, moduleRef } from "../registry";
import type { ContentRowConfig } from "../content/types";
import type { ContentConfig } from "../types";

export { CLIENT_VUE_STUB_TITLE, clientVueProse };

export function clientVueRow(
  component: string,
  module: string
): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    slots: [
      moduleRef(EMPTY_STATE_MODULE_ID, {
        props: {
          title: CLIENT_VUE_STUB_TITLE,
          description: clientVueProse(component, module)
        }
      })
    ]
  };
}

export function clientVuePage(
  title: string,
  description: string,
  component: string,
  module: string
): ContentConfig {
  return {
    title,
    description,
    rows: [clientVueRow(component, module)],
    footer: false
  };
}
