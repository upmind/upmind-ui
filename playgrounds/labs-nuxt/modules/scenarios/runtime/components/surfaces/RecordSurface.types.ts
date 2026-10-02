// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/RecordSurface.types
 * @description Type definitions for the single-record surface — the systematic
 * twin of `ListSurface`: ONE panel drawn entirely from a declared
 * `RecordUischema` against the live port of the manager on screen.
 *
 * The declaration shapes are `scenario.types`' own and the port is
 * `useModulePort`'s, consumed rather than re-declared.
 */

import type { ModulePort } from "../../composables/useModulePort.types";
import type {
  RecordActionColorTypes,
  RecordPickerDeclaration,
  RecordUischema
} from "../../scenario.types";
import type { ActionSlotItem } from "../ActionSlots.types";
import type { FormProps } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

export type RecordSurfaceProps = {
  /** How the record draws: header, sections and every action. */
  uischema: RecordUischema;
  /** The live port of the manager on screen; every action resolves on it. */
  port: ModulePort;
  /** A scenario drives the panel, so every control says why it will not fire. */
  locked?: boolean;
};

/** A bound record control — a slot item plus the footer tint it declared. */
export type RecordControl = ActionSlotItem & {
  color?: RecordActionColorTypes;
};

/** The `{ schema, uischema, model }` slot a form action's context key holds. */
export type RecordFormSlot = {
  schema?: FormProps["schema"];
  uischema?: FormProps["uischema"];
  model?: Record<string, unknown>;
};

export type RecordLookupProps = {
  picker: RecordPickerDeclaration;
  /** The scenario's url segment — the page a pick opens. */
  route: string;
};
