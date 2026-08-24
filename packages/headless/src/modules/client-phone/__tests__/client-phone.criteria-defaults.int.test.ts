// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone — the declared boot defaults (AC-38)
 *
 * ## Job To Be Done
 * With no filter and no order chosen, the collection's FIRST request already
 * carries the schema's declared defaults: unpaged (`limit=0`) and ordered
 * `created_at` ascending — the boot order `clientPhonesList.vue:68-71`
 * demonstrates. Drives the REAL `useClientPhones()` against an MSW-replayed
 * staging recording and reads the FIRST outbound request, never the response.
 *
 * ## What Breaks If This Fails
 * A consumer who never touches filter or order silently gets a different
 * boot order than legacy — every row on the page reads as if it were sorted,
 * with nothing in the UI explaining why.
 */

import { describe, expect, it } from "vitest";
import { useClientPhones } from "..";
import { observeRequests } from "../../../__tests__/criteria-int-kit";
import { SortDirection } from "../../query/query.types";
import {
  installPhonesHandler,
  seedClientSession
} from "./client-phone.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-phone — my boot state is the declared default (AC-38)", () => {
  it("asks for order=created_at and limit=0 on the very first request, with no filter chosen", async () => {
    const { clientId } = await seedClientSession();
    installPhonesHandler(server, clientId);
    const observed = observeRequests(server, "/phones");

    const phones = useClientPhones();
    await phones.useActions().isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("order")).toBe("created_at");
    expect(params.get("limit")).toBe("0");
    expect(phones.useContext().query.value.filters).toBeUndefined();
    expect(phones.useContext().query.value.sort).toEqual([
      { field: "created_at", dir: SortDirection.ASC }
    ]);
  });
});
