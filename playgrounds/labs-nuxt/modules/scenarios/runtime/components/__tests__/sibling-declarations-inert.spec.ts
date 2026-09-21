// -----------------------------------------------------------------------------
/**
 * @fileoverview FE-3031 — the seven sibling scenarios stay opt-in-inert
 * against the two new runtime channels (`ScenarioPresentation.notices`,
 * `DetailUischema.siblings`), so a future change to either channel cannot
 * silently start affecting a scenario that never asked for it.
 *
 * ## Job To Be Done
 * Both channels are additive and opt-in by construction — a declaration
 * naming neither field behaves identically to before the fields existed
 * (`ListSurfaceProps.notices`: "Absent, the list draws none, exactly as
 * before this field existed"; `DetailUischema.siblings`: "Absent, `model`
 * is `data` alone, exactly as before this field existed"). This dispatch's
 * own developer proved that with a pristine-vs-mine A/B swap across the
 * labs-nuxt unit/component/module suites; this file makes the SAME claim a
 * standing, committed assertion instead of a one-off diff-time swap, so the
 * next change to `runtime/**` cannot quietly start drawing something on a
 * sibling page that never declared it.
 *
 * Rendered-output regression coverage for these same seven modules already
 * exists and stays green post-fix — `forced-surface.{client-address,
 * client-company,client-custom-fields,client-email,client-email-history,
 * client-personal-details,client-phone}.spec.ts`, 39/39, re-run for this
 * dispatch (see this story's read-back). This file adds the declaration-
 * level guard those suites do not check for: that neither new field is
 * PRESENT at all on any sibling, not merely that it currently renders
 * nothing (a declaration that started naming `notices`/`siblings` today
 * with an empty or matching-shaped value could still slip the rendered
 * suites while having genuinely opted in).
 *
 * ## What Breaks If These Fail
 * A future edit to a shared presentation builder, or a copy-paste from
 * `invoices.presentation.ts`, drags `notices`/`siblings` onto a sibling
 * scenario that never asked for either channel and never gets a rendered
 * assertion written against the new behaviour — the FE-2824 shape one layer
 * up: right file, present field, no scenario proving what it now does.
 */

import { describe, expect, it } from "vitest";
import clientAddress from "../../../useClientAddresses/client-address.scenario";
import clientCompany from "../../../useClientCompanies/client-company.scenario";
import clientCustomFields from "../../../useClientCustomFields/client-custom-fields.scenario";
import clientEmail from "../../../useClientEmails/client-email.scenario";
import clientPhone from "../../../useClientPhones/client-phone.scenario";
import clientEmailHistory from "../../../useClientReceivedEmails/client-email-history.scenario";
import clientPersonalDetails from "../../../usePersonalDetails/client-personal-details.scenario";
import type { DetailUischema, ScenarioDeclaration } from "../../scenario.types";

// -----------------------------------------------------------------------------

const SIBLINGS: Record<string, ScenarioDeclaration> = {
  "client-address": clientAddress as ScenarioDeclaration,
  "client-company": clientCompany as ScenarioDeclaration,
  "client-custom-fields": clientCustomFields as ScenarioDeclaration,
  "client-email": clientEmail as ScenarioDeclaration,
  "client-email-history": clientEmailHistory as ScenarioDeclaration,
  "client-personal-details": clientPersonalDetails as ScenarioDeclaration,
  "client-phone": clientPhone as ScenarioDeclaration
};

describe("FE-3031 — the seven sibling scenarios never opted into either new channel", () => {
  it("names all seven — a missing import here is a coverage hole, not a pass", () => {
    expect(Object.keys(SIBLINGS)).toHaveLength(7);
  });

  it.each(Object.entries(SIBLINGS))(
    "%s declares no presentation.notices",
    (_name, declaration) => {
      expect(declaration.presentation.notices).toBeUndefined();
    }
  );

  it.each(Object.entries(SIBLINGS))(
    "%s declares no detail.siblings",
    (_name, declaration) => {
      const detail = declaration.presentation.detail as
        | DetailUischema
        | undefined;
      expect(detail?.siblings).toBeUndefined();
    }
  );

  it("invoices is the ONLY declaration naming notices or siblings — the opt-in is exclusive to the module that asked for it", async () => {
    const invoices = (await import("../../../useInvoices/invoices.scenario"))
      .default as ScenarioDeclaration;
    const detail = invoices.presentation.detail as DetailUischema | undefined;

    expect(invoices.presentation.notices).toBeDefined();
    expect(detail?.siblings).toBeDefined();

    for (const declaration of Object.values(SIBLINGS)) {
      expect(declaration.presentation.notices).toBeUndefined();
      expect(
        (declaration.presentation.detail as DetailUischema | undefined)
          ?.siblings
      ).toBeUndefined();
    }
  });
});
