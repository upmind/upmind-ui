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
import {
  useAffiliateLinkVisit,
  useClientAffiliate
} from "@upmind-automation/headless";
import { registry } from "../runtime/registry";
import { AFFILIATE_LINK_VISIT_SCENARIO } from "../useAffiliateLinkVisit/affiliate-link-visit.scenario";
import affiliateArea from "../useClientAffiliate/affiliate.scenario";
import { CONTRACT_SCENARIO } from "../useContract/contract.scenario";
import { CONTRACT_PRODUCT_SCENARIO } from "../useContractProduct/contract-product.scenario";
import { find, flatMap } from "lodash-es";

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

describe("the affiliate records address the session's own account, never an id", () => {
  const panel = (key: string) =>
    find(flatMap(affiliateArea.tabs, "panels"), { key });

  it("draws the account and the withdrawal as id-less records over the client's own affiliate account", () => {
    for (const key of ["account", "withdrawal"]) {
      expect(panel(key)?.useManage, key).toBe(useClientAffiliate);
      expect(panel(key)?.presentation.record?.type, key).toBe("RecordLayout");
      expect(panel(key)?.useList, key).toBeUndefined();
      expect(panel(key)?.useMutate, key).toBeUndefined();
    }
  });

  it("offers the withdrawal request only while a withdrawal is allowed", () => {
    const request = find(panel("withdrawal")?.presentation.record?.actions, {
      name: "requestWithdrawal"
    });

    expect(request?.gate).toBe("canWithdraw");
    expect(request?.form?.submit).toBe("requestWithdrawal");
  });

  it("draws the guest's visit page before any visit, as a record that starts empty", () => {
    const visit = registry[AFFILIATE_LINK_VISIT_SCENARIO];

    expect(visit.useManage).toBe(useAffiliateLinkVisit);
    expect(visit.params).toBeUndefined();
    expect(visit.presentation.record?.drawsEmpty).toBe(true);
    expect(visit.useList).toBeUndefined();
    expect(visit.useMutate).toBeUndefined();
  });
});
