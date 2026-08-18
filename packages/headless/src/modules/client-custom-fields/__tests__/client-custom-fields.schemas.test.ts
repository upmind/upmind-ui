// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields value semantics — schema/uischema/model (unit)
 *
 * ## Job To Be Done
 * Prove AC-11 (schema, narrowable required rules), AC-12 (uischema, incl. the
 * IMAGE control's field payload), AC-13 (model seeding preserves an existing
 * value) and AC-15 (enum/options handling, including the null option) against
 * the barrel's `useCustomFieldsSchema` / `useCustomFieldsUischema` /
 * `useCustomFieldsModel` (seam A-3/A-4/A-5, re-exported per R4) — never the
 * shared `utils/useFields.ts` implementation directly.
 *
 * ## Recording limit
 * This staging brand has no real SELECT/SELECT_RADIO definition (see
 * `client-custom-fields.mappers.test.ts`'s fileoverview). AC-15's choice-field
 * scenario uses a CONSTRUCTED `CustomField` — the module's own ALREADY-MAPPED
 * shape, built from the real recorded "age" definition with only `typeId` /
 * `code` / `options` overridden to the AC's stated contract (a choice field),
 * never presented as a recording. AC-11's NUMBER row and AC-12's per-
 * definition control ARE proven against the two real recorded definitions.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "./mocks";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { CustomFieldsTypes, ImageObjectTypes } from "@upmind-automation/types";
import {
  mapCustomField,
  useCustomFieldsModel,
  useCustomFieldsSchema,
  useCustomFieldsUischema
} from "..";
import type { CustomField } from "..";
import type { ICustomField } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type Envelope<T> = { data: T };
type WireField = Record<string, unknown> & { id: string; code: string };

function recordedDefinitions(): WireField[] {
  return getFixtureBody<Envelope<WireField[]>>(
    "get-custom-fields-brand-id-filter-object-type-client-sort-order-asc",
    { recordingsDir }
  ).data;
}

function mappedDefinitions(): CustomField[] {
  return recordedDefinitions().map(row =>
    mapCustomField(row as unknown as ICustomField)
  );
}

function mappedAge(overrides?: Partial<CustomField>): CustomField {
  const age = mappedDefinitions().find(field => field.code === "age");
  if (!age) throw new Error("Recorded 'age' definition missing.");
  return { ...age, ...overrides };
}

// -----------------------------------------------------------------------------

describe("useCustomFieldsSchema — AC-11 required rules stay narrowable", () => {
  it("AC-11 a required NUMBER field is present in required with type number", () => {
    const field = mappedAge({
      meta: { ...mappedAge().meta, isRequired: true }
    });

    const schema = useCustomFieldsSchema([field]);

    expect(schema.properties?.[field.code]?.type).toBe("number");
    expect(schema.required).toContain(field.code);
  });

  it("AC-11 a non-required field's type includes null and it is absent from required", () => {
    const field = mappedAge({
      meta: { ...mappedAge().meta, isRequired: false }
    });

    const schema = useCustomFieldsSchema([field]);

    const type = schema.properties?.[field.code]?.type;
    expect(Array.isArray(type) ? type : [type]).toContain("null");
    expect(schema.required ?? []).not.toContain(field.code);
  });

  it("AC-11 a caller may narrow required to a subset without losing the other codes", () => {
    const required = mappedAge({
      code: "required_field",
      meta: { ...mappedAge().meta, isRequired: true }
    });
    const other = mappedAge({
      code: "other_field",
      meta: { ...mappedAge().meta, isRequired: true }
    });

    const schema = useCustomFieldsSchema([required, other]);
    const narrowed = (schema.required ?? []).filter(
      code => code === required.code
    );

    expect(narrowed).toEqual([required.code]);
    expect(schema.properties).toHaveProperty(other.code);
  });
});

describe("useCustomFieldsUischema — AC-12 one control per definition, IMAGE payload", () => {
  it("AC-12 emits one Control per definition scoped to customFields/<code>", () => {
    const fields = mappedDefinitions();

    const controls = useCustomFieldsUischema(fields);

    for (const field of fields) {
      const control = controls.find(
        entry =>
          entry.scope === `#/properties/customFields/properties/${field.code}`
      );
      expect(control).toBeDefined();
    }
  });

  it("AC-12 an IMAGE definition's control carries the field payload system-upload needs", () => {
    const image = mappedDefinitions().find(
      field => field.typeId === CustomFieldsTypes.IMAGE
    );
    if (!image) throw new Error("Recorded IMAGE definition missing.");

    const controls = useCustomFieldsUischema([image]);
    const control = controls.find(
      entry =>
        entry.scope === `#/properties/customFields/properties/${image.code}`
    );

    expect(control?.options?.type).toBe("image");
    expect(control?.options?.field?.field_type).toBe(
      ImageObjectTypes.CLIENT_CUSTOM_FIELD
    );
    expect(control?.options?.field?.field_id).toBe(image.id);
  });
});

describe("useCustomFieldsModel — AC-13 seeding preserves an existing value", () => {
  it("AC-13 seeds a field's code from its value/default when no value is supplied", () => {
    const field = mappedAge();

    const model = useCustomFieldsModel([field], {});

    expect(model).toHaveProperty(field.code);
  });

  it("AC-13 does not overwrite a code already present in the supplied values", () => {
    const field = mappedAge();

    const model = useCustomFieldsModel([field], { [field.code]: "99" });

    expect(model[field.code]).toBe("99");
  });
});

describe("useCustomFieldsSchema / useCustomFieldsUischema — AC-15 enum/options", () => {
  /**
   * Constructed (not recorded — see fileoverview): the real "age" definition
   * with only `typeId`/`code`/`options` overridden to a choice field, this
   * brand's own contract for AC-15 having no real SELECT to substitute it
   * from.
   */
  function choiceField(required: boolean): CustomField {
    return mappedAge({
      code: "favourite_colour",
      typeId: CustomFieldsTypes.SELECT,
      options: ["a", "a", "", "b"] as unknown as CustomField["options"],
      meta: { ...mappedAge().meta, isRequired: required }
    });
  }

  it("AC-15 a non-required choice field offers a blank option alongside real choices", () => {
    const schema = useCustomFieldsSchema([choiceField(false)]);

    expect(schema.properties?.favourite_colour?.enum).toEqual([null, "a", "b"]);
  });

  it("AC-15 the same field marked required offers no blank option", () => {
    const schema = useCustomFieldsSchema([choiceField(true)]);

    expect(schema.properties?.favourite_colour?.enum).toEqual(["a", "b"]);
  });

  it("AC-15 duplicate and empty option values never appear twice", () => {
    const schema = useCustomFieldsSchema([choiceField(true)]);

    const values = schema.properties?.favourite_colour?.enum ?? [];
    expect(values.filter(value => value === "a")).toHaveLength(1);
    expect(values).not.toContain("");
  });
});
