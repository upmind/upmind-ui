// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/record/record.renderers
 * @description The record-section renderer REGISTRY — one entry per section
 * `kind`, the peer of the declared-cell registry (`cells.renderers.ts`). A new
 * kind (`thread`) is an entry here and a component beside it, never a branch in
 * `RecordSurface`.
 */

import { openNotice } from "./record.utils";
import RecordAlertSection from "./RecordAlertSection.vue";
import RecordCollectionSection from "./RecordCollectionSection.vue";
import RecordFieldsSection from "./RecordFieldsSection.vue";
import RecordThreadSection from "./RecordThreadSection.vue";
import { find } from "lodash-es";
import type { RecordSectionEntry } from "./record.types";
import type {
  RecordAlertSection as RecordAlertDeclaration,
  RecordSectionDeclaration
} from "../../../scenario.types";

// -----------------------------------------------------------------------------

export const recordSectionRenderers: RecordSectionEntry[] = [
  { kind: "fields", renderer: RecordFieldsSection },
  { kind: "collection", renderer: RecordCollectionSection },
  { kind: "thread", renderer: RecordThreadSection },
  {
    kind: "alert",
    renderer: RecordAlertSection,
    isBlank: (section, _model, allows) =>
      !openNotice((section as RecordAlertDeclaration).alerts, allows),
    skeletonRows: 0
  }
];

/** The renderer registered for this section's `kind`; none draws nothing. */
export function resolveRecordSection(
  section: RecordSectionDeclaration
): RecordSectionEntry | undefined {
  return find(recordSectionRenderers, { kind: section.kind });
}
