// -----------------------------------------------------------------------------
/**
 * @module tests/form-exemplars
 * @description Plan §4 F0's two exemplars, one per placement (F2): renaming a
 * payment method in the shell's dialog on a LOCAL schema (F4), and the
 * profile's personal details inline on the module's OWN schema (F3). Between
 * them they prove the whole round trip F6 promises — the model comes from the
 * facade, the submit goes back through the one action door, the dataset
 * answers with a receipt, and no form-local state survives it.
 */

import { beforeEach, describe, expect, it } from "vitest";
import headlessSource from "../../../packages/headless/src/modules/client-personal-details/client-personal-details.schemas.ts?raw";
import { boundRefId, rowBinding } from "./support/page-config";
import { difference, map, sortBy, uniq } from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { MockDataset } from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction
} from "~/portal/mock/actions";
import standInSource from "~/portal/mock/contracts/client-personal-details.schemas.ts?raw";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { PORTAL_FORM_LANGUAGES } from "~/portal/mock/forms/engine-data";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT = {};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function resolveRef(data: MockDataset, id: string): unknown {
  return resolveDataRefProps({ value: dataRef(id as never) }, data)?.value;
}

/** Every name a module's source exports, however it spells the declaration. */
function exportedNames(source: string): string[] {
  const found = source.matchAll(
    /export\s+(?:declare\s+)?(?:const|function|class|type|interface|enum)\s+(\w+)/g
  );
  return sortBy(uniq(map([...found], match => match[1] ?? "")));
}

/** The profile page's own `form` row, as the config authored it. */
function profileFormProps(): ConfigNode | undefined {
  const page = accountPages()[PAGE_KEY.ACCOUNT_PROFILE];
  const row = rowBinding(page, DATA_REF_ID.PROFILE_FORM_MODEL);
  const slots = row?.slots;
  if (!Array.isArray(slots)) return undefined;
  const slot = slots.find(
    candidate =>
      typeof candidate === "object" &&
      candidate !== null &&
      (candidate as ConfigNode).id === "form"
  ) as ConfigNode | undefined;
  return slot?.props as ConfigNode | undefined;
}

describe("exemplar — personal details (inline, the module's own schema)", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("the profile page binds a form row, and keeps no read-only copy of it", () => {
    const page = accountPages()[PAGE_KEY.ACCOUNT_PROFILE];
    const props = profileFormProps();

    expect(props?.submit).toBe(MOCK_ACTION.PROFILE_SAVE);
    expect(boundRefId(props, "schema")).toBe(DATA_REF_ID.PROFILE_FORM_SCHEMA);
    expect(boundRefId(props, "uischema")).toBe(
      DATA_REF_ID.PROFILE_FORM_UISCHEMA
    );
    expect(boundRefId(props, "model")).toBe(DATA_REF_ID.PROFILE_FORM_MODEL);
    expect(props?.submitLabel).toBeTruthy();
    expect(props?.resetLabel).toBeTruthy();
    expect(rowBinding(page, DATA_REF_ID.PROFILE_SPEC_ITEMS)).toBeUndefined();
  });

  it("the model it opens with is the persona itself, not a copy that drifts", () => {
    const data = hostgrid();

    expect(resolveRef(data, DATA_REF_ID.PROFILE_FORM_MODEL)).toEqual({
      firstName: data.persona.firstName,
      lastName: data.persona.lastName,
      publicName: data.persona.publicName,
      language: data.persona.language
    });
  });

  it("offers exactly the interface languages the engine data publishes", () => {
    const data = hostgrid();
    const schema = resolveRef(data, DATA_REF_ID.PROFILE_FORM_SCHEMA) as {
      properties: {
        language: {
          enum?: string[];
          options?: { label: string; value: string }[];
        };
      };
    };

    expect(schema.properties.language.enum).toEqual(
      map(PORTAL_FORM_LANGUAGES, "id")
    );
    expect(map(schema.properties.language.options, "label")).toEqual(
      map(PORTAL_FORM_LANGUAGES, "language")
    );
  });

  it("saving writes the four fields onto the persona and says so", () => {
    const data = hostgrid();
    const model = {
      firstName: "Grace",
      lastName: "Hopper",
      publicName: "Grace H",
      language: "fr"
    };

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      `${MOCK_ACTION.PROFILE_SAVE}:${JSON.stringify(model)}`
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(result?.toast?.title).toBe("Profile saved");
    expect({
      firstName: data.persona.firstName,
      lastName: data.persona.lastName,
      publicName: data.persona.publicName,
      language: data.persona.language
    }).toEqual(model);
    expect(resolveRef(data, DATA_REF_ID.PROFILE_FORM_MODEL)).toEqual(model);
  });

  it("the stand-in schema module is the future headless one, name for name", () => {
    const real = exportedNames(headlessSource);
    const standIn = exportedNames(standInSource);

    expect(real).toContain("useSchema");
    expect(real).toContain("useUischema");
    // Plan F4: the real exports, plus the create model no real module carries.
    expect(difference(real, standIn)).toEqual([]);
    expect(difference(standIn, real)).toEqual(["profileDefaults"]);
    expect(standInSource).toContain("(context: ProfileContext)");
    expect(headlessSource).toContain("(context: ProfileContext)");
  });
});
