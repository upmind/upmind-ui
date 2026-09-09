// -----------------------------------------------------------------------------
/**
 * @module tests/template-slots
 * @description Plan R12 / gap doc X11 and X16: the brand writes the client
 * area's own copy into the platform's template slots, and the shape renders
 * whatever it finds there. Six slots, five in-page notes and the shell footer.
 *
 * Every assertion is differential against the gates-off dataset (plan R9),
 * which seeds the footer alone: a note proven only on the brand that happens
 * to author one is a seed read-back, not a slot.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { ClientTemplateSlotCodes } from "@upmind-automation/types";
import { propsBinding, rowBinding } from "./support/page-config";
import { find, map } from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { MockDataset } from "~/portal/mock/types";
import type { PageKey } from "~/portal/types";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { hostgridConfig } from "~/portal/config/hostgrid";
import {
  DATA_REF_ID,
  isDataRef,
  resolveDataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { templateSlotBody, useMockClientTemplate } from "~/portal/mock/facades";
import { useMockBrandGates } from "~/portal/mock/gates";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { HOSTGRID_MINIMAL_MOCK_DATASET } from "~/portal/mock/hostgrid-minimal";
import { MOCK_DATASET_ID } from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const LAYOUT_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "app",
  "layouts",
  "default.vue"
);

/** The slot codes plan R12 puts on screen, each with the page note it fills. */
const SLOT_NOTES: readonly {
  readonly code: ClientTemplateSlotCodes;
  readonly page: PageKey;
  readonly markdownRef: DataRefId;
}[] = [
  {
    code: ClientTemplateSlotCodes.DASHBOARD_OVERVIEW,
    page: PAGE_KEY.DASHBOARD,
    markdownRef: DATA_REF_ID.TEMPLATE_DASHBOARD_MARKDOWN
  },
  {
    code: ClientTemplateSlotCodes.INVOICES_OVERVIEW,
    page: PAGE_KEY.BILLING_INVOICES,
    markdownRef: DATA_REF_ID.TEMPLATE_INVOICES_MARKDOWN
  },
  {
    code: ClientTemplateSlotCodes.SUPPORT_OVERVIEW,
    page: PAGE_KEY.SUPPORT_TICKETS,
    markdownRef: DATA_REF_ID.TEMPLATE_SUPPORT_MARKDOWN
  },
  {
    code: ClientTemplateSlotCodes.AFFILIATES_OVERVIEW,
    page: PAGE_KEY.ACCOUNT_AFFILIATE,
    markdownRef: DATA_REF_ID.TEMPLATE_AFFILIATES_MARKDOWN
  },
  {
    code: ClientTemplateSlotCodes.CONTRACT_PRODUCT_OVERVIEW,
    page: "product-area/overview",
    markdownRef: DATA_REF_ID.TEMPLATE_PRODUCT_MARKDOWN
  }
];

/**
 * Every slot this plan seats: the five page notes, the shell's own footer, and
 * the two the logged-out layout carries (plan F11) — those two are chrome, not
 * a page row, so they are named here rather than in `SLOT_NOTES`.
 */
const SLOT_CODES: readonly ClientTemplateSlotCodes[] = [
  ...map(SLOT_NOTES, "code"),
  ClientTemplateSlotCodes.FOOTER,
  ClientTemplateSlotCodes.LOGIN_PAGE,
  ClientTemplateSlotCodes.REGISTER_PAGE
];

function noteRow(page: PageKey, markdownRef: DataRefId): ConfigNode {
  const config = hostgridConfig.pages?.[page];
  if (config === undefined) throw new Error(`no page config for ${page}`);
  const row = rowBinding(config, markdownRef);
  if (row === undefined) throw new Error(`no note row binds ${markdownRef}`);
  return row;
}

function noteVisible(row: ConfigNode, data: MockDataset): unknown {
  const ref = row.visible;
  if (!isDataRef(ref)) throw new Error("the note row declares no presence ref");
  return resolveDataRef(ref, data);
}

function noteMarkdown(
  row: ConfigNode,
  markdownRef: DataRefId,
  data: MockDataset
): unknown {
  const props = resolveDataRefProps(propsBinding(row, markdownRef), data);
  return props?.["markdown"];
}

/** The gates read the dataset the settings dialog picked, so drive them through it. */
function gatesFor(datasetId: string) {
  Object.assign(globalThis, { useRoute: () => ({ path: "/", query: {} }) });
  usePortalConfig().setDataset(datasetId);
  return useMockBrandGates();
}

describe("the facade reads one slot, by the platform's own code", () => {
  it("hands back the body the brand authored, and an empty string for a slot it left blank", () => {
    for (const code of SLOT_CODES) {
      const seeded = find(HOSTGRID_MOCK_DATASET.templates, { code });
      const slot = useMockClientTemplate(HOSTGRID_MOCK_DATASET, code);

      expect(slot.useContext().data.value?.code).toBe(code);
      expect(slot.useContext().data.value?.body).toBe(seeded?.body);
      expect(templateSlotBody(HOSTGRID_MOCK_DATASET.templates, code)).not.toBe(
        ""
      );
    }
    expect(
      templateSlotBody(
        HOSTGRID_MINIMAL_MOCK_DATASET.templates,
        ClientTemplateSlotCodes.DASHBOARD_OVERVIEW
      )
    ).toBe("");
  });

  it("seats every slot this plan renders on the brand that authors them", () => {
    expect(map(HOSTGRID_MOCK_DATASET.templates, "code").sort()).toEqual(
      [...SLOT_CODES].sort()
    );
  });
});

describe("the brand note on each of the five pages", () => {
  it("renders the slot's own body where the brand wrote one", () => {
    for (const { code, page, markdownRef } of SLOT_NOTES) {
      const row = noteRow(page, markdownRef);
      const body = templateSlotBody(HOSTGRID_MOCK_DATASET.templates, code);

      expect(noteVisible(row, HOSTGRID_MOCK_DATASET)).toBe(true);
      expect(noteMarkdown(row, markdownRef, HOSTGRID_MOCK_DATASET)).toBe(body);
      expect(body).not.toBe("");
    }
  });

  it("hides every one of them on a brand that authored only its footer", () => {
    for (const { code, page, markdownRef } of SLOT_NOTES) {
      const row = noteRow(page, markdownRef);

      expect(noteVisible(row, HOSTGRID_MINIMAL_MOCK_DATASET)).toBe(false);
      expect(
        noteMarkdown(row, markdownRef, HOSTGRID_MINIMAL_MOCK_DATASET)
      ).toBe("");
      expect(
        templateSlotBody(HOSTGRID_MINIMAL_MOCK_DATASET.templates, code)
      ).toBe("");
    }
    expect(map(HOSTGRID_MINIMAL_MOCK_DATASET.templates, "code")).toEqual([
      ClientTemplateSlotCodes.FOOTER
    ]);
  });
});

describe("the shell footer — the brand's own line, and Upmind's", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("prints the footer slot's body on whichever dataset is active", () => {
    expect(gatesFor(MOCK_DATASET_ID.HOSTGRID).footerMarkdown.value).toBe(
      templateSlotBody(
        HOSTGRID_MOCK_DATASET.templates,
        ClientTemplateSlotCodes.FOOTER
      )
    );
    expect(
      gatesFor(MOCK_DATASET_ID.HOSTGRID_MINIMAL).footerMarkdown.value
    ).toBe(
      templateSlotBody(
        HOSTGRID_MINIMAL_MOCK_DATASET.templates,
        ClientTemplateSlotCodes.FOOTER
      )
    );
    expect(gatesFor(MOCK_DATASET_ID.HOSTGRID).footerMarkdown.value).not.toBe(
      ""
    );
  });

  it("carries the Powered-by line exactly where UPMIND_BRANDING_ENABLED says so", () => {
    expect(gatesFor(MOCK_DATASET_ID.HOSTGRID).hasUpmindBranding.value).toBe(
      HOSTGRID_MOCK_DATASET.features.UPMIND_BRANDING_ENABLED
    );
    expect(
      gatesFor(MOCK_DATASET_ID.HOSTGRID_MINIMAL).hasUpmindBranding.value
    ).toBe(HOSTGRID_MINIMAL_MOCK_DATASET.features.UPMIND_BRANDING_ENABLED);
    expect(HOSTGRID_MOCK_DATASET.features.UPMIND_BRANDING_ENABLED).toBe(true);
    expect(HOSTGRID_MINIMAL_MOCK_DATASET.features.UPMIND_BRANDING_ENABLED).toBe(
      false
    );
  });
});

describe("the print view — a printed page is the document, not the portal", () => {
  it("hides the sidebar, the header, the footer and both asides at print", () => {
    const layout = readFileSync(LAYOUT_FILE, "utf8");
    const printRule = /@media\s+print\s*\{([\s\S]*?)\n\}/.exec(layout);

    expect(printRule).not.toBeNull();
    for (const slot of [
      "shell-sidebar",
      "shell-header",
      "shell-footer",
      "action-pane",
      "page-aside"
    ]) {
      expect(printRule?.[1]).toContain(`[data-slot="${slot}"]`);
    }
    expect(printRule?.[1]).toContain("display: none");
  });
});
