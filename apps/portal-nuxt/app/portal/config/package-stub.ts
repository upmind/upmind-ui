// -----------------------------------------------------------------------------
/**
 * @module portal/config/package-stub
 * @description The stub a route renders where a domain package
 * already ships the surface. The sandbox mocks what is NEW; an existing
 * component over a headless module is named, not rebuilt. What each one must
 * still supply is listed in `docs/client-vue-adoption.md`.
 */

import { ROW_LAYOUT } from "../content/types";
import { PACKAGE_STUB_TITLE, packageStubProse } from "../mock/package-stub";
import { EMPTY_STATE_MODULE_ID, moduleRef } from "../registry";
import type { ContentRowConfig } from "../content/types";
import type { ContentConfig } from "../types";

export { PACKAGE_STUB_TITLE, packageStubProse };

export function packageStubRow(
  component: string,
  module: string
): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    slots: [
      moduleRef(EMPTY_STATE_MODULE_ID, {
        props: {
          title: PACKAGE_STUB_TITLE,
          description: packageStubProse(component, module)
        }
      })
    ]
  };
}

export function packageStubPage(
  title: string,
  description: string,
  component: string,
  module: string
): ContentConfig {
  return {
    title,
    description,
    rows: [packageStubRow(component, module)],
    footer: false
  };
}
