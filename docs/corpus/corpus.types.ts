// docs/corpus/corpus.types.ts
//
// The typed, renderer-independent shape of the docs corpus (FE-2752, design §5).
// Plain TypeScript types, no runtime deps, importable by any consumer
// (build.mjs, emit-mdx.mjs, the gates, in-repo factory agents, the FE-3003
// discovery channel). Deliberately thin: every section is a keyed map plus a
// small entry record — no polymorphic class hierarchy, no schema library.
// JSON Schema / zod validation is NOT added; the CI gates are the validators.
//
// The corpus JSON carries NO renderer markup (no MDX, no Mintlify component
// tags, no VitePress link syntax). Bodies are stored as plain markdown / TSDoc
// text; all renderer concerns live in emit-mdx.mjs (2752-AC5, design §5).

// -----------------------------------------------------------------------------
// Identifiers — every id resolves in `corpus.index` (design §5.3/§5.6).
// -----------------------------------------------------------------------------

/**
 * A documented symbol, addressed with TypeDoc's declaration-reference syntax
 * `pkg!export` — reused, never invented (design §5, §5.1). The package segment
 * is the workspace package name.
 * @example "@upmind-automation/headless!useSystem"
 */
export type SymbolId = string;

/**
 * A source file endpoint, `file:<repo-relative path>` — the file-granularity
 * id the §5.3 relations bridge emits when a graphify node resolves only to a
 * file (never to an exported symbol).
 * @example "file:packages/headless/src/useUpmind.ts"
 */
export type FileId = string;

/**
 * A hand-authored document (ADR or guide) ingested read-only into the corpus
 * as an index entry, not a prose copy (design §5.2).
 *
 * Id convention (authoritative — the builder and every referent MUST follow it):
 *  - ADR:   `adr:<basename-without-extension>`   e.g. "adr:026-mintlify-docs-platform"
 *  - guide: `guide:<repo-relative-path-without-extension>`
 *           e.g. "guide:docs/@upmind-automation/headless/system-guide"
 */
export type DocId = string;

/**
 * A code example / snippet.
 * Id convention: `example:<slug>` (design §5, FE-2754 owns population).
 */
export type ExampleId = string;

/**
 * A glossary term, keyed by its slug (kebab-case of the canonical term).
 * @example "payment-gateway"
 */
export type TermSlug = string;

/** Any id in the corpus — all resolve in `corpus.index`. */
export type CorpusId = SymbolId | FileId | DocId | ExampleId | TermSlug;

/** The kind tag carried by every `corpus.index` entry (design §5.6). */
export type CorpusKind =
  | "symbol"
  | "guide"
  | "adr"
  | "example"
  | "term"
  | "file";

// -----------------------------------------------------------------------------
// Top-level corpus (design §5).
// -----------------------------------------------------------------------------

export interface Corpus {
  meta: CorpusMeta;
  symbols: Record<SymbolId, SymbolEntry>;
  guides: Record<DocId, GuideEntry>;
  adrs: Record<DocId, AdrEntry>;
  examples: Record<ExampleId, ExampleEntry>;
  relations: RelationsSection;
  changelog: ChangelogSection;
  glossary: GlossarySection;
  /** One flat lookup: id -> { kind, path, module, title } (design §5.6). */
  index: Record<CorpusId, IndexEntry>;
}

// -----------------------------------------------------------------------------
// meta (design §6.2/§6.3).
// -----------------------------------------------------------------------------

export interface CorpusMeta {
  /**
   * `<schema-major>+<12-hex content hash>` over the canonical corpus content,
   * excluding the volatile meta fields themselves (design §6.3).
   * @example "1+9f2a1c4b7de0"
   */
  corpus_version: string;
  /** ISO-8601 build timestamp; copied verbatim onto every emitted page. */
  built_at: string;
  /** The monorepo commit the build ran at; anchors the changelog window (§5.4). */
  source_commit: string;
  /** sha256 of the `relations.json` snapshot this build consumed (§6.3/§8.2 pin). */
  relationsSha256: string;
  /** Per-section entry counts (thin summary; not authoritative over the maps). */
  counts: Record<string, number>;
}

// -----------------------------------------------------------------------------
// symbols — from the reused TypeDoc reflection (design §5.1).
// -----------------------------------------------------------------------------

export interface SymbolEntry {
  id: SymbolId;
  name: string;
  /** TypeDoc ReflectionKind name, e.g. "Function", "Interface", "Class". */
  kind: string;
  /** Headless module dir, e.g. "system". */
  module: string;
  /** Repo-relative, e.g. "packages/headless/src/...". */
  sourceFile: string;
  sourceLine: number;
  /** Rendered from the reflection — plain text, no renderer markup. */
  signature: string;
  /** TSDoc body as plain markdown, or null when the symbol carries none. */
  tsdoc: string | null;
  /**
   * The "Lessons (hard-won)" section (ADR-019 amendment, FE-2752-AC6). The
   * pre-amendment label is never emitted anywhere in the corpus.
   */
  lessons: string[];
}

// -----------------------------------------------------------------------------
// guides + adrs — ingested references, not prose copies (design §5.2).
// -----------------------------------------------------------------------------

export interface GuideEntry {
  id: DocId;
  title: string;
  /** Repo-relative path to the source file (the corpus indexes, never copies). */
  path: string;
  /** Section headings, in document order. */
  headings: string[];
  /** Extracted cross-references resolvable in `corpus.index`. */
  crossRefs: CorpusId[];
}

export interface AdrEntry {
  id: DocId;
  title: string;
  path: string;
  headings: string[];
  crossRefs: CorpusId[];
}

// -----------------------------------------------------------------------------
// examples — the FE-2754 seam; near-empty at first (design §5, §7.1).
// -----------------------------------------------------------------------------

export interface ExampleEntry {
  id: ExampleId;
  title: string;
  /** Fence language, e.g. "ts" | "vue". */
  lang: string;
  /** The snippet body, type-checked against real exports by gate:examples. */
  code: string;
  /** Repo-relative origin of the snippet, when it came from a marked fence. */
  sourceFile?: string;
  /** Symbols/docs the example illustrates, resolvable in `corpus.index`. */
  referents?: CorpusId[];
}

// -----------------------------------------------------------------------------
// relations — committed snapshot + id bridge + prune (design §5.3).
// -----------------------------------------------------------------------------

/** graphify's relation vocabulary, carried as-is (design §2.4/§5.3). */
export type RelationKind = "imports_from" | "calls" | "contains" | "method";

/**
 * 'symbol' only when BOTH endpoints resolved to SymbolIds; 'file' otherwise
 * (design §5.3 bridge step 3).
 */
export type RelationGranularity = "symbol" | "file";

export interface RelationEdge {
  /** Bridged ids (§5.3) — never raw graphify slugs. */
  from: CorpusId;
  to: CorpusId;
  relation: RelationKind;
  granularity: RelationGranularity;
  confidence: number;
  sourceFile: string;
}

export interface RelationsSection {
  edges: RelationEdge[];
  /** Dead-endpoint edges dropped at build time (design §5.3 staleness policy). */
  prunedCount: number;
  /** ISO-8601 timestamp of the graphify snapshot the edges were sourced from. */
  sourcedAt: string;
}

// -----------------------------------------------------------------------------
// changelog — one-pass git derivation, symbol-keyed (design §5.4).
// -----------------------------------------------------------------------------

export interface ChangelogEntry {
  commit: string;
  date: string;
  subject: string;
  /** From conventional-commit `!` / `BREAKING CHANGE` markers. */
  breaking: boolean;
}

export interface ChangelogSection {
  /** Empty ({}) until the first post-plan `docs-v*` tag exists (design §5.4 seed). */
  bySymbol: Record<SymbolId, ChangelogEntry[]>;
}

// -----------------------------------------------------------------------------
// glossary — the FE-3003 corpus slice (design §5.5). Source: glossary.yaml.
// -----------------------------------------------------------------------------

export interface GlossaryReferent {
  type: "symbol" | "guide" | "adr" | "example";
  /** Must resolve in `corpus.index`; drift-checked by gate:symbols (3003-AC2). */
  id: CorpusId;
}

export interface GlossaryTerm {
  /** Canonical name, e.g. "basket". */
  term: string;
  kind: "domain" | "system";
  /** e.g. ["cart"]. */
  aliases: string[];
  /** One short paragraph, register per docs-writing.md. */
  definition: string;
  referents: GlossaryReferent[];
}

export interface GlossarySection {
  terms: Record<TermSlug, GlossaryTerm>;
}

// -----------------------------------------------------------------------------
// index — one flat lookup (design §5.6).
// -----------------------------------------------------------------------------

export interface IndexEntry {
  kind: CorpusKind;
  /** Repo-relative source path, or the emitted route for pure-index entries. */
  path: string;
  /** Owning module where meaningful, else "". */
  module: string;
  title: string;
}
