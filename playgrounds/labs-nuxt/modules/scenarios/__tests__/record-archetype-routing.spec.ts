// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/record-archetype-routing.spec
 * @description The two migration managers — `useContract` and
 * `useContractProduct` — draw through the shared RECORD archetype, not a
 * hand-drawn page. `scenario.types` states the routing rule: a record is drawn
 * "only with `useManage`; that pair is what routes a declaration to the RECORD
 * archetype". So each declaration must carry BOTH `useManage` and a
 * `presentation.record`, and NEITHER collection binding — a `useList` or
 * `useMutate` would route it to the list/editor archetypes instead.
 *
 * ## What Breaks If These Fail
 * A manager quietly falls back to a self-drawn page (no declaration, no shared
 * surface), or picks up a collection binding and renders as a table — either way
 * the record archetype stops being what draws the contract and its product.
 */

import { describe, expect, it } from "vitest";
import { registry } from "../runtime/registry";
import { CONTRACT_SCENARIO } from "../useContract/contract.scenario";
import { CONTRACT_PRODUCT_SCENARIO } from "../useContractProduct/contract-product.scenario";

// -----------------------------------------------------------------------------

const RECORD_MANAGERS = [CONTRACT_SCENARIO, CONTRACT_PRODUCT_SCENARIO];

// -----------------------------------------------------------------------------

describe("the contract managers route through the RECORD archetype", () => {
  it("binds a manager and declares a record for each", () => {
    for (const key of RECORD_MANAGERS) {
      expect(registry[key].useManage, key).toBeTypeOf("function");
      expect(registry[key].presentation?.record?.type, key).toBe(
        "RecordLayout"
      );
    }
  });

  it("names the declared record's context key for each", () => {
    for (const key of RECORD_MANAGERS)
      expect(registry[key].presentation?.record?.record, key).toBeTruthy();
  });

  it("takes neither collection binding, so neither draws as a list or editor", () => {
    for (const key of RECORD_MANAGERS) {
      expect(registry[key].useList, key).toBeUndefined();
      expect(registry[key].useMutate, key).toBeUndefined();
    }
  });
});
