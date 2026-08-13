// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields mappers — the wire ⇄ view-model boundary (unit)
 *
 * ## Job To Be Done
 * Prove AC-4, AC-5, AC-10, AC-14, AC-17, AC-23, AC-24 against the module's
 * PUBLIC mapping seam (`mapCustomField`, `mapCustomFieldValue`,
 * `mapCustomFieldValues`, `mapCustomFieldValuesToRequest`,
 * `mapCustomFieldDisplay` — barrel exports only, no implementation import).
 *
 * ## Recording limit (surfaced, not papered over — type_code_findings)
 * This staging brand has exactly TWO real custom field definitions:
 * `type_code: "number"` (age) and `type_code: "image"` (profile_picture) —
 * captured 2026-08-10 by `client-custom-fields.fixtures.ts`. AC-14's table
 * spans 5 example types; only NUMBER and IMAGE are proven against a REAL
 * recorded row below. TEXT, DATE and SELECT_RADIO have no real definition on
 * this brand, so their rows are the recorded "age" ENVELOPE with `type` /
 * `type_code` / `code` overridden to the AC's own stated contract — the same
 * technique `client-email.mappers.test.ts`'s `acTwoRow()` uses for an
 * unrecordable status combination. This is a documented, labelled CONTRACT
 * input to a pure function, never presented as a recording — the fixture
 * envelope's shape is real; only the type discriminator is substituted, and
 * only because staging has no real row to substitute it FROM. See
 * `type_code_findings` in the hand-off: TEXT/DATE/PASSWORD/SELECT/
 * SELECT_RADIO/TEXTAREA `type_code` strings remain UNCONFIRMED by real data.
 * AC-17's SELECT and checkbox/SELECT_RADIO display-projection cases are
 * likewise CONSTRUCTED (labelled at each `it()`), never recorded — AC-17 is
 * a pure display projection over an already-mapped `CustomField`, not a
 * wire contract, so the recorded-fixture rule does not bind its input.
 * AC-17's IMAGE case remains proven from the real recorded upload.
 *
 * ## What Breaks If These Fail
 * A definition's `hidden`/`user_only`/`editable`/`display_contexts` stay
 * unmapped (AC-4), `isDisabled` drifts from the oracle rule and starts
 * disabling a definition the client actor can actually edit (AC-5 —
 * corrected 2026-08-13: `isDisabled` is `client_readonly`, the SAME flag as
 * `isReadOnly`, never derived from `editable`; see the note at the AC-5
 * `it()`s below), a value renders the literal string "undefined"/"NaN"
 * (AC-14), a read-only view shows a raw value instead of its label (AC-17),
 * or the outbound diff reverts to an array / drops a clearing `null`
 * (AC-23/AC-24) — every one of these is a receipt this bundle names by id.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "./mocks";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { CustomFieldsTypes } from "@upmind-automation/types";
import {
  mapCustomField,
  mapCustomFieldDisplay,
  mapCustomFieldValue,
  mapCustomFieldValues,
  mapCustomFieldValuesToRequest
} from "..";
import type { ICustomField, ICustomFieldValue } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type Envelope<T> = { data: T };
type WireField = Record<string, unknown> & {
  id: string;
  code: string;
  type: number;
  type_code: string;
};
type WireValue = Record<string, unknown> & {
  id: string;
  field_id: string;
  value: unknown;
  field?: WireField;
};

function recordedDefinitions(): WireField[] {
  return getFixtureBody<Envelope<WireField[]>>(
    "get-custom-fields-brand-id-filter-object-type-client-sort-order-asc",
    { recordingsDir }
  ).data;
}

function recordedAge(): WireField {
  const field = recordedDefinitions().find(row => row.code === "age");
  if (!field) throw new Error("Recorded 'age' definition missing.");
  return field;
}

function recordedImage(): WireField {
  const field = recordedDefinitions().find(
    row => row.code === "profile_picture"
  );
  if (!field) throw new Error("Recorded 'profile_picture' definition missing.");
  return field;
}

function recordedValues(): WireValue[] {
  return getFixtureBody<Envelope<{ custom_fields: WireValue[] }>>(
    "get-clients-id-case-with-values",
    { recordingsDir }
  ).data.custom_fields;
}

/**
 * The recorded "age" ENVELOPE with the type discriminator overridden to the
 * AC-14 example's own stated contract — see the fileoverview's recording-limit
 * note. Never presented as, nor mistaken for, a real capture.
 */
function contractField(
  typeId: CustomFieldsTypes,
  typeCode: string,
  code: string
): ICustomField {
  return {
    ...recordedAge(),
    type: typeId,
    type_code: typeCode,
    code
  } as unknown as ICustomField;
}

// -----------------------------------------------------------------------------

describe("mapCustomField — AC-4 full-fidelity mapping, AC-5 readOnly/disabled", () => {
  it("AC-4 maps every previously-unmapped member with nothing left undefined", () => {
    const wire = {
      ...recordedAge(),
      hidden: true,
      user_only: true,
      editable: false,
      order: 3,
      display_contexts: { invoice: true, order_form: false }
    } as unknown as ICustomField;

    const mapped = mapCustomField(wire);

    expect(mapped.meta.isHidden).toBe(true);
    expect(mapped.meta.isUserOnly).toBe(true);
    expect(mapped.meta.isEditable).toBe(false);
    expect(mapped.order).toBe(3);
    expect(mapped.meta.displayContexts).toEqual({
      invoice: true,
      order_form: false
    });
    expect(Object.values(mapped.meta)).not.toContain(undefined);
    expect(mapped.id).toBeDefined();
    expect(mapped.code).toBeDefined();
    expect(mapped.typeId).toBeDefined();
  });

  // AC-5's original assertion here treated `editable:false` as the source of
  // `isDisabled` (`!raw.editable`). That distinction was never oracle-backed:
  // at pinned vue-app SHA `ea310f5a42e32b7ae1255c223b77918ef0594286`,
  // `editable` has zero hits in `customFields.vue` / `clientCustomFieldsForm.vue`,
  // and legacy's client-side disable expression
  // (`customFields.vue:43-44`, `isDisabled || isProcessing || !canManage || isReadOnly(field)`)
  // reduces, for `client x self`, to exactly `isReadOnly(field)` = `client_readonly && isClient`
  // — `isDisabled` and `isReadOnly` are the SAME flag for this actor, never
  // two independently-driven states. Source now sets `isDisabled: raw.client_readonly`.
  it("AC-5 (oracle-corrected) a non-editable but NOT read-only definition is NOT disabled — editable has no oracle basis at client x self", () => {
    const wire = {
      ...recordedAge(),
      client_readonly: false,
      editable: false
    } as unknown as ICustomField;

    const mapped = mapCustomField(wire);

    expect(mapped.meta.isReadOnly).toBe(false);
    expect(mapped.meta.isDisabled).toBe(false);
  });

  it("AC-5 (oracle-corrected) isDisabled and isReadOnly are the SAME flag at client x self — both driven by client_readonly, never by editable", () => {
    const readOnly = mapCustomField({
      ...recordedAge(),
      client_readonly: true,
      editable: true
    } as unknown as ICustomField);
    const notReadOnly = mapCustomField({
      ...recordedAge(),
      client_readonly: false,
      editable: true
    } as unknown as ICustomField);

    expect(readOnly.meta.isReadOnly).toBe(true);
    expect(readOnly.meta.isDisabled).toBe(true);
    expect(notReadOnly.meta.isReadOnly).toBe(false);
    expect(notReadOnly.meta.isDisabled).toBe(false);
  });

  it("AC-4 maps the REAL recorded NUMBER definition (age) with its numeric typeId", () => {
    const mapped = mapCustomField(recordedAge() as unknown as ICustomField);

    expect(mapped.typeId).toBe(CustomFieldsTypes.NUMBER);
    expect(mapped.type).toBe("number");
    expect(mapped.code).toBe("age");
  });

  it("AC-4 maps the REAL recorded IMAGE definition (profile_picture) with its numeric typeId", () => {
    const mapped = mapCustomField(recordedImage() as unknown as ICustomField);

    expect(mapped.typeId).toBe(CustomFieldsTypes.IMAGE);
    expect(mapped.type).toBe("image");
    expect(mapped.code).toBe("profile_picture");
  });
});

describe("mapCustomFieldValue — AC-14 per-type coercion, never a placeholder string", () => {
  it("AC-14 NUMBER with no value set shows nothing, never NaN", () => {
    const field = mapCustomField(recordedAge() as unknown as ICustomField);

    const shown = mapCustomFieldValue(undefined, field);

    expect(shown).not.toBe(NaN);
    expect(Number.isNaN(shown as number)).toBe(false);
    expect(String(shown)).not.toBe("NaN");
  });

  it("AC-14 IMAGE with a stored image passes the hash through unchanged (REAL recorded upload)", () => {
    const uploaded = getFixtureBody<{ data: WireValue }>(
      "post-clients-fields-id-image",
      { recordingsDir }
    ).data;
    const field = mapCustomField(uploaded.field as unknown as ICustomField);

    const shown = mapCustomFieldValue(uploaded.value, field);

    expect(shown).toBe(uploaded.value);
  });

  it("AC-14 TEXT with no value set shows nothing, never the literal string 'undefined' (contract row — see recording-limit note)", () => {
    const field = mapCustomField(
      contractField(CustomFieldsTypes.TEXT, "text", "notes")
    );

    const shown = mapCustomFieldValue(undefined, field);

    expect(String(shown)).not.toBe("undefined");
    expect(String(shown)).not.toBe("null");
  });

  it("AC-14 DATE with a stored date shows a correctly formatted date, never a no-op passthrough (contract row)", () => {
    const field = mapCustomField(
      contractField(CustomFieldsTypes.DATE, "date", "birthday")
    );

    const shown = mapCustomFieldValue("2026-01-15T00:00:00.000Z", field);

    expect(shown).toBeTruthy();
    expect(shown).not.toBe("2026-01-15T00:00:00.000Z");
  });

  it("AC-14 SELECT_RADIO with no value set coerces to unchecked (false), never the string 'undefined' (contract row)", () => {
    const field = mapCustomField(
      contractField(CustomFieldsTypes.SELECT_RADIO, "select_radio", "opt_in")
    );

    const shown = mapCustomFieldValue(undefined, field);

    expect(shown).toBe(false);
  });
});

describe("mapCustomFieldValues / mapCustomFieldValuesToRequest — AC-10 round trip", () => {
  it("AC-10 preserves every recorded value's code through load-then-save-unchanged", () => {
    const values = recordedValues() as unknown as ICustomFieldValue[];

    const model = mapCustomFieldValues(values);
    const request = mapCustomFieldValuesToRequest(model, {});

    const recordedCodes = values
      .map(value => value.field?.code)
      .filter((code): code is string => Boolean(code));
    expect(recordedCodes.length).toBeGreaterThan(0);
    for (const code of recordedCodes) {
      expect(Object.keys(model)).toContain(code);
      expect(Object.keys(request ?? {})).toContain(code);
    }
  });
});

describe("mapCustomFieldValuesToRequest — AC-23 code-keyed shape, AC-24 clear-to-null", () => {
  it("AC-23 the changed-values body is an object keyed by code, never an array", () => {
    const request = mapCustomFieldValuesToRequest({ age: "42" }, {});

    expect(Array.isArray(request)).toBe(false);
    expect(request).toEqual({ age: "42" });
  });

  it("AC-23 contains exactly the fields that changed, not the whole model", () => {
    const request = mapCustomFieldValuesToRequest(
      { age: "43", profile_picture: "unchanged-hash" },
      { age: "42", profile_picture: "unchanged-hash" }
    );

    expect(request).toEqual({ age: "43" });
  });

  it("AC-24 an empty string coerces to an explicit JSON null, present in the diff", () => {
    const request = mapCustomFieldValuesToRequest({ age: "" }, { age: "42" });

    expect(request).toHaveProperty("age");
    expect(request?.age).toBeNull();
  });

  it("an empty diff signals undefined so the caller can short-circuit", () => {
    const request = mapCustomFieldValuesToRequest({ age: "42" }, { age: "42" });

    expect(request).toBeUndefined();
  });
});

describe("mapCustomFieldDisplay — AC-17 read-only display projection", () => {
  it("AC-17 an IMAGE value projects to an object with a download URL and a preview", () => {
    const uploaded = getFixtureBody<{ data: WireValue }>(
      "post-clients-fields-id-image",
      { recordingsDir }
    ).data;
    const field = mapCustomField(uploaded.field as unknown as ICustomField);

    const display = mapCustomFieldDisplay(uploaded.value, field);

    expect(display).toEqual(
      expect.objectContaining({
        downloadUrl: expect.stringContaining("http"),
        preview: expect.any(String)
      })
    );
  });

  /**
   * CONSTRUCTED, NOT RECORDED — labelled explicitly, per the 2026-08-05
   * cosplay receipt. AC-17 is a pure display projection over an already-
   * mapped `CustomField`, not a wire contract, so the recorded-fixture rule
   * does not bind its input the way it binds an integration fixture. This
   * staging brand has no real SELECT definition (see the fileoverview's
   * recording-limit note), so the field below is the recorded "age"
   * ENVELOPE with `type`/`type_code`/`code`/`values` overridden to a
   * labelled choice set — the same technique AC-14's `contractField` uses,
   * never presented as a capture.
   */
  it("AC-17 (constructed SELECT — no real SELECT definition on this brand) a choice value projects to its option's LABEL, not the raw stored value", () => {
    const field = mapCustomField({
      ...recordedAge(),
      type: CustomFieldsTypes.SELECT,
      type_code: "select",
      code: "colour",
      values: [
        { label: "Red", value: "red" },
        { label: "Blue", value: "blue" }
      ]
    } as unknown as ICustomField);

    expect(mapCustomFieldDisplay("red", field)).toBe("Red");
    expect(mapCustomFieldDisplay("blue", field)).toBe("Blue");
    expect(mapCustomFieldDisplay("red", field)).not.toBe("red");
  });

  /**
   * CONSTRUCTED, NOT RECORDED — same labelling as the SELECT case above; no
   * real SELECT_RADIO definition exists on this brand either.
   */
  it("AC-17 (constructed SELECT_RADIO/checkbox — no real definition on this brand) a checkbox value projects to its yes/no word, distinct for true vs false", () => {
    const field = mapCustomField({
      ...recordedAge(),
      type: CustomFieldsTypes.SELECT_RADIO,
      type_code: "select_radio",
      code: "opt_in"
    } as unknown as ICustomField);

    const yes = mapCustomFieldDisplay(true, field);
    const no = mapCustomFieldDisplay(false, field);

    expect(typeof yes).toBe("string");
    expect(typeof no).toBe("string");
    expect(yes).not.toBe(no);
    expect(yes).not.toBe("true");
    expect(no).not.toBe("false");
  });
});
