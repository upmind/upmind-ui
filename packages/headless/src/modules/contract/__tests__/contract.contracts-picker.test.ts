/**
 * @fileoverview contracts picker option mapping — unit tests
 *
 * ## Job To Be Done
 * Prove `contract.feature:469` ("Picking one of my contracts opens that very
 * contract") at the option layer. A picker option's `value` is what
 * `useContract().withId(value)` loads by, so it must be the contract's id,
 * never its name. The option's `label` is what a client recognises the
 * contract by — its name (R38 items 7 and 8). Staging holds no named contract
 * to record, so each row is a RECORDED `get-contracts-case-named-first` row
 * with only its `name` set.
 *
 * ## What Breaks If These Fail
 * Picking a named contract opens a different contract, or none: the manager
 * loads by a name the platform does not accept as an id. Or the picker shows
 * a client an option they cannot recognise.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { mapContractLookupItem } from "../contract.mappers";
import { map } from "lodash-es";
import type { IContract } from "@upmind-automation/types";

const recordingsDir = join(import.meta.dirname, "fixtures");

function recordedRowNamed(index: number, name: string): IContract {
  const page = getFixtureBody<{ data: IContract[] }>(
    "get-contracts-case-named-first",
    { recordingsDir }
  );
  const row = page.data[index];
  if (!row) throw new Error(`Recorded page has no row ${index}.`);
  return { ...JSON.parse(JSON.stringify(row)), name } as IContract;
}

describe("contracts picker option (contract.feature:469)", () => {
  it("offers a named contract under its name and opens it by its id", () => {
    const row = recordedRowNamed(0, "Primary hosting bundle");

    const option = mapContractLookupItem(row);

    expect(option.value).toBe(row.id);
    expect(option.label).toBe("Primary hosting bundle");
  });

  it("keeps each named contract's value on its own id", () => {
    const first = recordedRowNamed(0, "Primary hosting bundle");
    const second = recordedRowNamed(1, "Backup mail plan");

    const options = map([first, second], row => mapContractLookupItem(row));

    expect(map(options, "value")).toEqual([first.id, second.id]);
    expect(map(options, "label")).toEqual([
      "Primary hosting bundle",
      "Backup mail plan"
    ]);
  });
});
