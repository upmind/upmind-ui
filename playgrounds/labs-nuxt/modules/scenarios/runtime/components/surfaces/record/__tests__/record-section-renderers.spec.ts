// -----------------------------------------------------------------------------
/**
 * @module surfaces/record/__tests__/record-section-renderers.spec
 * @description The record-section renderer REGISTRY — the peer of the declared
 * cell registry. A section draws through the renderer its own `kind` names,
 * resolved from the registry, so a later kind (`thread`) is a registered entry
 * rather than a branch in `RecordSurface`.
 *
 * ## What Breaks If These Fail
 * The record surface regains a `kind` switch, or two kinds collapse onto one
 * renderer — a declaration that reads as a collection draws as a field grid, and
 * an unregistered kind throws instead of drawing nothing.
 */

import { describe, expect, it } from "vitest";
import {
  recordSectionRenderers,
  resolveRecordSection
} from "../record.renderers";
import { filter, map, size, uniq } from "lodash-es";
import type { RecordSectionDeclaration } from "../../../../scenario.types";

// -----------------------------------------------------------------------------

const DECLARED_KINDS = ["fields", "collection", "thread", "alert"];

const asSection = (kind: string): RecordSectionDeclaration =>
  ({ kind, key: kind }) as RecordSectionDeclaration;

// -----------------------------------------------------------------------------

describe("the registry claims each declared section kind exactly once", () => {
  it("registers one entry per declared kind and no more", () => {
    expect(size(recordSectionRenderers)).toBe(size(DECLARED_KINDS));
  });

  it("resolves every declared kind to a renderer", () => {
    expect(
      map(DECLARED_KINDS, kind => !!resolveRecordSection(asSection(kind)))
    ).toEqual(map(DECLARED_KINDS, () => true));
  });

  it("gives no two kinds the same renderer", () => {
    const renderers = map(
      DECLARED_KINDS,
      kind => resolveRecordSection(asSection(kind))?.renderer
    );

    expect(size(uniq(renderers))).toBe(size(DECLARED_KINDS));
  });

  it("resolves nothing for a kind no renderer registered for", () => {
    expect(resolveRecordSection(asSection("thread-not-yet-built"))).toBe(
      undefined
    );
    expect(
      filter(recordSectionRenderers, { kind: "thread-not-yet-built" })
    ).toEqual([]);
  });
});
