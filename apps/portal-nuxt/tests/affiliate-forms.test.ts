// -----------------------------------------------------------------------------
/**
 * @module tests/affiliate-forms
 * @description Gap doc §4 "Affiliate" / plan §3 rows "Affiliate link create /
 * edit", "Withdrawal request" and "Payout destination": the three forms legacy
 * carried on the affiliate screen (plan F12). A withdrawal is asked for
 * against a balance the server already cleared — money is data (plan R6), so
 * the payout carries the amount on file rather than one this layer adds up,
 * and an account with nothing cleared is told so before it asks.
 * `affiliate.test.ts` grades what the screen says; this grades what it writes.
 */

import { RuleEffect } from "@jsonforms/core";
import { beforeEach, describe, expect, it } from "vitest";
import { AffiliatePayoutDestinationCode } from "@upmind-automation/types";
import { rowBinding, stringsIn } from "./support/page-config";
import { cloneDeep, find, first, get, map } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockAffiliate, MockDataset } from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import * as affiliateSchemas from "~/portal/mock/contracts/client-affiliate.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import {
  affiliateLinkContext,
  payoutDestinationContext
} from "~/portal/mock/forms/account-contexts";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_PAYOUT_STATUS } from "~/portal/mock/types";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

const EDIT_LABEL = "Edit";

const LINK = {
  redirectUrl: "https://hostgrid.example/security",
  name: "Security newsletter"
};

const MESSAGE = "Paying the studio invoice with this.";

const NOTHING_TO_WITHDRAW =
  MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.NOTHING_TO_WITHDRAW];

type ActionLike = {
  readonly value: string;
  readonly label: string;
  readonly disabledReason?: string;
};

type RowLike = { readonly id: string; readonly moreActions?: ActionLike[] };

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function ref<T>(data: MockDataset, id: DataRefId): T {
  return resolveDataRefProps({ value: dataRef(id) }, data)?.value as T;
}

function affiliateOf(data: MockDataset): MockAffiliate {
  if (data.affiliate === null) {
    throw new Error("seed carries no affiliate account");
  }
  return data.affiliate;
}

function withdrawalOffer(data: MockDataset): ActionLike | undefined {
  return first(
    ref<ActionLike[]>(data, DATA_REF_ID.AFFILIATE_WITHDRAWAL_ACTIONS)
  );
}

function payload(verb: string, model: unknown, id?: string): string {
  const tail = JSON.stringify(model);
  if (id === undefined) return `${verb}:${tail}`;
  return `${verb}:${id}:${tail}`;
}

function toastText(result: {
  toast?: { title: string; description?: string };
}): string {
  return `${result.toast?.title ?? ""} ${result.toast?.description ?? ""}`;
}

describe("referral links", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("heads the table with the way to mint one, and offers Edit on every row", () => {
    const data = hostgrid();
    const page = accountPages()[PAGE_KEY.ACCOUNT_AFFILIATE];
    const rows = ref<RowLike[]>(data, DATA_REF_ID.AFFILIATE_LINK_ITEMS);

    expect(
      stringsIn(rowBinding(page, DATA_REF_ID.AFFILIATE_LINK_ITEMS))
    ).toContain(DATA_REF_ID.AFFILIATE_LINK_HEADER_ACTIONS);
    expect(
      map(
        ref<ActionLike[]>(data, DATA_REF_ID.AFFILIATE_LINK_HEADER_ACTIONS),
        "value"
      )
    ).toEqual([
      mockActionValue(MOCK_ACTION.OPEN_FORM, FORM_ID.AFFILIATE_LINK_CREATE)
    ]);

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(find(row.moreActions, { label: EDIT_LABEL })?.value).toBe(
        mockActionValue(
          MOCK_ACTION.OPEN_FORM,
          `${FORM_ID.AFFILIATE_LINK_UPDATE}:${row.id}`
        )
      );
    }
  });

  it("insists the link lands somewhere a browser could go", () => {
    const validate = usePortalAjv().compile(
      affiliateSchemas.useLinkSchema(affiliateLinkContext(hostgrid()))
    );

    expect(validate(LINK)).toBe(true);
    expect(validate({ redirectUrl: "the pricing page" })).toBe(false);
    expect(validate({ redirectUrl: "" })).toBe(false);
    expect(validate({ name: LINK.name })).toBe(false);
  });

  it("mints one, and edits one in place", () => {
    const data = hostgrid();
    const affiliate = affiliateOf(data);
    const before = affiliate.links.length;

    const created = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.AFFILIATE_LINK_CREATE, LINK)
    );

    const minted = find(affiliate.links, { redirectUrl: LINK.redirectUrl });
    expect(affiliate.links.length).toBe(before + 1);
    expect(minted?.name).toBe(LINK.name);
    expect(created?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);

    const seeded = first(affiliate.links);
    const entry = resolveMockForm(
      data,
      FORM_ID.AFFILIATE_LINK_UPDATE,
      seeded?.id
    );
    expect(entry?.model).toEqual({
      redirectUrl: seeded?.redirectUrl,
      name: seeded?.name
    });

    const updated = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(
        MOCK_ACTION.AFFILIATE_LINK_UPDATE,
        { redirectUrl: LINK.redirectUrl, name: "Renamed" },
        seeded?.id
      )
    );

    const saved = find(affiliate.links, { id: seeded?.id });
    expect(updated?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(affiliate.links.length).toBe(before + 1);
    expect(saved?.name).toBe("Renamed");
    expect(saved?.redirectUrl).toBe(LINK.redirectUrl);
    expect(saved?.url).toBe(seeded?.url);
    expect(saved?.clicks).toBe(seeded?.clicks);
  });
});

describe("asking for the balance to be paid out", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("lodges a pending payout for what was cleared, and empties it", () => {
    const data = hostgrid();
    const affiliate = affiliateOf(data);
    const cleared = cloneDeep(affiliate.stats.availableBalance);
    const withdrawn = cloneDeep(affiliate.stats.withdrawnBalance);
    const before = affiliate.payouts.length;

    expect(cleared.amount).toBeGreaterThan(0);
    expect(withdrawalOffer(data)?.disabledReason).toBeUndefined();

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.AFFILIATE_WITHDRAWAL_REQUEST, { message: MESSAGE })
    );

    const lodged = first(affiliate.payouts);
    expect(affiliate.payouts.length).toBe(before + 1);
    expect(lodged?.status).toBe(MOCK_PAYOUT_STATUS.PENDING);
    expect(lodged?.amount).toEqual(cleared);
    expect(lodged?.message).toBe(MESSAGE);
    expect(lodged?.destination).toBe(affiliate.payoutDestination.code);
    expect(affiliate.stats.availableBalance.amount).toBe(0);
    expect(affiliate.stats.withdrawnBalance).toEqual(withdrawn);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("says so before it is asked a second time, and refuses if it is", () => {
    const data = hostgrid();
    const affiliate = affiliateOf(data);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.AFFILIATE_WITHDRAWAL_REQUEST, { message: MESSAGE })
    );
    const lodged = affiliate.payouts.length;

    expect(withdrawalOffer(data)?.disabledReason).toBeTruthy();

    const again = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.AFFILIATE_WITHDRAWAL_REQUEST, { message: MESSAGE })
    );

    expect(again?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(toastText(again ?? {})).toContain(NOTHING_TO_WITHDRAW);
    expect(affiliate.payouts.length).toBe(lodged);
  });

  it("insists the request says something", () => {
    const validate = usePortalAjv().compile(
      affiliateSchemas.useWithdrawalSchema()
    );

    expect(validate({ message: MESSAGE })).toBe(true);
    expect(validate({})).toBe(false);
    expect(validate({ message: "" })).toBe(false);
  });
});

describe("where the earnings are sent", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("opens on the destination on file", () => {
    const data = hostgrid();
    const affiliate = affiliateOf(data);
    const context = payoutDestinationContext(data);

    expect(ref(data, DATA_REF_ID.AFFILIATE_PAYOUT_FORM_MODEL)).toEqual(
      affiliateSchemas.payoutDestinationDefaults(context)
    );
    expect(
      get(ref(data, DATA_REF_ID.AFFILIATE_PAYOUT_FORM_MODEL), "code")
    ).toBe(affiliate.payoutDestination.code);
    expect(
      get(ref(data, DATA_REF_ID.AFFILIATE_PAYOUT_FORM_MODEL), "paypalEmail")
    ).toBe(affiliate.payoutDestination.detail);
    expect(ref(data, DATA_REF_ID.AFFILIATE_PAYOUT_FORM_SCHEMA)).toEqual(
      affiliateSchemas.usePayoutDestinationSchema(context)
    );
  });

  it("asks for an address under the one destination that needs one", () => {
    const data = hostgrid();
    const context = payoutDestinationContext(data);
    const control = find(
      affiliateSchemas.usePayoutDestinationUischema(context).elements,
      { scope: "#/properties/paypalEmail" }
    );

    expect(get(control, "rule.effect")).toBe(RuleEffect.SHOW);
    expect(get(control, "rule.condition.scope")).toBe("#/properties/code");
    expect(get(control, "rule.condition.schema.enum")).toEqual([
      AffiliatePayoutDestinationCode.PAYPAL
    ]);
    expect(
      get(
        affiliateSchemas.usePayoutDestinationSchema(context),
        "properties.paypalEmail.enum"
      )
    ).toEqual([null, ...data.emails.map(row => row.email)]);
  });

  it("writes the destination the client chose, and says so", () => {
    const data = hostgrid();
    const affiliate = affiliateOf(data);
    const address = data.emails[1]?.email;

    const wallet = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.AFFILIATE_PAYOUT_DESTINATION_SAVE, {
        code: AffiliatePayoutDestinationCode.WALLET
      })
    );

    expect(wallet?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(affiliate.payoutDestination.code).toBe(
      AffiliatePayoutDestinationCode.WALLET
    );

    dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.AFFILIATE_PAYOUT_DESTINATION_SAVE, {
        code: AffiliatePayoutDestinationCode.PAYPAL,
        paypalEmail: address
      })
    );

    expect(affiliate.payoutDestination.code).toBe(
      AffiliatePayoutDestinationCode.PAYPAL
    );
    expect(affiliate.payoutDestination.detail).toBe(address);
  });
});
