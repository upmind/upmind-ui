// -----------------------------------------------------------------------------
/**
 * @fileoverview The gateway list the form draws
 *
 * ## Job To Be Done
 * The gateway renderer draws the brand's gateways the schema serves, and adds pay later
 * as the last choice when the payment types allow deferring.
 *
 * ## What Breaks If These Fail
 * Pay later disappears for a brand that allows it, or shows for one that does not.
 */

import { join } from "node:path";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import { Form } from "@upmind-automation/foundation";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { PaymentType } from "@upmind-automation/types";
import "../index";
import type { IBrandGateway } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "headless",
  "src",
  "modules",
  "payment-details",
  "__tests__",
  "fixtures"
);

type GatewayOption = { value: string; label: string; provider?: string };

function recordedOptions(): GatewayOption[] {
  const body = getFixtureBody<{
    data?: IBrandGateway[] | Record<string, IBrandGateway>;
  }>("get-brands-id-gateways-active-1-case-pay-client-id-country-id", {
    recordingsDir
  });
  const rows = Object.values(body?.data ?? {}).slice(0, 2);

  if (rows.length < 2) {
    throw new Error(
      "Missing fixture. Run `pnpm fixtures:generate payment-details` to capture " +
        "the brand's gateway list."
    );
  }
  return rows.map(row => ({
    value: String(row.gateway_id),
    label: String(row.gateway?.name ?? row.gateway_id),
    provider: row.gateway?.provider
  }));
}

function gatewaySchema(options: GatewayOption[], types: string[]) {
  return {
    type: "object",
    properties: {
      gateway_id: {
        type: ["string", "null"],
        enum: [...options.map(option => option.value), null],
        options
      }
    },
    definitions: { type: { type: "string", enum: types } }
  };
}

const UISCHEMA = {
  type: "VerticalLayout",
  elements: [{ type: "Control", scope: "#/properties/gateway_id" }]
};

const i18n = createI18n({
  legacy: false,
  locale: "en",
  missingWarn: false,
  fallbackWarn: false,
  messages: { en: {} }
});

async function drawnTiles(schema: ReturnType<typeof gatewaySchema>) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(Form, {
          modelValue: {},
          schema,
          uischema: UISCHEMA,
          noActions: true
        });
    }
  });

  const wrapper = mount(Host, {
    global: { plugins: [i18n], stubs: { RouterLink: true } }
  });
  await flushPromises();

  return wrapper
    .findAll('[data-test-key="gateway"]')
    .map(tile => tile.attributes("data-test-value"));
}

// -----------------------------------------------------------------------------

describe("the gateway list the form draws", () => {
  it("adds pay later as the last choice when the payment types allow deferring", async () => {
    const recorded = recordedOptions();

    const tiles = await drawnTiles(
      gatewaySchema(recorded, [PaymentType.PAY_IN_FULL, PaymentType.PAY_LATER])
    );

    expect(tiles).toEqual([
      ...recorded.map(option => option.provider),
      PaymentType.PAY_LATER
    ]);
  });

  it("adds no pay-later choice when the payment types do not allow deferring", async () => {
    const recorded = recordedOptions();

    const tiles = await drawnTiles(
      gatewaySchema(recorded, [PaymentType.PAY_IN_FULL])
    );

    expect(tiles).toEqual(recorded.map(option => option.provider));
  });
});
