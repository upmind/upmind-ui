// -----------------------------------------------------------------------------
/**
 * @fileoverview client-personal-details mappers — profile projection + the
 * diff-only write path (unit)
 *
 * ## Job To Be Done
 * Prove the pure wire ⇄ view-model boundary this module owns:
 *   - `mapProfile` carries the language as an ID, never a display name
 *     (AC-33), and the client's own recorded custom-field values arrive
 *     un-stringified (AC-30's "not the placeholder word 'undefined'" half is
 *     re-asserted at the mapper boundary here; the composable-level read-back
 *     lives in the integration suite).
 *   - `mapProfileFields` reports read-only/disabled per field, not a fixed
 *     flag for every native field (AC-32).
 *   - `mapIProfileFields` is a genuine DIFF: unchanged fields are dropped, an
 *     empty diff is `undefined` (AC-45), a cleared custom field survives as
 *     JSON `null` rather than being omitted (AC-46), falsy native values
 *     survive (AC-47), `document_language_id` follows `interface_language_id`
 *     only when it actually changed (AC-48), and the key set never exceeds
 *     the client-surface six (AC-49).
 *   - `mapIProfileFields`'s `custom_fields` branch is byte-identical to
 *     calling A's own `mapCustomFieldValuesToRequest` directly (AC-59) — B
 *     must not re-derive coercion.
 *
 * The recorded `GET clients/{id}?with=custom_fields,custom_fields.field`
 * capture is the base wire shape; AC-32's read-only heterogeneity needs a
 * `client_readonly:true` row the staging brand's two real definitions (both
 * `client_readonly:false`) do not exhibit, so that ONE field is a labelled
 * constructed override of the recorded row — the contract's stated input to a
 * pure function, never presented as a second recording
 * (`client-email.mappers.test.ts` is the precedent for this technique).
 *
 * ## What Breaks If These Fail
 * The write path silently resends the whole model (G-3), strips the `null`
 * that clears a custom field or the falsy values that clear a native one
 * (G-4/G-5) — the exact defect class the JTBD's "manage" verb exists to fix —
 * or B quietly re-implements A's coercion and the two seams drift apart.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "./mocks";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  mapCustomFieldValues,
  mapCustomFieldValuesToRequest
} from "../../client-custom-fields";
import {
  mapIProfileFields,
  mapProfile,
  mapProfileFields
} from "../client-personal-details.mappers";
import type { CustomFieldModel } from "../../client-custom-fields";
import type { ProfileModel } from "../client-personal-details.types";
import type { IClient } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

/** The real recorded client — id, native fields, and both real custom fields. */
function recordedClient(): IClient {
  return getFixtureBody<{ data: IClient }>("get-clients-id", {
    recordingsDir
  }).data;
}

/**
 * The recorded client with a THIRD custom-field row whose definition is
 * `client_readonly:true` — a labelled constructed override, since this
 * brand's two real definitions are both `client_readonly:false` (staging
 * reality, not a defect). Built by extending the recorded row, never by
 * hand-writing a wire body from scratch.
 */
function clientWithReadOnlyField(): IClient {
  const client = recordedClient();
  const ageRow = client.custom_fields?.find(
    row => (row.field as { code?: string } | undefined)?.code === "age"
  );
  if (!ageRow) {
    throw new Error(
      "Fixture regression: the recorded client no longer carries the real " +
        "'age' custom field this test constructs its read-only row from."
    );
  }
  const readOnlyRow = {
    ...ageRow,
    field_id: "constructed-readonly-field-id",
    value: 42,
    field: {
      ...(ageRow.field as Record<string, unknown>),
      id: "constructed-readonly-field-id",
      code: "readonly_number",
      client_readonly: true
    }
  };
  return {
    ...client,
    custom_fields: [...(client.custom_fields ?? []), readOnlyRow]
  } as IClient;
}

// -----------------------------------------------------------------------------

describe("mapProfile — AC-33 the language is an ID, never a display name", () => {
  it("AC-33 carries the interface language as the raw ID the wire sent, not a name string", () => {
    const client = recordedClient();

    const record = mapProfile(client);

    expect(record.language).toBe(client.interface_language_id);
    expect(record.language).not.toBe(
      (client as unknown as { interface_language_code?: string })
        .interface_language_code
    );
  });

  it("AC-33 carries the client's id and native fields through unchanged", () => {
    const client = recordedClient();

    const record = mapProfile(client);

    expect(record.id).toBe(client.id);
    expect(record.firstName).toBe(client.firstname);
    expect(record.lastName).toBe(client.lastname);
    expect(record.publicName).toBe(client.public_name);
  });

  it('AC-30 carries the real custom field values through, never coerced to the placeholder string "undefined"', () => {
    const client = recordedClient();

    const record = mapProfile(client);

    expect(record.customFieldValues.length).toBeGreaterThan(0);
    for (const value of record.customFieldValues) {
      expect(String((value as { value: unknown }).value)).not.toBe("undefined");
    }
  });
});

describe("mapProfileFields — AC-32 read-only/disabled are derived per field, not fixed", () => {
  it("AC-32 reports a client_readonly:true custom field as read-only", () => {
    const record = mapProfile(clientWithReadOnlyField());

    const fields = mapProfileFields(record);
    const readOnlyField = fields.find(
      field => field.code === "readonly_number"
    );

    expect(readOnlyField).toBeDefined();
    expect(readOnlyField!.meta.isReadOnly).toBe(true);
  });

  it("AC-32 reports the real client_readonly:false 'age' field as NOT read-only, differing from the constructed row", () => {
    const record = mapProfile(clientWithReadOnlyField());

    const fields = mapProfileFields(record);
    const ageField = fields.find(field => field.code === "age");
    const readOnlyField = fields.find(
      field => field.code === "readonly_number"
    );

    expect(ageField).toBeDefined();
    expect(ageField!.meta.isReadOnly).toBe(false);
    expect(ageField!.meta.isReadOnly).not.toBe(readOnlyField!.meta.isReadOnly);
  });

  it("AC-32 does not report every projected field with the same isReadOnly/isDisabled flags", () => {
    const record = mapProfile(clientWithReadOnlyField());

    const fields = mapProfileFields(record);
    const distinctReadOnlyValues = new Set(
      fields.map(field => field.meta.isReadOnly)
    );

    expect(distinctReadOnlyValues.size).toBeGreaterThan(1);
  });
});

describe("mapIProfileFields — AC-45 diff-only body, empty diff is a no-op", () => {
  it("AC-45 sends only the field that actually changed", () => {
    const baseModel: ProfileModel = {
      firstName: "Checkout",
      lastName: "Test",
      publicName: "Checkout T.",
      language: "lang-1"
    };
    const model: ProfileModel = { ...baseModel, firstName: "Changed" };

    const diff = mapIProfileFields(model, baseModel);

    expect(diff).toEqual({ firstname: "Changed" });
  });

  it("AC-45 returns undefined for an empty diff — nothing changed", () => {
    const baseModel: ProfileModel = {
      firstName: "Checkout",
      lastName: "Test",
      publicName: "Checkout T.",
      language: "lang-1"
    };
    const model: ProfileModel = { ...baseModel };

    const diff = mapIProfileFields(model, baseModel);

    expect(diff).toBeUndefined();
  });
});

describe("mapIProfileFields — AC-46 a custom field can be CLEARED, present as JSON null", () => {
  it("AC-46 keeps a cleared custom-field code in the body as null, never omitting it", () => {
    const baseModel: ProfileModel = {
      customFields: { age: 42 } as CustomFieldModel
    };
    const model: ProfileModel = {
      customFields: { age: null } as unknown as CustomFieldModel
    };

    const diff = mapIProfileFields(model, baseModel);

    expect(diff?.custom_fields).toBeDefined();
    expect("age" in (diff!.custom_fields as object)).toBe(true);
    expect((diff!.custom_fields as Record<string, unknown>).age).toBeNull();
  });
});

describe("mapIProfileFields — AC-47 falsy native values are never silently dropped", () => {
  it("AC-47 sends an empty-string publicName explicitly, never omitted", () => {
    const baseModel: ProfileModel = { publicName: "Checkout T." };
    const model: ProfileModel = { publicName: "" };

    const diff = mapIProfileFields(model, baseModel);

    expect(diff).toHaveProperty("public_name");
    // Pinned, not either/or: the oracle decides this split (requirements.md,
    // 2026-08-11 amendment) — natives clear as the blanked value itself
    // (`clientProfileBasicConfigurationForm.vue:260-269`); `""->null` is a
    // custom-field-only rule (`clientCustomFieldsForm.vue:78-80`). A
    // regression to `null` on this native path must fail here, not pass.
    expect(diff!.public_name).toBe("");
  });

  it("AC-47 sends a false custom-field value explicitly", () => {
    const baseModel: ProfileModel = {
      customFields: { toggle: true } as unknown as CustomFieldModel
    };
    const model: ProfileModel = {
      customFields: { toggle: false } as unknown as CustomFieldModel
    };

    const diff = mapIProfileFields(model, baseModel);

    expect(diff?.custom_fields).toHaveProperty("toggle");
    expect((diff!.custom_fields as Record<string, unknown>).toggle).toBe(false);
  });

  it("AC-47 sends a zero custom-field value explicitly", () => {
    const baseModel: ProfileModel = {
      customFields: { age: 42 } as unknown as CustomFieldModel
    };
    const model: ProfileModel = {
      customFields: { age: 0 } as unknown as CustomFieldModel
    };

    const diff = mapIProfileFields(model, baseModel);

    expect(diff?.custom_fields).toHaveProperty("age");
    expect((diff!.custom_fields as Record<string, unknown>).age).toBe(0);
  });
});

describe("mapIProfileFields — AC-48 document_language_id follows an actual interface-language change only", () => {
  it("AC-48 sends no document_language_id when only firstName changed", () => {
    const baseModel: ProfileModel = {
      firstName: "Checkout",
      language: "lang-1"
    };
    const model: ProfileModel = { firstName: "Changed", language: "lang-1" };

    const diff = mapIProfileFields(model, baseModel);

    expect(diff).not.toHaveProperty("document_language_id");
  });

  it("AC-48 sends interface_language_id and document_language_id, equal to each other, when the language changed", () => {
    const baseModel: ProfileModel = { language: "lang-1" };
    const model: ProfileModel = { language: "lang-2" };

    const diff = mapIProfileFields(model, baseModel);

    expect(diff?.interface_language_id).toBe("lang-2");
    expect(diff?.document_language_id).toBe(diff?.interface_language_id);
  });
});

describe("mapIProfileFields — AC-49 the body never carries a staff-only key", () => {
  it("AC-49 keeps the body's key set inside the client-surface six", () => {
    const baseModel: ProfileModel = {};
    const model: ProfileModel = {
      firstName: "A",
      lastName: "B",
      publicName: "C",
      language: "lang-2",
      customFields: { age: 1 } as unknown as CustomFieldModel
    };
    const CLIENT_SURFACE_KEYS = [
      "firstname",
      "lastname",
      "public_name",
      "interface_language_id",
      "document_language_id",
      "custom_fields"
    ];

    const diff = mapIProfileFields(model, baseModel);

    expect(diff).toBeDefined();
    for (const key of Object.keys(diff!)) {
      expect(CLIENT_SURFACE_KEYS).toContain(key);
    }
    for (const staffOnlyKey of [
      "email",
      "number",
      "created_at",
      "notifications_disabled"
    ]) {
      expect(diff).not.toHaveProperty(staffOnlyKey);
    }
  });
});

describe("mapIProfileFields — AC-59 the custom_fields branch matches A's own seam byte-for-byte", () => {
  it("AC-59 produces the exact same custom_fields diff as calling A's mapCustomFieldValuesToRequest directly", () => {
    const baseCustomFields = {
      age: 42,
      other: "x"
    } as unknown as CustomFieldModel;
    const nextCustomFields = {
      age: null,
      other: "x"
    } as unknown as CustomFieldModel;

    const viaB = mapIProfileFields(
      { customFields: nextCustomFields },
      { customFields: baseCustomFields }
    );
    const viaA = mapCustomFieldValuesToRequest(
      nextCustomFields,
      baseCustomFields
    );

    expect(viaB?.custom_fields).toEqual(viaA);
  });
});

describe("mapProfileFields — AC-59 the READ-side custom field value is A's coercion, not a local re-derivation", () => {
  it("AC-59 projects a custom field's value exactly as A's own seam (mapCustomFieldValues, A-9) coerces it — never re-derived locally", () => {
    const client = recordedClient();
    const ageRow = client.custom_fields?.find(
      row => (row.field as { code?: string } | undefined)?.code === "age"
    );
    if (!ageRow) {
      throw new Error(
        "Fixture regression: the recorded client no longer carries the real " +
          "'age' custom field this test projects."
      );
    }
    // The recorded 'age' value is a REAL non-null NUMBER as of this capture
    // — used directly, no construction needed. AC-14's own coercion table
    // requires NUMBER stay type-preserving; `String(value.value)` (the
    // seam-bypass mutant, in place of the seam call) would instead produce
    // a string, which is exactly the divergence this assertion must catch.
    // Comparison goes through A's OWN A-9 seam (`mapCustomFieldValues`,
    // which resolves the field via A-8 then coerces via A-6) rather than
    // hand-building a `CustomField` to feed A-6 directly — B never has a
    // mapped `CustomField` to hand either; it only ever holds the raw
    // `ICustomFieldValue[]` A-9 already knows how to walk.
    if (typeof ageRow.value !== "number") {
      throw new Error(
        "Fixture regression: this assertion needs the recorded 'age' value " +
          "to be a real non-null NUMBER — re-capture rather than construct one."
      );
    }

    const record = mapProfile(client);
    const fields = mapProfileFields(record);
    const projected = fields.find(field => field.code === "age");
    const viaA = mapCustomFieldValues([ageRow as never]);

    expect(projected).toBeDefined();
    expect(projected!.value).toEqual(viaA.age);
    expect(typeof projected!.value).not.toBe("string");
  });
});
