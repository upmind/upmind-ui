// -----------------------------------------------------------------------------
/**
 * @module tests/custom-fields-form
 * @description Gap doc §4 "Profile": the brand's own questions about a client,
 * which legacy let them answer (`clientCustomFieldsComp.vue`). The definitions
 * ARE the schema (plan §3, the `client-custom-fields` row), so a brand that asks
 * nothing must render no panel at all rather than an empty one — and the answers
 * round-trip through the one action door like every other form (plan F6).
 */

import { beforeEach, describe, expect, it } from "vitest";
import { boundRefId, rowBinding } from "./support/page-config";
import { cloneDeep, filter, find, get, last, map, omit } from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { MockClientCustomField, MockDataset } from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction
} from "~/portal/mock/actions";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT = {};

/** Where the field parsers scope every control, and so where the model hangs. */
const MODEL_KEY = "customFields";

function hostgrid(): MockDataset {
  const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
  if (data.customFields.length === 0) {
    throw new Error("the hostgrid brand asks nothing");
  }
  return data;
}

function profilePage(): unknown {
  return accountPages()[PAGE_KEY.ACCOUNT_PROFILE];
}

function ref(data: MockDataset, id: DataRefId): unknown {
  return resolveDataRefProps({ value: dataRef(id) }, data)?.value;
}

/** The schema's own field block — the parsers compose UNDER the parent's key. */
function fieldsSchema(data: MockDataset): unknown {
  return get(ref(data, DATA_REF_ID.CUSTOM_FIELDS_FORM_SCHEMA), [
    "properties",
    MODEL_KEY
  ]);
}

function requiredField(data: MockDataset): MockClientCustomField {
  const field = find(data.customFields, item => item.meta.isRequired);
  if (field === undefined) throw new Error("the brand asks nothing it must");
  return field;
}

function choiceField(data: MockDataset): MockClientCustomField {
  const field = find(
    data.customFields,
    item => (item.options ?? []).length > 0
  );
  if (field === undefined) throw new Error("the brand offers no choice list");
  return field;
}

function answers(data: MockDataset): Record<string, unknown> {
  return Object.fromEntries(
    map(data.customFields, item => [item.code, item.value])
  );
}

function formProps(page: unknown, id: DataRefId): ConfigNode | undefined {
  const slots = rowBinding(page, id)?.slots;
  if (!Array.isArray(slots)) return undefined;
  const slot = slots.find(
    candidate =>
      typeof candidate === "object" &&
      candidate !== null &&
      (candidate as ConfigNode).id === "form"
  );
  if (typeof slot !== "object" || slot === null) return undefined;
  const props = (slot as ConfigNode).props;
  if (typeof props !== "object" || props === null) return undefined;
  return props as ConfigNode;
}

describe("the brand's own questions, as a form", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("the profile page binds the form, gated on there being questions at all", () => {
    const page = profilePage();
    const row = rowBinding(page, DATA_REF_ID.CUSTOM_FIELDS_FORM_MODEL);
    const props = formProps(page, DATA_REF_ID.CUSTOM_FIELDS_FORM_MODEL);

    expect(boundRefId(row, "visible")).toBe(DATA_REF_ID.HAS_CUSTOM_FIELDS);
    expect(props?.submit).toBe(MOCK_ACTION.CUSTOM_FIELDS_SAVE);
    expect(boundRefId(props, "schema")).toBe(
      DATA_REF_ID.CUSTOM_FIELDS_FORM_SCHEMA
    );
    expect(boundRefId(props, "uischema")).toBe(
      DATA_REF_ID.CUSTOM_FIELDS_FORM_UISCHEMA
    );
    expect(props?.submitLabel).toBeTruthy();
  });

  it("a brand that asks nothing opens that gate on nothing", () => {
    const asked = hostgrid();
    expect(ref(asked, DATA_REF_ID.HAS_CUSTOM_FIELDS)).toBe(true);

    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
    const silent = useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
    expect(silent.customFields).toEqual([]);
    expect(ref(silent, DATA_REF_ID.HAS_CUSTOM_FIELDS)).toBe(false);
    expect(get(fieldsSchema(silent), "properties")).toEqual({});
  });

  it("the model it opens with is the answers the account already carries", () => {
    const data = hostgrid();

    expect(ref(data, DATA_REF_ID.CUSTOM_FIELDS_FORM_MODEL)).toEqual({
      [MODEL_KEY]: answers(data)
    });
  });

  it("the schema asks what the brand made mandatory, and offers its choices", () => {
    const data = hostgrid();
    const fields = fieldsSchema(data);
    const choice = choiceField(data);

    expect(get(fields, "required")).toEqual(
      map(
        filter(data.customFields, item => item.meta.isRequired),
        "code"
      )
    );
    expect(Object.keys(get(fields, "properties") ?? {})).toEqual(
      map(data.customFields, "code")
    );
    expect(get(fields, ["properties", choice.code, "options"])).toEqual(
      choice.options
    );
    expect(get(fields, ["properties", choice.code, "enum"])).toEqual([
      null,
      ...map(choice.options, "value")
    ]);
  });

  it("saving writes every answer onto the account, and says so", () => {
    const data = hostgrid();
    const choice = choiceField(data);
    const model = {
      ...answers(data),
      [requiredField(data).code]: "Aviation",
      [choice.code]: get(last(choice.options), "value")
    };

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      `${MOCK_ACTION.CUSTOM_FIELDS_SAVE}:${JSON.stringify({
        [MODEL_KEY]: model
      })}`
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(answers(data)).toEqual(model);
    expect(ref(data, DATA_REF_ID.CUSTOM_FIELDS_FORM_MODEL)).toEqual({
      [MODEL_KEY]: model
    });
  });

  it("the schema refuses a mandatory answer left out, before it is ever sent", () => {
    const data = hostgrid();
    const validate = usePortalAjv().compile(
      ref(data, DATA_REF_ID.CUSTOM_FIELDS_FORM_SCHEMA) as object
    );
    const complete = answers(data);

    expect(validate({ [MODEL_KEY]: complete })).toBe(true);
    expect(
      validate({ [MODEL_KEY]: omit(complete, [requiredField(data).code]) })
    ).toBe(false);
    expect(map(validate.errors, "keyword")).toContain("required");
  });

  it("a choice the brand never offered is refused too", () => {
    const data = hostgrid();
    const validate = usePortalAjv().compile(
      ref(data, DATA_REF_ID.CUSTOM_FIELDS_FORM_SCHEMA) as object
    );

    expect(
      validate({
        [MODEL_KEY]: {
          ...answers(data),
          [choiceField(data).code]: "Something else"
        }
      })
    ).toBe(false);
    expect(map(validate.errors, "keyword")).toContain("enum");
  });

  it("a half-typed payload is not a write", () => {
    const data = hostgrid();
    const before = cloneDeep(data.customFields);

    expect(
      dispatchMockAction(
        data,
        NO_CONTEXT,
        `${MOCK_ACTION.CUSTOM_FIELDS_SAVE}:{"customFields":`
      )
    ).toBeUndefined();
    expect(data.customFields).toEqual(before);
  });
});
