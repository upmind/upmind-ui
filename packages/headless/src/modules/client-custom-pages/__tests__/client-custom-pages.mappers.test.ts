// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-pages — the mapper's translation fallback (AC-7)
 *
 * ## Job To Be Done
 * Prove the ONE pure-function branch no recorded fixture can reach on this
 * brand's empty custom-pages catalogue: `menuLabel`/`title` fall back to the
 * untranslated wire value when the `*_translated` member carries no real
 * translation. Oracle parity O26/O30 (`Direct`): legacy reads
 * `menu_label_translated || menu_label` and `title_translated || title`
 * (`loggedIn/index.vue:94`, `navigationRibbon.vue:38`,
 * `views/client/custom/index.vue:25`). `ICustomPage.menu_label_translated`
 * and `.title_translated` are non-optional `string` members
 * (`@upmind-automation/types` `customPage.d.ts`), so "no translation" is an
 * EMPTY STRING on the wire, never `undefined` — a literal `""`, hand-built
 * here per this module's mapper, is a unit test, not a fabricated fixture
 * (`client-email-history.mappers.test.ts` is the established precedent for
 * this exact pattern in this tree).
 *
 * ## What Breaks If These Fail
 * The mapper uses `||`, not `??`, precisely because the wire's "absent"
 * shape is `""`, not `null`/`undefined` — `??` would let an empty-string
 * translation through and every menu entry / page title would render blank
 * for a page whose translation was cleared rather than never set.
 */

import { describe, expect, it } from "vitest";
import { mapCustomPage } from "../client-custom-pages.mappers";
import type { ICustomPage } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const wireRow = (overrides: Partial<ICustomPage> = {}): ICustomPage => ({
  id: "page-1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  brand_id: "brand-1",
  org_id: "org-1",
  name: "About",
  slug: "about",
  show_on_menu: true,
  menu_label: "About Us",
  menu_label_translated: "",
  title: "About Our Company",
  title_translated: "",
  ...overrides
});

describe("client-custom-pages mapper — menu label and title translation fallback (O26/O30)", () => {
  it("uses the translated menu label and title when a real translation is present", () => {
    const mapped = mapCustomPage(
      wireRow({
        menu_label_translated: "À propos",
        title_translated: "À propos de notre entreprise"
      })
    );

    expect(mapped.menuLabel).toBe("À propos");
    expect(mapped.title).toBe("À propos de notre entreprise");
  });

  it("falls back to the untranslated menu label and title when the translated value is an empty string", () => {
    const mapped = mapCustomPage(
      wireRow({ menu_label_translated: "", title_translated: "" })
    );

    // The `||` vs `??` case: an empty-string translation is exactly what `??`
    // would treat as "present" and wrongly pass through.
    expect(mapped.menuLabel).toBe("About Us");
    expect(mapped.title).toBe("About Our Company");
  });
});
