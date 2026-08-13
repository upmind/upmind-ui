/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-11, 6795 nodes) — no
 * `CorpusFixtureName` / `RecordedFixture` / corpus-source node exists anywhere
 * in the tree, so this contract is minted rather than consumed. The recorded
 * ENVELOPE schema does already exist (`ApiFixtureV3`, `tests/fixtures/types.ts`)
 * but ships from a test-lane-only package the app runtime has no alias for, so
 * it cannot be named from here; `RecordedFixture` below is the read-only subset
 * design §3.2 calls self-describing. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/corpus.source.types
 * @description The reach seam's CONTRACT — which committed artefacts a resolved
 * source carries, and in what shape. It lives beside the seam rather than
 * inside it, which is what let the interior be swapped whole when `ESC6` was
 * ruled (`corpus.source.ts`, 2026-08-12) without a consumer's import moving.
 */

// -----------------------------------------------------------------------------

/**
 * The ten committed recordings, by file stem and in on-disk order
 * (`packages/headless/src/modules/client-email/__tests__/fixtures/*.json`). A
 * resolved source carries one exchange per name and no others: the corpus is
 * the recording, never a hand-authored body (S13).
 */
export const CORPUS_FIXTURE_NAMES = [
  "delete-clients-id-emails-id",
  "get-clients-id-emails-case-page-1",
  "get-clients-id-emails-case-page-2",
  "get-clients-id-emails-id",
  "get-clients-id-emails",
  "patch-clients-id-emails-id-send-verify",
  "post-clients-id-emails",
  "put-clients-id-emails-id-case-set-default-unverified",
  "put-clients-id-emails-id-case-set-default",
  "put-clients-id-emails-id"
] as const;

/** One committed recording, named by its file stem. */
export type CorpusFixtureName = (typeof CORPUS_FIXTURE_NAMES)[number];

/**
 * How many of `client-email.feature`'s scenarios the module's step catalog
 * matches — the playlist's arity, which is the one claim about `featureText`
 * its type cannot carry. Fewer than the feature declares: the rest are
 * capabilities written down and not yet driven. The scenario bar renders Live
 * plus these.
 *
 * @graphify-citation `graphify query "scenario track count playlist arity"`
 * (2026-08-12) — no such node in `graphify-out/graph.json` beyond this file.
 */
export const CLIENT_EMAIL_TRACK_COUNT = 11;

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

/** Every recorded body a resolved source serves, keyed by fixture name. */
export type CorpusBodies = Readonly<Record<CorpusFixtureName, RecordedFixture>>;
