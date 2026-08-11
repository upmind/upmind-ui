// @vitest-environment jsdom
/**
 * @module scenarios/runtime/composables/__tests__/criteria-url-sync-clear.spec
 * @description DIAGNOSIS probe (P1-R7, step 0): the url half of the clear.
 *
 * Core clears (`criteria-clear.int.test.ts`), the renderer empties its leaf
 * (`filter-clear.test.ts`) and the bar forwards it verbatim
 * (`filter-bar-clear.spec.ts`) — so the surviving suspect is the url the page
 * keys itself on. Three claims, in the order a clear travels them:
 *   1. the serialiser drops a cleared column;
 *   2. the LIVE sync takes the param off `window.location` — a merge-only
 *      write would leave it there forever;
 *   3. a stale param re-seeds the old filter on the next boot, which is what
 *      makes (2) a functional defect rather than a cosmetic one.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, nextTick, ref } from "vue";
import {
  useQuerySchema,
  useQueryUischema
} from "@upmind-automation/headless/testing/client-email/internal-kit";
import {
  criteriaToParams,
  paramsToCriteria,
  useCriteriaUrlSync
} from "../useCriteriaUrlSync";
import type { ModulePortCriteria } from "../useModulePort.types";

/** The url's own spelling of the column — not the wire's `filter[col|op]`. */
const VERIFIED_PARAM = "filter.verified.eq";
const VERIFIED_VALUE = "false";
const SET_FILTER = { filters: { verified: { eq: false } } };
const CLEARED_LEAF = { filters: { verified: {} } };
const CLEARED_BRANCH = { filters: {} };

const search = () => new URLSearchParams(window.location.search);

const settle = async (): Promise<void> => {
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 50));
  await nextTick();
};

function syncedCriteria(seed: Record<string, unknown>): {
  write: (next: Record<string, unknown>) => void;
} {
  const model = ref<Record<string, unknown>>(seed);
  const criteria: ModulePortCriteria = {
    schema: useQuerySchema(),
    uischema: useQueryUischema(),
    model: computed(() => model.value),
    set: vi.fn()
  };
  useCriteriaUrlSync(criteria, { enabled: true });
  return {
    write: next => {
      model.value = next;
    }
  };
}

beforeEach(() => {
  window.history.replaceState({}, "", "/useClientEmails/as/client");
});

describe("PROBE — the serialiser drops a cleared column (P1-R7)", () => {
  it("emits no filter param for an emptied leaf or an emptied branch", () => {
    expect(criteriaToParams(useQuerySchema(), SET_FILTER)).toHaveProperty(
      VERIFIED_PARAM,
      VERIFIED_VALUE
    );
    expect(criteriaToParams(useQuerySchema(), CLEARED_LEAF)).not.toHaveProperty(
      VERIFIED_PARAM
    );
    expect(
      criteriaToParams(useQuerySchema(), CLEARED_BRANCH)
    ).not.toHaveProperty(VERIFIED_PARAM);
  });
});

describe("PROBE — the live sync takes a cleared column OFF the url (P1-R7)", () => {
  it("removes the column from window.location when the leaf is emptied", async () => {
    const { write } = syncedCriteria(SET_FILTER);
    await settle();
    expect(search().get(VERIFIED_PARAM)).toBe(VERIFIED_VALUE);

    write(CLEARED_LEAF);
    await settle();

    expect(search().get(VERIFIED_PARAM)).toBeNull();
  });

  it("removes it when the whole filters branch is emptied", async () => {
    const { write } = syncedCriteria(SET_FILTER);
    await settle();
    expect(search().get(VERIFIED_PARAM)).toBe(VERIFIED_VALUE);

    write(CLEARED_BRANCH);
    await settle();

    expect(search().get(VERIFIED_PARAM)).toBeNull();
  });
});

describe("PROBE — a stale param re-seeds the old filter on the next boot", () => {
  it("reads a stale column straight back into the criteria seed", () => {
    expect(
      paramsToCriteria(useQuerySchema(), { [VERIFIED_PARAM]: VERIFIED_VALUE })
    ).toEqual(expect.objectContaining(SET_FILTER));
  });
});
