/**
 * @module scenarios/__tests__/playground-vocabulary.spec
 * @description The colour + i18n vocabulary gate (T1.3), widened by T2.6 to
 * `app/** + modules/**`. Six offender classes, one case each, so a red run
 * names the class rather than the file: raw Tailwind palette utility ·
 * shadcn alias · `#`/`[` colour literal · inline `style` z-index · bare
 * English text node or English `title`/`aria-label`/`placeholder` ·
 * hand-written ring constant.
 *
 * Rulings: `S4` (token colours only), `S21` (every rendered string is an i18n
 * key), `AC1.5`, `AC10.2`, `AC10.4`, `G10`, `ESC2` (the ring vocabulary is
 * APPLIED through the package's own composable, never re-spelt), `ESC3`
 * (stacking is the primitive's portal, never a number).
 *
 * Falsifiability is `vocabulary-blind.must-fail.patch`, which plants one
 * offender of each class; `SCANNED_ROOTS` is what T6.2 (the whole playground)
 * widens next.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { filter, flatMap, map, reject, some, sortBy, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const PLAYGROUND_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

const SCANNED_ROOTS = ["app", "modules"];

const SKIPPED_DIRS = new Set(["__tests__", "node_modules", ".nuxt", "dist"]);

const SOURCE_EXTENSIONS = /\.(?:ts|vue)$/;

const PALETTE_UTILITY =
  /\b(?:bg|text|border|ring|outline|from|to|via|fill|stroke|divide|shadow|decoration|caret|placeholder)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;

const SHADCN_ALIAS =
  /\b(?:bg-card|text-card-foreground|border-border|bg-muted|text-muted-foreground|bg-popover|text-popover-foreground|bg-background|text-foreground|border-input|ring-ring|bg-accent|text-accent-foreground)(?![\w-])/g;

const COLOUR_LITERAL =
  /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-zA-Z])|-\[[^\]\n]*(?:#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|oklch\()[^\]\n]*\]/g;

const INLINE_Z_INDEX = /:?style\s*=\s*["'][^"']*z-?[Ii]ndex/g;

const ENGLISH_ATTRIBUTE =
  /(?<![:\w-])(?:title|aria-label|placeholder)\s*=\s*"[^"]*[A-Za-z]{2}[^"]*"/g;

// A character entity is punctuation, not copy — `S21` governs rendered
// STRINGS, and `&mdash;` reads the same in every locale. Its NAME is letters,
// so without masking it the class-5 scan lands the entity as English.
const CHARACTER_ENTITY = /&(?:#\d+|#x[0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*);/g;

// Utility LITERALS only. An identifier alternative (`[Rr]ingClasses`) also
// matched the package's own exported names, which is the lawful consumption
// ESC2 asks for — so the gate red on the fix. Re-spelling the vocabulary always
// writes the literal out, which is what this catches.
const HAND_WRITTEN_RING = /\bring-\d\b|\bring-offset|\boutline-\d\b/g;

/**
 * The S21 offenders standing on HEAD inside the widened scope, recorded
 * 2026-08-12 by exact file + exact text so the gate is green on HEAD without
 * going blind to a new one. Debt, not a licence: `owner` is the task that
 * converts the string, an entry whose source is fixed reds the staleness case
 * below and must be deleted, and T6.2 (`AC10.4`, tree-wide) empties the list.
 */
const KNOWN_HEAD_STRINGS = [
  {
    file: "app/components/Footer.vue",
    text: "Australia’s largest and most experienced domain name registrar, with accreditation for Australian and international names.",
    owner: "T6.2"
  },
  { file: "app/components/Footer.vue", text: "Facebook", owner: "T6.2" },
  { file: "app/components/Footer.vue", text: "Footer", owner: "T6.2" },
  { file: "app/components/Footer.vue", text: "OK", owner: "T6.2" },
  {
    file: "app/components/Footer.vue",
    text: "Our website uses cookies for essential functions, analytics, and advertising. By clicking 'Accept', you consent to our",
    owner: "T6.2"
  },
  { file: "app/components/Footer.vue", text: "Powered by", owner: "T6.2" },
  { file: "app/components/Footer.vue", text: "Preferences", owner: "T6.2" },
  { file: "app/components/Footer.vue", text: "Upmind", owner: "T6.2" },
  { file: "app/components/Footer.vue", text: "We use cookies", owner: "T6.2" },
  { file: "app/components/Footer.vue", text: "Webcentral", owner: "T6.2" },
  { file: "app/components/Footer.vue", text: "and data use.", owner: "T6.2" },
  { file: "app/components/Footer.vue", text: "cookie policy", owner: "T6.2" },
  {
    file: "app/components/Footer.vue",
    text: "© 2025 Webcentral. All rights reserved.",
    owner: "T6.2"
  },
  { file: "app/error.vue", text: "Go Home", owner: "T6.2" },
  {
    file: "app/pages/auth/transfer.vue",
    text: "Session Transfer",
    owner: "T6.2"
  },
  { file: "app/pages/index.vue", text: "Composables", owner: "T6.2" },
  { file: "app/pages/index.vue", text: "Getting Started", owner: "T6.2" },
  {
    file: "app/pages/index.vue",
    text: 'placeholder="Filter composables"',
    owner: "T6.2"
  },
  {
    file: "app/pages/index.vue",
    text: 'title="Nothing matches"',
    owner: "T6.2"
  },
  {
    file: "app/pages/useAuth/[...scopeSuffix].vue",
    text: "Test the unified auth machine: login, register, recover, and 2FA flows.",
    owner: "T6.2"
  },
  {
    file: "app/pages/useAuth/[...scopeSuffix].vue",
    text: "useAuth Composable Playground",
    owner: "T6.2"
  },
  {
    file: "app/pages/useAuth/logged-out.vue",
    text: "Login Again",
    owner: "T6.2"
  },
  {
    file: "app/pages/useAuth/logged-out.vue",
    text: "Successfully Logged Out",
    owner: "T6.2"
  },
  {
    file: "app/pages/useAuth/logged-out.vue",
    text: "You have been securely logged out of your session.",
    owner: "T6.2"
  }
];

type Offence = { at: string; file: string; found: string };

function sourceFiles(): string[] {
  const walk = (dir: string): string[] =>
    flatMap(readdirSync(dir), entry => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        return SKIPPED_DIRS.has(entry) ? [] : walk(full);
      }
      return SOURCE_EXTENSIONS.test(entry) ? [full] : [];
    });

  return flatMap(SCANNED_ROOTS, root => walk(join(PLAYGROUND_ROOT, root)));
}

const FILES = sourceFiles();

function at(file: string, text: string, index: number): string {
  const line = text.slice(0, index).split("\n").length;
  return `${relative(PLAYGROUND_ROOT, file)}:${line}`;
}

const squash = (text: string): string => text.trim().replace(/\s+/g, " ");

function offences(pattern: RegExp): Offence[] {
  return flatMap(FILES, file => {
    const text = readFileSync(file, "utf-8");
    return map([...text.matchAll(pattern)], match => ({
      at: at(file, text, match.index ?? 0),
      file: relative(PLAYGROUND_ROOT, file),
      found: squash(match[0])
    }));
  });
}

/** Text nodes of a `.vue` template, mustaches and comments removed. */
function templateTextNodes(): Offence[] {
  // Everything outside the scan is blanked rather than sliced away, so a match
  // index still resolves to its real line.
  const blank = (match: string): string => match.replace(/[^\n]/g, " ");

  return flatMap(
    filter(FILES, file => file.endsWith(".vue")),
    file => {
      const text = readFileSync(file, "utf-8");
      const opens = text.indexOf("<template>");
      const closes = text.lastIndexOf("</template>");
      if (opens === -1 || closes === -1) return [];

      const masked =
        blank(text.slice(0, opens)) +
        text
          .slice(opens, closes)
          .replace(/<!--[\s\S]*?-->/g, blank)
          .replace(/\{\{[\s\S]*?\}\}/g, blank)
          .replace(CHARACTER_ENTITY, blank) +
        blank(text.slice(closes));

      return map(
        filter([...masked.matchAll(/>([^<>{}]*)</g)], match =>
          /[A-Za-z]{2}/.test(match[1])
        ),
        match => ({
          at: at(file, masked, match.index ?? 0),
          file: relative(PLAYGROUND_ROOT, file),
          found: squash(match[1])
        })
      );
    }
  );
}

const englishStrings = (): Offence[] => [
  ...templateTextNodes(),
  ...offences(ENGLISH_ATTRIBUTE)
];

// -----------------------------------------------------------------------------

describe("T1.3 vocabulary gate — the scope it walks", () => {
  it("reads every source file under the scanned roots", () => {
    expect(FILES.length).toBeGreaterThan(0);
    expect(some(FILES, file => file.endsWith(".vue"))).toBe(true);
    expect(some(FILES, file => file.includes("__tests__"))).toBe(false);
  });

  it("walks BOTH widened roots — app and modules (T2.6)", () => {
    const walked = uniq(
      map(FILES, file => relative(PLAYGROUND_ROOT, file).split("/")[0])
    );

    expect(sortBy(walked)).toStrictEqual(["app", "modules"]);
  });
});

describe("T1.3 colour vocabulary — token values only (S4 · G10 · AC10.2)", () => {
  it("class 1 — no raw Tailwind palette utility", () => {
    expect(offences(PALETTE_UTILITY)).toStrictEqual([]);
  });

  it("class 2 — no shadcn alias", () => {
    expect(offences(SHADCN_ALIAS)).toStrictEqual([]);
  });

  it("class 3 — no `#` or `[` colour literal", () => {
    expect(offences(COLOUR_LITERAL)).toStrictEqual([]);
  });

  it("class 4 — no inline `style` z-index (ESC3)", () => {
    expect(offences(INLINE_Z_INDEX)).toStrictEqual([]);
  });

  it("class 6 — no hand-written ring constant (ESC2)", () => {
    expect(offences(HAND_WRITTEN_RING)).toStrictEqual([]);
  });

  it("class 6 tells the lawful ESC2 composable from a re-spelling", () => {
    const matches = (source: string): string[] =>
      map([...source.matchAll(HAND_WRITTEN_RING)], match => match[0]);

    expect(
      matches('import { useInvalidRing } from "@upmind/ui";')
    ).toStrictEqual([]);
    expect(
      matches("const rowRing = useInvalidRing(styles.row);")
    ).toStrictEqual([]);
    expect(
      matches('const rowRing = "ring-2 ring-offset-2 ring-danger";')
    ).toStrictEqual(["ring-2", "ring-offset"]);
  });
});

describe("T1.3 i18n vocabulary — every rendered string is a key (S21 · AC10.4)", () => {
  it("class 5 — no bare English text node, and no English title/aria-label/placeholder", () => {
    const quarantined = ({ file, found }: Offence): boolean =>
      some(
        KNOWN_HEAD_STRINGS,
        known => known.file === file && known.text === found
      );

    expect(reject(englishStrings(), quarantined)).toStrictEqual([]);
  });

  it("class 5 masks a character entity without going blind to copy beside it", () => {
    const masked = (source: string): string =>
      source.replace(CHARACTER_ENTITY, match => match.replace(/[^\n]/g, " "));

    expect(squash(masked("&mdash;"))).toBe("");
    expect(squash(masked("&#8212; &#x2014; &nbsp;"))).toBe("");
    expect(squash(masked("No value &mdash; yet"))).toBe("No value yet");
  });

  it("the HEAD quarantine list carries no stale entry", () => {
    const live = englishStrings();

    expect(
      reject(KNOWN_HEAD_STRINGS, known =>
        some(
          live,
          ({ file, found }) => known.file === file && known.text === found
        )
      )
    ).toStrictEqual([]);
  });
});
