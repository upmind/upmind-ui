// -----------------------------------------------------------------------------
/**
 * @fileoverview No published renderer loses its element to a built-in.
 *
 * ## Job To Be Done
 * Every published entry outranks the built-ins, which win a rank tie.
 *
 * ## What Breaks If These Fail
 * A customer's address, gateway, terms or domain field is drawn by a generic built-in.
 */

import { NOT_APPLICABLE } from "@jsonforms/core";
import { upmindUIRenderers } from "@upmind/ui";
import { describe, expect, it } from "vitest";
import { clientRenderers } from "@upmind-automation/client";
import { domainRenderers } from "@upmind-automation/domain";
import { paymentRenderers } from "@upmind-automation/payment";
import { productRenderers } from "@upmind-automation/product";
import type {
  ControlElement,
  JsonSchema,
  Layout,
  UISchemaElement
} from "@jsonforms/core";
import type { FormRendererEntry } from "@upmind-automation/foundation";

// -----------------------------------------------------------------------------

const CORPUS: Array<{
  label: string;
  uischema: UISchemaElement;
  schema: JsonSchema;
}> = [
  {
    label: "an address layout",
    uischema: { type: "address", elements: [] } satisfies Layout,
    schema: { type: "object", properties: {} }
  },
  {
    label: "a manager element",
    uischema: { type: "Manager" },
    schema: { type: "object", properties: {} }
  },
  {
    label: "a domain-name control",
    uischema: {
      type: "Control",
      scope: "#/properties/zzz_domain"
    } satisfies ControlElement,
    schema: {
      type: "object",
      properties: {
        zzz_domain: { type: "string", semantic_type: "domain_name" }
      }
    }
  },
  {
    label: "an sld-format control",
    uischema: {
      type: "Control",
      scope: "#/properties/zzz_sld"
    } satisfies ControlElement,
    schema: {
      type: "object",
      properties: { zzz_sld: { type: "string", format: "sld" } }
    }
  },
  {
    label: "a payment-details control",
    uischema: {
      type: "Control",
      scope: "#/properties/payment_details_id"
    } satisfies ControlElement,
    schema: {
      type: "object",
      properties: {
        payment_details_id: { type: "string", enum: ["zzz-a", "zzz-b"] }
      }
    }
  },
  {
    label: "a gateway control",
    uischema: {
      type: "Control",
      scope: "#/properties/gateway_id"
    } satisfies ControlElement,
    schema: {
      type: "object",
      properties: { gateway_id: { type: "string", enum: ["zzz-a", "zzz-b"] } }
    }
  },
  {
    label: "a terms element",
    uischema: { type: "Terms" },
    schema: { type: "object", properties: {} }
  },
  {
    label: "a subproducts element",
    uischema: { type: "SubProducts" },
    schema: { type: "object", properties: {} }
  }
];

const PUBLISHED: FormRendererEntry[] = [
  ...clientRenderers,
  ...domainRenderers,
  ...paymentRenderers,
  ...productRenderers
];

function nameOf(renderer: unknown) {
  const component = renderer as {
    name?: string;
    __name?: string;
    __file?: string;
  };

  return component?.name ?? component?.__name ?? component?.__file ?? "unnamed";
}

function rankOf(
  entry: FormRendererEntry,
  element: (typeof CORPUS)[number]
): number {
  return entry.tester(element.uischema, element.schema, {
    rootSchema: element.schema,
    config: {}
  });
}

const claims = PUBLISHED.flatMap(entry =>
  CORPUS.filter(element => rankOf(entry, element) > NOT_APPLICABLE).map(
    element => ({
      renderer: nameOf(entry.renderer),
      element: element.label,
      rank: rankOf(entry, element),
      subject: element
    })
  )
);

const unclaimed = PUBLISHED.filter(entry =>
  CORPUS.every(element => rankOf(entry, element) === NOT_APPLICABLE)
).map(entry => nameOf(entry.renderer));

// -----------------------------------------------------------------------------

describe("the two sets this spec drives against each other", () => {
  it("reaches every entry the four packages publish", () => {
    expect(
      unclaimed,
      `${unclaimed.join(", ")} claims no element in this corpus, so nothing ` +
        `below grades it against the built-ins`
    ).toEqual([]);
    expect(claims.length).toBeGreaterThanOrEqual(PUBLISHED.length);
  });

  it("reads a design-system set that really answers some of them", () => {
    expect(upmindUIRenderers.length).toBeGreaterThan(0);

    const answering = CORPUS.filter(element =>
      upmindUIRenderers.some(
        entry =>
          entry.tester(element.uischema, element.schema, {
            rootSchema: element.schema,
            config: {}
          }) > NOT_APPLICABLE
      )
    );

    expect(
      answering.length,
      "no built-in answers any element in this corpus, so every pair below " +
        "passes on an empty comparison"
    ).toBeGreaterThan(0);
  });
});

describe("no built-in ties a published entry on an element it claims", () => {
  it.each(claims)(
    "$renderer outranks every built-in on $element",
    ({ renderer, rank, subject }) => {
      const tied = upmindUIRenderers
        .map(entry => ({
          name: nameOf(entry.renderer),
          rank: entry.tester(subject.uischema, subject.schema, {
            rootSchema: subject.schema,
            config: {}
          })
        }))
        .filter(builtIn => builtIn.rank >= rank);

      expect(
        tied.map(builtIn => `${builtIn.name} at ${builtIn.rank}`),
        `${renderer} ranks ${rank} on ${subject.label} and the design ` +
          `system's own set answers at or above it; the built-ins are spread ` +
          `FIRST, so lodash maxBy keeps the built-in and ${renderer} never ` +
          `renders`
      ).toEqual([]);
    }
  );
});
