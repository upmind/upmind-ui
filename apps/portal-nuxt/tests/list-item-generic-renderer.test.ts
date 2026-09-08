import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mount } from "@vue/test-utils";
import { Building2, Dumbbell, Globe } from "lucide-vue-next";
import { describe, expect, it } from "vitest";
import ListModule from "~/portal/modules/list/List.vue";

/**
 * tasks.md 5.8 / AC6.6 — "no domain-specific item renderer": items from
 * three different DOMAINS (a hosting site row, a storefront product, a
 * booking class — data shapes here, not shipped configs, so the check
 * outlives any one brand's roster) must resolve to the SAME item component,
 * fed different data through the design system's generic leading/title/
 * description/trailing shape — never a `SiteRow`/`ProductTile`/`ClassCard`.
 *
 * Built from `fileURLToPath(import.meta.url)` alone (see
 * module-fetch-forbidden.test.ts) — `new URL(relative, import.meta.url)`
 * resolves to an `http://localhost` URL under this app's Vite-backed vitest.
 */
const PORTAL_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "app",
  "portal"
);

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

describe("List item — AC6.6: one generic renderer serves every product shape", () => {
  it("renders a hosting, a storefront and a booking item through the identical item element", () => {
    const hosting = mount(ListModule, {
      props: {
        variant: "compact",
        items: [
          {
            id: "site-1",
            title: "gilded-estates.com",
            description: "Pro Plan",
            leadingIcon: Globe,
            trailingText: "Online"
          }
        ],
        emptyTitle: "No sites"
      }
    });
    const storefront = mount(ListModule, {
      props: {
        variant: "compact",
        items: [
          {
            id: "product-1",
            title: "Guatemala Altera",
            description: "Whole bean · 250g",
            leadingIcon: Building2,
            trailingText: "£11.95"
          }
        ],
        emptyTitle: "No products"
      }
    });
    const booking = mount(ListModule, {
      props: {
        variant: "compact",
        items: [
          {
            id: "class-1",
            title: "Advanced Climbing Techniques",
            description: "Jon",
            leadingIcon: Dumbbell,
            trailingText: "£11.95"
          }
        ],
        emptyTitle: "No classes"
      }
    });

    for (const wrapper of [hosting, storefront, booking]) {
      const item = wrapper.find('[data-test-key="portal-list-item"]');
      expect(item.exists()).toBe(true);
      expect(item.attributes("data-slot")).toBe("list-item");
      expect(item.element.tagName).toBe("LI");
    }

    expect(hosting.text()).toContain("gilded-estates.com");
    expect(storefront.text()).toContain("Guatemala Altera");
    expect(booking.text()).toContain("Advanced Climbing Techniques");
  });

  it("ships no domain-specific item renderer under app/portal", () => {
    const offenders = listFiles(PORTAL_DIR).filter(file =>
      /(SiteRow|ProductTile|ClassCard)\.vue$/.test(file)
    );
    expect(offenders).toEqual([]);
  });
});
