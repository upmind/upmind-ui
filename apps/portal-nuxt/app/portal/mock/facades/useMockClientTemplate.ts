// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockClientTemplate
 * @description ONE brand-authored template slot, read (plan R12) — the mock
 * stand-in for `useClientTemplate({ code })` in `system-client-area`, keyed on
 * the platform's own slot code. Read-only: a slot is authored in the admin,
 * never from the client area, so this facade carries no writes.
 */

import { defineMockFacade } from "./facade";
import { find } from "lodash-es";
import type { MockTemplateSlot } from "../types";
import type { IClientTemplateSlot } from "@upmind-automation/types";
// -----------------------------------------------------------------------------

/** The body the brand wrote into one slot, or an empty string where it wrote none. */
export function templateSlotBody(
  templates: readonly MockTemplateSlot[],
  code: IClientTemplateSlot["code"]
): string {
  return find(templates, { code })?.body ?? "";
}

export const useMockClientTemplate = defineMockFacade(
  (data, code): MockTemplateSlot | undefined =>
    find(data.templates, candidate => candidate.code === code),
  () => ({})
);
