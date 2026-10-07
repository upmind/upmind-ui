// -----------------------------------------------------------------------------
/**
 * @module portal/mock/gates
 * @description The active dataset's brand gates, for the guards legacy ran in
 * its ROUTER rather than in a page's content (plan R8). A page reads a flag
 * and redirects; the derivation lives here, with the rest of the mock layer.
 *
 * Separate from `injection.ts`'s provide/inject seam on purpose: a page guard
 * runs in its own `setup` before any provider above it has been consulted, so
 * it resolves the dataset the same way `provideActiveMockData` does.
 */

import { computed } from "vue";
import { ClientTemplateSlotCodes } from "@upmind-automation/types";
import { templateSlotBody } from "./facades";
import { isMockDatasetId, useMockData } from "./store";
import { size, some } from "lodash-es";
import type { MockBrandFeatures, MockDataset } from "./types";
import type { IClientTemplateSlot } from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import { usePortalConfig } from "~/composables/usePortalConfig";
// -----------------------------------------------------------------------------

/** Where the logged-out shell's cart shortcut goes — in-app, or the brand's own storefront. */
export type MockStoreShortcut =
  | { readonly to: string }
  | { readonly href: string };

export type MockBrandGates = {
  /** The brand's own footer copy — its `footer` template slot (plan R12). */
  footerMarkdown: ComputedRef<string>;
  /** The wordmark the logged-out screens carry — the brand's own name. */
  brandName: ComputedRef<string>;
  /** The brand's own note above the sign-in form — its `login_page` slot (plan R12). */
  loginMarkdown: ComputedRef<string>;
  /** The same, above the registration form — its `register_page` slot. */
  registerMarkdown: ComputedRef<string>;
  /** Whether anybody may open an account — legacy's `brand/hasRegistrationEnabled` (plan F11). */
  isRegistrationEnabled: ComputedRef<boolean>;
  /** Whether this brand opens ORGANISATIONS too — legacy's own Upmind org context. */
  isOrgRegistrationEnabled: ComputedRef<boolean>;
  /** The logged-out header's cart shortcut, where the brand shows its store at all. */
  storeShortcut: ComputedRef<MockStoreShortcut | undefined>;
  /** Whether the shell's "Powered by Upmind" line renders (`UPMIND_BRANDING_ENABLED`). */
  hasUpmindBranding: ComputedRef<boolean>;
  /** The active dataset's gates — undefined for a shape with no seed. */
  features: ComputedRef<MockBrandFeatures | undefined>;
  /** Legacy's `disable_support_system`: the whole support pillar is off. */
  isSupportDisabled: ComputedRef<boolean>;
  /** Where a refused route lands — the brand's own client homepage. */
  homePath: ComputedRef<string>;
  /** Whether this account manages any other — the child-accounts nav gate. */
  hasChildAccounts: ComputedRef<boolean>;
  /** Whether this account is itself managed by another — the same page's other side. */
  isChildAccount: ComputedRef<boolean>;
};

/** One brand-authored slot's body, for a shape with no seed at all. */
function slotBody(
  data: MockDataset | undefined,
  code: IClientTemplateSlot["code"]
): string {
  if (data === undefined) return "";
  return templateSlotBody(data.templates, code);
}

export function useMockBrandGates(): MockBrandGates {
  const { activeDatasetId } = usePortalConfig();

  const dataset = computed<MockDataset | undefined>(() => {
    const id = activeDatasetId.value;
    if (!isMockDatasetId(id)) return undefined;
    return useMockData(id);
  });

  const features = computed<MockBrandFeatures | undefined>(
    () => dataset.value?.features
  );

  return {
    features,
    footerMarkdown: computed(() =>
      slotBody(dataset.value, ClientTemplateSlotCodes.FOOTER)
    ),
    brandName: computed(() => dataset.value?.brand.name ?? ""),
    loginMarkdown: computed(() =>
      slotBody(dataset.value, ClientTemplateSlotCodes.LOGIN_PAGE)
    ),
    registerMarkdown: computed(() =>
      slotBody(dataset.value, ClientTemplateSlotCodes.REGISTER_PAGE)
    ),
    isRegistrationEnabled: computed(
      () => features.value?.CLIENT_REGISTRATION_ENABLED === true
    ),
    isOrgRegistrationEnabled: computed(
      () => features.value?.isUpmindOrgContext === true
    ),
    // The same pair of branches the primary nav's store entry reads
    // (`selectors.ts` `placeOrderNavItem`): a brand selling from its own
    // storefront leaves the portal, everybody else goes to the catalogue.
    storeShortcut: computed(() => {
      const gates = features.value;
      if (gates?.showStore !== true) return undefined;
      const storefront = gates.customStorefrontUrl;
      if (storefront === undefined) return { to: "/products/order" };
      return { href: storefront };
    }),
    hasUpmindBranding: computed(
      () => features.value?.UPMIND_BRANDING_ENABLED === true
    ),
    isSupportDisabled: computed(
      () => features.value?.DISABLE_SUPPORT_SYSTEM === true
    ),
    homePath: computed(() => features.value?.DEFAULT_CLIENT_HOMEPAGE ?? "/"),
    hasChildAccounts: computed(() => size(dataset.value?.childAccounts) > 0),
    // Reads true while the persona IS one of the children — which is what
    // logging in as one makes it (plan R10), so the relation page stays
    // reachable from the child's own side.
    isChildAccount: computed(() => {
      const data = dataset.value;
      if (data === undefined) return false;
      return some(
        data.childAccounts,
        child => child.child_client_id === data.persona.id
      );
    })
  };
}
