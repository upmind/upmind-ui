// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/record/record.types
 * @description What every record-section renderer is handed, and the registry
 * entry it is resolved through by its declared `kind`.
 *
 * The section and action shapes are `scenario.types`' own declarations and the
 * bound control is `RecordControl`, all consumed rather than re-declared.
 */

import type {
  RecordActionDeclaration,
  RecordSectionDeclaration,
  TableCell
} from "../../../scenario.types";
import type { RecordControl } from "../RecordSurface.types";
import type { FileUploadStatus, MenuItem, TimelineEvent } from "@upmind/ui";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

/** Binds declared actions to live controls, against a row when one is given. */
export type RecordActionBinder = (
  actions: RecordActionDeclaration[],
  row?: Record<string, unknown>
) => RecordControl[];

export type RecordSectionProps<
  TSection extends RecordSectionDeclaration = RecordSectionDeclaration
> = {
  section: TSection;
  /** The record model every declared scope resolves against. */
  model: Record<string, unknown>;
  /** A scenario drives the surface, so its controls say why they will not fire. */
  locked?: boolean;
  bind: RecordActionBinder;
  /** True while any write is in flight or a form is open — every other write is disabled. */
  busy?: boolean;
  /**
   * Fires a manager action WITH arguments as one of the surface's writes; a
   * failure is reported on the surface, then rethrown.
   */
  invoke?: RecordInvoker;
  /** True while the section's declared source has not settled its first read. */
  loading?: boolean;
  /** Whether a declared gate is open, against the row when one is given. */
  allows?: RecordGateReader;
};

/** Whether a declared gate is open, against the row when one is given. */
export type RecordGateReader = (
  gate?: string,
  row?: Record<string, unknown>
) => boolean;

export type RecordInvoker = (
  name: string,
  ...args: unknown[]
) => Promise<unknown>;

export type RecordFieldGridProps = {
  elements: TableCell[];
  model: Record<string, unknown>;
};

/** One registered section kind and the component that draws it. */
export type RecordSectionEntry = {
  kind: string;
  renderer: Component;
  /** Whether the section has nothing to draw on this record; absent, it always draws. */
  isBlank?: (
    section: RecordSectionDeclaration,
    model: Record<string, unknown>,
    allows: RecordGateReader
  ) => boolean;
  /** The placeholder rows its boot skeleton draws; absent, the surface's default. */
  skeletonRows?: number;
};

/** One timeline event a thread draws — a message with its bound controls, or a log line. */
export type RecordThreadEvent = TimelineEvent & {
  key: string;
  message?: Record<string, unknown>;
  author?: string;
  badges: { key: string; label: string }[];
  actions: RecordControl[];
  files: { id: string; name: string; menu: MenuItem[] }[];
};

/** One picked file's upload, and the ref the reply carries once it is up. */
export type RecordThreadUpload = {
  status: FileUploadStatus;
  ref?: { id: string; name: string };
};
