// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockProvisioning
 * @description ONE product's provisioning surface, managed — the mock stand-in
 * for `useContractProductProvisioning`
 * (`contracts/contract-product-provisioning.ts`): the config fields the
 * provider hands back, the functions a client may run, and the panels embedded
 * in the overview.
 *
 * A frame OPENED by a `RENDER_IFRAME` function is view state, not data — the
 * provider decided to show it, this session, for this product — so it is held
 * here beside the seed rather than written into the dataset, exactly as the
 * impersonation ribbon holds its own (`mock/impersonation.ts`). The context
 * hands back the seeded panels with it appended, so nothing downstream merges
 * two lists.
 */

import { ref } from "vue";
import { ProvisionRequestActionTypes } from "@upmind-automation/types";
import { defineMockFacade, MOCK_RECEIPT_REASON } from "./facade";
import { assign, find, reject } from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type {
  MockProductIframe,
  MockProvisionField,
  MockProvisionFunction,
  MockProvisioning
} from "../types";

/** The provisioning surface as the overview reads it — the seed, plus what this session opened. */
export type MockProvisioningView = {
  readonly fields: readonly MockProvisionField[];
  readonly functions: readonly MockProvisionFunction[];
  readonly iframes: readonly MockProductIframe[];
};

const EMPTY_PROVISIONING: MockProvisioning = {
  fields: [],
  functions: [],
  iframes: []
};

/** Which frame each product has open, if any — this session's, keyed by product. */
const openedFrames = ref<Readonly<Record<string, MockProductIframe>>>({});

/** The panels on screen: the seeded ones, then the one a function just opened. */
function panels(
  seeded: readonly MockProductIframe[],
  opened: MockProductIframe | undefined
): readonly MockProductIframe[] {
  if (opened === undefined) return seeded;
  // A function run twice reopens the SAME panel rather than stacking a second
  // copy of it — the frame is where the provider is, not a log of visits.
  return [...reject(seeded, { url: opened.url }), opened];
}

export const useMockProvisioning = defineMockFacade(
  (data, productId): MockProvisioningView => {
    const product = find(data.products, { id: productId });
    const provisioning = product?.provisioning ?? EMPTY_PROVISIONING;
    return {
      fields: provisioning.fields,
      functions: provisioning.functions,
      iframes: panels(provisioning.iframes, openedFrames.value[productId])
    };
  },
  (data, productId) => ({
    /**
     * Runs one provider function. What the client must do next is the KIND's
     * to say and the dispatcher's to carry out (a redirect, a toast); the one
     * outcome that lands here is the frame a `RENDER_IFRAME` opens, because
     * that is state this surface then renders.
     */
    run: (
      code: string
    ): MockActionReceipt<MockProvisionFunction> | undefined => {
      const product = find(data.products, { id: productId });
      if (product === undefined) return undefined;
      const ran = find(product.provisioning.functions, { code });
      if (ran === undefined) return undefined;

      const needsTarget =
        ran.kind === ProvisionRequestActionTypes.REDIRECT ||
        ran.kind === ProvisionRequestActionTypes.RENDER_IFRAME;
      if (needsTarget && ran.url === undefined) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.NO_PROVISION_TARGET,
          entity: ran
        };
      }
      if (
        ran.kind === ProvisionRequestActionTypes.RENDER_IFRAME &&
        ran.url !== undefined
      ) {
        openedFrames.value = assign({}, openedFrames.value, {
          [productId]: { title: ran.label, url: ran.url }
        });
      }
      return { ok: true, entity: ran };
    }

    /**
     * Answers the setup blueprint and confirms it in one go — legacy's own
     * Confirm control. The answers land on the fields the overview reads, so
     * the product goes live carrying what the client just told the provider.
     */
  })
);
