/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-11, 6795 nodes) — no
 * `RecordedFixture` / corpus-source node exists anywhere in the tree, so this
 * contract is minted rather than consumed. The recorded ENVELOPE schema does
 * already exist (`ApiFixtureV3`, `tests/fixtures/types.ts`) but ships from a
 * test-lane-only package the app runtime has no alias for, so it cannot be
 * named from here; `RecordedFixture` below is the read-only subset design §3.2
 * calls self-describing. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/corpus.source.types
 * @description The reach seam's CONTRACT — which committed artefacts a resolved
 * source carries, and in what shape. It lives beside the seam rather than
 * inside it, which is what let the interior be swapped whole when `ESC6` was
 * ruled (`corpus.source.ts`, 2026-08-12) without a consumer's import moving.
 *
 * DECOUPLED (FE-3094): module-specific constants moved out. Fixture names are
 * now derived dynamically from headless/testing's published keys.
 */

// -----------------------------------------------------------------------------

/**
 * A recorded exchange as its consumers read it: the self-describing quartet the
 * corpus resolver branches on. The committed file carries more (`version`,
 * `captured_at`, `brand_domain`, `source`, `provenance`, response headers) and
 * a resolved source hands those through untouched — nothing reads them here.
 */
export type RecordedFixture = {
  request: { method: string; path: string };
  response: { status: number; body: unknown };
};
