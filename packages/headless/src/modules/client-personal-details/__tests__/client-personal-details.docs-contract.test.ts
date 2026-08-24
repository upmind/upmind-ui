// -----------------------------------------------------------------------------
/**
 * @fileoverview AC-62 — the glossary and the module docs already agree;
 * this proves it rather than narrating it
 *
 * ## Job To Be Done
 * `client-personal-details.feature:233`'s `@todo` waited on the Docs stage
 * adding "custom field" / "personal details" to `docs/corpus/glossary.yaml`.
 * Both terms are already there (`design.md` §5) — only the proving spec was
 * missing. This is that spec: it asserts both terms resolve, `profile` is an
 * alias of `personal details`, and the documented `custom_fields` save body
 * is a code-keyed object, never a list.
 *
 * ## What Breaks If This Fails
 * A future glossary edit silently drops a term or its alias, or the module
 * docs drift to describing the save body as a list — either would make the
 * documented contract disagree with what the module actually sends
 * (`gotchas.md` §1).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const GLOSSARY_FILE = join(
  import.meta.dirname,
  "../../../../../../docs/corpus/glossary.yaml"
);

const GOTCHAS_FILE = join(import.meta.dirname, "../docs/gotchas.md");
const FOUNDATION_FILE = join(import.meta.dirname, "../docs/foundation.md");

/**
 * Extracts one top-level YAML block (`key:` through the line before the next
 * top-level key) as raw text. No YAML parser dependency exists in this
 * package — the corpus is block-style and stable enough for a scoped
 * substring read, the same altitude `playground-admin-removed.test.ts`
 * already reads plain text at.
 */
function glossaryBlock(source: string, key: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex(line => line.startsWith(`${key}:`));
  if (start === -1) return "";

  const rest = lines.slice(start + 1);
  const end = rest.findIndex(line => /^\S/.test(line));
  return lines
    .slice(start, end === -1 ? lines.length : start + 1 + end)
    .join("\n");
}

// -----------------------------------------------------------------------------

describe("client-personal-details glossary and documented write shape — AC-62", () => {
  it('AC-62 "custom field" resolves to one documented term', () => {
    const block = glossaryBlock(
      readFileSync(GLOSSARY_FILE, "utf-8"),
      "custom-field"
    );

    expect(block).toMatch(/term:\s*custom field\b/);
  });

  it('AC-62 "personal details" resolves to one documented term, with "profile" as an alias', () => {
    const block = glossaryBlock(
      readFileSync(GLOSSARY_FILE, "utf-8"),
      "personal-details"
    );

    expect(block).toMatch(/term:\s*personal details\b/);
    expect(block).toMatch(/aliases:\s*\[[^\]]*\bprofile\b[^\]]*\]/);
  });

  it("AC-62 the documented custom_fields save body is a code-keyed object, never a list", () => {
    const gotchas = readFileSync(GOTCHAS_FILE, "utf-8");
    const foundation = readFileSync(FOUNDATION_FILE, "utf-8");

    expect(gotchas).toMatch(/"custom_fields":\s*\{\s*"age":\s*null\s*\}/);
    expect(foundation).toMatch(/custom_fields\?:\s*Record<string,\s*unknown>/);
    expect(foundation).not.toMatch(/custom_fields\?:\s*(unknown\[\]|Array<)/);
  });
});
