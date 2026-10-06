#!/usr/bin/env node
// docs/corpus/gates/gate-prose.mjs — the docs prose and shape gate.
//
// One gate for the mechanical docs rules (ruling G3, "lint first"; STE ruling,
// contradiction 10). The repo has no Markdown linter. The sibling gates in this
// folder are plain node ESM with a selftest, so this gate follows them and adds
// no dependency. Each check is a rule in the RULES table below, with one id.
//
// RULES (backlog id -> rule id)
//   L1  ste-sentence-length     a sentence over 25 words, or an imperative over 20
//   L2  no-semicolon, no-shall  a ";" or "shall" in prose
//   L3  paragraph-length        a paragraph of more than six sentences
//   L4  sdd-word-list           an unapproved word in docs/sdd, with its alternative
//   L5  filler-word             basically, simply, just, obviously
//   L6  persona-callout         a persona callout outside README, guide and learn docs
//   L7  module-docs-scope       a module doc names a playground, labs or an app path
//   L8  json-parses             a ```json fence that does not parse
//   L9  link-resolves           a relative link to a missing file
//   L10 readme-sections         a module docs/README.md out of template order
//   L11 quickstart-length       a Quick Start fence of more than 10 lines
//   L12 architecture-sections   docs/architecture.md out of template order
//   L13 gotchas-shape           a gotcha without a wrong and a right code fence
//   L14 changelog-format        Keep a Changelog headings; a module has a changelog
//   L15 guide-sections          a guide out of the template order
//   L16 guide-name              a guide file name; a guides folder without an index
//   L17 audit-name              a docs/audit file name
//   L18 sdd-empty-section       an empty SDD section
//   L19 requirements-no-how     a URL or a file path in requirements.md
//   L20 ac-ears-must            an acceptance criterion without EARS and "must"
//   L21 sdd-citation            a path:line citation outside receipts.md
//   L22 foundation-sections     foundation.md out of template order, or n/a filler
//   L23 core-concepts-count     Core concepts with fewer than 3 or more than 6 bullets
//   L24 operations-rows         an Operations table of more than 12 rows
//   L25 endpoint-entry          an endpoint entry that lacks a part
//   L27 flow-form               a sequenceDiagram, a non-TD chart, more than 7 flows,
//                               a flow without its two lead-ins
//   L28 state-model-words       an orchestration word under State model
//   L29 foundation-process      SDD or process vocabulary in foundation.md
//   L30 foundation-prescriptive a prescriptive phrase in foundation.md
//   L31 client-bag-note         the client-only bag note twice, or the bag key elsewhere
//   L32 framework-words         a stack word in reference, ADR and foundation docs
//   L37 fence-language          a fence with no language tag
//
// NOT HERE (need the code, so they extend gate-symbols, not this gate): L26, L33,
// L34, L35, L36. A planned half of L17 (a change that edits an existing audit
// file) needs git history and is not checked.
//
// BASELINE. The repo has existing hits. `gate-prose.baseline.json` holds the
// count of each rule in each file, like eslint-suppressions.json. A count over its
// baseline is a finding. A count under it prints a stale note and passes. A new
// file has no baseline. `--update-baseline` rewrites the file from the tree.
//
// Contract:
//   node docs/corpus/gates/gate-prose.mjs                     (the real checkout)
//   node docs/corpus/gates/gate-prose.mjs --root <dir>        (a fixture tree)
//   node docs/corpus/gates/gate-prose.mjs --baseline <file>   (explicit baseline)
//   node docs/corpus/gates/gate-prose.mjs --config <file>     (explicit config)
//   node docs/corpus/gates/gate-prose.mjs --no-baseline       (report every hit)
//   node docs/corpus/gates/gate-prose.mjs --update-baseline
//   Output one finding per line: `<file>:<line> — [<rule>] <reason>`. Exit 0:
//   clean. Exit 1: at least one finding. Fail-closed: an unreadable config or
//   baseline is a finding, never a silent pass.

import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SELF = "gate:prose";
const HERE = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Parsing

const FENCE_OPEN = /^(\s*)(`{3,}|~{3,})\s*([^`\s]*)\s*(.*)$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;

/**
 * Split a Markdown file into kinds of line. A fence, a table row, a heading,
 * front matter and an HTML comment are not prose.
 */
export function parseMarkdown(text) {
  const lines = text.split(/\r?\n/);
  const kinds = new Array(lines.length).fill("prose");
  const fences = [];
  const headings = [];

  let i = 0;
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((l, n) => n > 0 && l.trim() === "---");
    if (end > 0) {
      for (let n = 0; n <= end; n += 1) kinds[n] = "front";
      i = end + 1;
    }
  }

  let open = null;
  let inComment = false;
  for (; i < lines.length; i += 1) {
    const line = lines[i];
    if (open) {
      const close = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (
        close &&
        close[1][0] === open.char &&
        close[1].length >= open.length
      ) {
        open.endLine = i + 1;
        kinds[i] = "fence";
        fences.push(open);
        open = null;
      } else {
        kinds[i] = "fence";
        open.body.push(line);
      }
      continue;
    }
    if (inComment) {
      kinds[i] = "comment";
      if (line.includes("-->")) inComment = false;
      continue;
    }
    const fence = line.match(FENCE_OPEN);
    if (fence) {
      kinds[i] = "fence";
      open = {
        char: fence[2][0],
        length: fence[2].length,
        lang: fence[3],
        startLine: i + 1,
        endLine: lines.length,
        body: []
      };
      continue;
    }
    if (line.trim().startsWith("<!--")) {
      kinds[i] = "comment";
      if (!line.includes("-->")) inComment = true;
      continue;
    }
    const heading = line.match(HEADING);
    if (heading) {
      kinds[i] = "heading";
      headings.push({
        level: heading[1].length,
        text: heading[2],
        line: i + 1
      });
      continue;
    }
    if (line.trim().startsWith("|")) {
      kinds[i] = "table";
      continue;
    }
    if (line.trim() === "") kinds[i] = "blank";
  }
  if (open) fences.push(open);

  return { lines, kinds, fences, headings };
}

/** Reduce Markdown inline syntax to plain words. A code span or a URL is one word. */
export function plain(text) {
  return text
    .replace(/<!--.*?-->/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
    .replace(/<https?:[^>]*>/g, "URL")
    .replace(/`+[^`]*`+/g, "CODE")
    .replace(/https?:\/\/\S+/g, "URL")
    .replace(/<\/?[A-Za-z][^>]*>/g, " ")
    .replace(/&[#\w]+;/g, "x")
    .replace(/[*_]{1,3}(?=\S)([^*_]*?\S)[*_]{1,3}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Prose blocks: a paragraph, a list item or a quote line group, with start line. */
export function proseBlocks(parsed) {
  const blocks = [];
  let current = null;
  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };
  parsed.lines.forEach((raw, index) => {
    const kind = parsed.kinds[index];
    if (kind !== "prose") {
      flush();
      return;
    }
    const isItem = LIST_ITEM.test(raw);
    const body = raw.replace(/^\s*>+\s?/, "").replace(LIST_ITEM, "");
    if (isItem) flush();
    if (!current) current = { line: index + 1, raw: [], isItem };
    current.raw.push(body);
  });
  flush();
  return blocks.map(block => ({ ...block, text: plain(block.raw.join(" ")) }));
}

const ABBREVIATION = /\b(e\.g|i\.e|etc|vs|cf|approx|incl|resp)\./gi;

/** A private-use mark that hides a dot from the sentence split. */
const DOT_MARK = "";

/** Split plain text into sentences. */
export function sentences(text) {
  const protectedText = text
    .replace(ABBREVIATION, m => m.replace(/\./g, DOT_MARK))
    .replace(/(\d)\.(\d)/g, `$1${DOT_MARK}$2`);
  return protectedText
    .split(/(?<=[.!?]["')\]]?)\s+(?=["'([]?[A-Z0-9])/)
    .map(s => s.replaceAll(DOT_MARK, ".").trim())
    .filter(s => /[A-Za-z0-9]/.test(s));
}

export function wordCount(sentence) {
  return sentence.split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w)).length;
}

// ---------------------------------------------------------------------------
// Scopes

const has = (rel, needle) => rel.includes(needle);
const base = rel => rel.slice(rel.lastIndexOf("/") + 1);
const isModuleDoc = rel =>
  /(^|\/)modules\/[^/]+\/(docs\/|README\.md$)/.test(rel);
const isFoundation = rel => base(rel) === "foundation.md";
const isSdd = rel => /(^|\/)docs\/sdd\//.test(rel);

function headingsOfLevel(parsed, level) {
  return parsed.headings.filter(h => h.level === level);
}

/** Check that `required` appear, in order, among the headings of one level. */
function orderFindings(parsed, level, required, label) {
  const found = [];
  const heads = headingsOfLevel(parsed, level);
  let cursor = -1;
  for (const name of required) {
    const at = heads.findIndex(
      (h, n) =>
        n > cursor && h.text.toLowerCase().startsWith(name.toLowerCase())
    );
    if (at === -1) {
      const present = heads.some(h =>
        h.text.toLowerCase().startsWith(name.toLowerCase())
      );
      found.push({
        line: 1,
        message: present
          ? `${label}: "${name}" is out of order`
          : `${label}: section "${name}" is missing`
      });
    } else {
      cursor = at;
    }
  }
  return found;
}

/** The headings of a section: its lines run to the next heading of equal or higher level. */
function sectionOf(parsed, level, name) {
  const heads = parsed.headings;
  const start = heads.findIndex(
    h =>
      h.level === level && h.text.toLowerCase().startsWith(name.toLowerCase())
  );
  if (start === -1) return null;
  const next = heads.findIndex((h, n) => n > start && h.level <= level);
  const from = heads[start].line;
  const to = next === -1 ? parsed.lines.length + 1 : heads[next].line;
  return {
    from,
    to,
    heading: heads[start],
    inner: heads.slice(start + 1, next === -1 ? undefined : next)
  };
}

function linesIn(parsed, from, to, kinds) {
  const out = [];
  for (let n = from; n < to; n += 1) {
    if (kinds.includes(parsed.kinds[n - 1]))
      out.push({ line: n, text: parsed.lines[n - 1] });
  }
  return out;
}

const AUDIT_NAME = /^[a-z0-9][a-z0-9-]*-\d{4}-\d{2}-\d{2}(?:-r\d+)?\.md$/;
const KEBAB_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const KEEP_A_CHANGELOG = new Set([
  "Added",
  "Changed",
  "Deprecated",
  "Removed",
  "Fixed",
  "Security"
]);
const EARS =
  /^(?:The\b.+\bmust\b|When\b.+\bmust\b|While\b.+\bmust\b|If\b.+\bthen\b.+\bmust\b|Where\b.+\bmust\b)/i;

function wordRegex(word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, "g");
}

// ---------------------------------------------------------------------------
// Rules. Each check receives ctx and returns [{ line, message }].

export const RULES = [
  {
    id: "ste-sentence-length",
    applies: () => true,
    check: ({ blocks, config }) => {
      const verbs = new Set(config.imperativeVerbs);
      const found = [];
      for (const block of blocks) {
        for (const sentence of sentences(block.text)) {
          const words = wordCount(sentence);
          const first = sentence
            .split(/\s+/)[0]
            .replace(/[^A-Za-z]/g, "")
            .toLowerCase();
          const imperative = verbs.has(first) && /^[A-Z]/.test(sentence);
          const limit = imperative ? 20 : 25;
          if (words > limit) {
            found.push({
              line: block.line,
              message: `${imperative ? "imperative" : "descriptive"} sentence of ${words} words (limit ${limit}): "${sentence.slice(0, 60)}..."`
            });
          }
        }
      }
      return found;
    }
  },
  {
    id: "no-semicolon",
    applies: () => true,
    check: ({ blocks }) =>
      blocks
        .filter(block => block.text.replace(/&[#\w]+;/g, "").includes(";"))
        .map(block => ({ line: block.line, message: "a semicolon in prose" }))
  },
  {
    id: "no-shall",
    applies: () => true,
    check: ({ blocks }) =>
      blocks
        .filter(block => /\bshall\b/i.test(block.text))
        .map(block => ({
          line: block.line,
          message: '"shall" in prose: use "must"'
        }))
  },
  {
    id: "paragraph-length",
    applies: () => true,
    check: ({ blocks }) =>
      blocks
        .filter(block => !block.isItem && sentences(block.text).length > 6)
        .map(block => ({
          line: block.line,
          message: `a paragraph of ${sentences(block.text).length} sentences (limit 6)`
        }))
  },
  {
    id: "sdd-word-list",
    applies: rel => isSdd(rel),
    check: ({ blocks, config }) => {
      const found = [];
      for (const block of blocks) {
        for (const [word, alternative] of Object.entries(config.sddWords)) {
          if (wordRegex(word).test(block.text.toLowerCase())) {
            found.push({
              line: block.line,
              message: `unapproved word "${word}": write "${alternative}"`
            });
          }
        }
      }
      return found;
    }
  },
  {
    id: "filler-word",
    applies: () => true,
    check: ({ blocks, config }) => {
      const found = [];
      for (const block of blocks) {
        const lowered = block.text.toLowerCase();
        for (const word of config.fillerWords) {
          if (wordRegex(word).test(lowered)) {
            found.push({ line: block.line, message: `filler word "${word}"` });
          }
        }
      }
      return found;
    }
  },
  {
    id: "persona-callout",
    applies: (rel, config) =>
      !config.personaAllowed.some(p =>
        p.startsWith("/") || p.includes("/") ? has(rel, p) : base(rel) === p
      ),
    check: ({ parsed }) => {
      const found = [];
      parsed.lines.forEach((line, index) => {
        if (
          parsed.kinds[index] === "prose" &&
          /^>\s*\*\*\S+\s+For (Developers|Testers|Contributors|Architects|Partners|Power Users)/.test(
            line
          )
        ) {
          found.push({
            line: index + 1,
            message: "a persona callout outside a README, guide or learn doc"
          });
        }
      });
      return found;
    }
  },
  {
    id: "module-docs-scope",
    applies: rel => isModuleDoc(rel),
    check: ({ parsed, config }) => {
      const found = [];
      const apps = config.appNames
        .map(a => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");
      const pattern = new RegExp(
        `\\bplaygrounds?\\b|\\blabs\\b|\\bapps/(?:${apps})\\b`,
        "i"
      );
      parsed.lines.forEach((line, index) => {
        if (parsed.kinds[index] === "fence") return;
        if (pattern.test(line)) {
          found.push({
            line: index + 1,
            message: "a module doc names a playground, a labs page or an app"
          });
        }
      });
      return found;
    }
  },
  {
    id: "json-parses",
    applies: () => true,
    check: ({ parsed }) => {
      const found = [];
      for (const fence of parsed.fences) {
        if (fence.lang.toLowerCase() !== "json") continue;
        try {
          JSON.parse(fence.body.join("\n"));
        } catch (error) {
          found.push({
            line: fence.startLine,
            message: `a json fence does not parse (${error.message.slice(0, 50)})`
          });
        }
      }
      return found;
    }
  },
  {
    id: "link-resolves",
    applies: () => true,
    check: ({ parsed, abs, root, exists }) => {
      const found = [];
      parsed.lines.forEach((line, index) => {
        if (
          parsed.kinds[index] === "fence" ||
          parsed.kinds[index] === "comment"
        )
          return;
        const withoutCode = line.replace(/`[^`]*`/g, "");
        for (const match of withoutCode.matchAll(
          /(?<!!)\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g
        )) {
          const target = match[1];
          if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) continue;
          const path = decodeURIComponent(target.split("#")[0].split("?")[0]);
          if (!path) continue;
          const resolved = path.startsWith("/")
            ? join(root, path)
            : resolve(dirname(abs), path);
          if (!exists(resolved)) {
            found.push({
              line: index + 1,
              message: `a relative link to a missing file: ${path}`
            });
          }
        }
      });
      return found;
    }
  },
  {
    id: "readme-sections",
    applies: rel => /(^|\/)modules\/[^/]+\/docs\/README\.md$/.test(rel),
    check: ({ parsed }) =>
      orderFindings(
        parsed,
        2,
        [
          "What Is This?",
          "Quick Start",
          "Features",
          "Key Concepts",
          "Documentation"
        ],
        "README"
      )
  },
  {
    id: "quickstart-length",
    applies: rel => base(rel) === "README.md",
    check: ({ parsed }) => {
      const section = sectionOf(parsed, 2, "Quick Start");
      if (!section) return [];
      const fence = parsed.fences.find(
        f => f.startLine > section.from && f.startLine < section.to
      );
      return fence && fence.body.length > 10
        ? [
            {
              line: fence.startLine,
              message: `the Quick Start fence has ${fence.body.length} lines (limit 10)`
            }
          ]
        : [];
    }
  },
  {
    id: "architecture-sections",
    applies: rel => /(^|\/)docs\/architecture\.md$/.test(rel),
    check: ({ parsed }) =>
      orderFindings(
        parsed,
        2,
        [
          "Overview",
          "State Machine",
          "Data Flow",
          "Dependencies",
          "Integration Points"
        ],
        "architecture doc"
      )
  },
  {
    id: "gotchas-shape",
    applies: rel => /(^|\/)docs\/gotchas\.md$/.test(rel),
    check: ({ parsed }) => {
      const found = [];
      const gotchas = headingsOfLevel(parsed, 2).filter(h =>
        /^\d+\.|🧪/.test(h.text)
      );
      for (const [n, head] of gotchas.entries()) {
        const end = gotchas[n + 1]?.line ?? parsed.lines.length + 1;
        const fences = parsed.fences.filter(
          f => f.startLine > head.line && f.startLine < end
        );
        const body = parsed.lines.slice(head.line, end - 1).join("\n");
        const wrong = /(?:❌|\bwrong\b|\/\/\s*bad)/i.test(body);
        const right = /(?:✅|\bright\b|\/\/\s*good)/i.test(body);
        const scenario = /\b(?:test scenario|test:|qa:)/i.test(body);
        if (fences.length < 2 || !wrong || !right) {
          found.push({
            line: head.line,
            message: `gotcha "${head.text.slice(0, 40)}" has no wrong and right code fence pair`
          });
        } else if (!scenario) {
          found.push({
            line: head.line,
            message: `gotcha "${head.text.slice(0, 40)}" has no test-scenario line`
          });
        }
      }
      return found;
    }
  },
  {
    id: "changelog-format",
    applies: rel => /(^|\/)(CHANGELOG\.md|docs\/changelog\.md)$/i.test(rel),
    check: ({ parsed }) => {
      const found = [];
      for (const h of headingsOfLevel(parsed, 2)) {
        if (!/^\[(?:Unreleased|\d+\.\d+\.\d+[^\]]*)\]/.test(h.text)) {
          found.push({
            line: h.line,
            message: `changelog heading "${h.text.slice(0, 40)}" is not [Unreleased] or [x.y.z]`
          });
        }
      }
      for (const h of headingsOfLevel(parsed, 3)) {
        if (!KEEP_A_CHANGELOG.has(h.text)) {
          found.push({
            line: h.line,
            message: `changelog group "${h.text}" is not Added, Changed, Deprecated, Removed, Fixed or Security`
          });
        }
      }
      return found;
    }
  },
  {
    id: "guide-sections",
    applies: rel =>
      /(^|\/)docs\/guides?(\/|\.md$)/.test(rel) && base(rel) !== "README.md",
    check: ({ parsed, text }) => {
      const found = orderFindings(
        parsed,
        2,
        ["What You'll Build", "Prerequisites", "Steps", "Complete Example"],
        "guide"
      );
      for (const label of ["Time", "Difficulty", "Modules used"]) {
        if (!new RegExp(`\\*\\*${label}\\*\\*`, "i").test(text)) {
          found.push({
            line: 1,
            message: `guide: the intro block lacks **${label}**`
          });
        }
      }
      if (
        !headingsOfLevel(parsed, 2).some(h =>
          /^(Variations|Next Steps)/i.test(h.text)
        )
      ) {
        found.push({
          line: 1,
          message: 'guide: a "Variations" or "Next Steps" section is missing'
        });
      }
      return found;
    }
  },
  {
    id: "guide-name",
    applies: rel => /(^|\/)docs\/guides\/[^/]+\.md$/.test(rel),
    check: ({ rel, abs, exists }) => {
      const found = [];
      const name = base(rel);
      if (name !== "README.md" && !KEBAB_FILE.test(name)) {
        found.push({
          line: 1,
          message: `guide name "${name}" is not kebab-case {action}-{outcome}.md`
        });
      }
      if (!exists(join(dirname(abs), "README.md"))) {
        found.push({
          line: 1,
          message: "the guides folder has no README.md index"
        });
      }
      return found;
    }
  },
  {
    id: "audit-name",
    applies: rel => /(^|\/)docs\/audit\/[^/]+\.md$/.test(rel),
    check: ({ rel }) =>
      AUDIT_NAME.test(base(rel))
        ? []
        : [
            {
              line: 1,
              message: `audit name "${base(rel)}" does not match {slug}-{YYYY-MM-DD}(-rN).md`
            }
          ]
  },
  {
    id: "sdd-empty-section",
    applies: rel => isSdd(rel),
    check: ({ parsed }) => {
      const found = [];
      parsed.headings.forEach((head, n) => {
        const next = parsed.headings[n + 1]?.line ?? parsed.lines.length + 1;
        const body = linesIn(parsed, head.line + 1, next, [
          "prose",
          "table",
          "fence"
        ])
          .map(l => l.text.trim())
          .join(" ")
          .trim();
        const sub =
          parsed.headings[n + 1] && parsed.headings[n + 1].level > head.level;
        if (sub) return;
        if (body === "" || /^(?:n\/a|n\.a\.?|none|tbd)\.?$/i.test(body)) {
          found.push({
            line: head.line,
            message: `section "${head.text.slice(0, 40)}" is empty: write "Not applicable." and one sentence why`
          });
        }
      });
      return found;
    }
  },
  {
    id: "requirements-no-how",
    applies: rel => isSdd(rel) && base(rel) === "requirements.md",
    check: ({ parsed }) => {
      const found = [];
      parsed.lines.forEach((line, index) => {
        if (parsed.kinds[index] !== "prose" || /Read-back:/.test(line)) return;
        if (
          /https?:\/\/|\b[\w.-]+\/[\w./-]+\.(?:ts|vue|md|json|mjs)\b/.test(line)
        ) {
          found.push({
            line: index + 1,
            message:
              "requirements say what and why: no URL or file path (put it in design.md)"
          });
        }
      });
      return found;
    }
  },
  {
    id: "ac-ears-must",
    applies: rel => isSdd(rel) && base(rel) === "requirements.md",
    check: ({ parsed }) => {
      const found = [];
      parsed.lines.forEach((line, index) => {
        const match = line.match(
          /^\s*[-*]\s*(?:\[[ x]\]\s*)?\*\*AC[\w-]*\*\*\s*(.*)$/
        );
        if (match && !EARS.test(plain(match[1]))) {
          found.push({
            line: index + 1,
            message: 'an acceptance criterion is not EARS with "must"'
          });
        }
      });
      return found;
    }
  },
  {
    id: "sdd-citation",
    applies: rel => isSdd(rel) && base(rel) !== "receipts.md",
    check: ({ parsed }) => {
      const found = [];
      parsed.lines.forEach((line, index) => {
        if (parsed.kinds[index] === "fence") return;
        if (/\b[\w./-]+\.(?:ts|vue|mjs|md|json):\d+/.test(line)) {
          found.push({
            line: index + 1,
            message: "a path:line citation: cite a receipts.md key such as [o7]"
          });
        }
      });
      return found;
    }
  },
  {
    id: "foundation-sections",
    applies: rel => isFoundation(rel),
    check: ({ parsed }) => {
      const found = [];
      if (!/^Module: \S/.test(headingsOfLevel(parsed, 1)[0]?.text ?? "")) {
        found.push({
          line: 1,
          message: 'foundation doc: the title is not "# Module: <name>"'
        });
      }
      const required = [
        "What it is",
        "Operations",
        "Data shape",
        "Dependencies",
        "API endpoints",
        "Lessons"
      ];
      found.push(...orderFindings(parsed, 2, required, "foundation doc"));
      const template = [
        "What it is",
        "Core concepts",
        "State model",
        "Operations",
        "Data shape",
        "Dependencies",
        "API endpoints",
        "Failure modes",
        "Side effects",
        "Coordination",
        "Flows",
        "Lessons"
      ];
      let last = -1;
      for (const h of headingsOfLevel(parsed, 2)) {
        const at = template.findIndex(t =>
          h.text.toLowerCase().startsWith(t.toLowerCase())
        );
        if (at === -1) continue;
        if (at < last)
          found.push({
            line: h.line,
            message: `foundation doc: "${h.text.slice(0, 30)}" is out of template position`
          });
        last = Math.max(last, at);
        const section = sectionOf(parsed, 2, h.text);
        const body = linesIn(parsed, section.from + 1, section.to, [
          "prose",
          "table",
          "fence"
        ])
          .map(l => l.text.trim())
          .join(" ")
          .trim();
        if (/^(?:n\/a|n\.a\.?|none)\.?$/i.test(body)) {
          found.push({
            line: h.line,
            message: `foundation doc: section "${h.text}" is n/a filler: omit it`
          });
        }
      }
      return found;
    }
  },
  {
    id: "core-concepts-count",
    applies: rel => isFoundation(rel),
    check: ({ parsed }) => {
      const section = sectionOf(parsed, 2, "Core concepts");
      if (!section) return [];
      const bullets = linesIn(parsed, section.from + 1, section.to, [
        "prose"
      ]).filter(l => /^\s*[-*+]\s/.test(l.text)).length;
      return bullets < 3 || bullets > 6
        ? [
            {
              line: section.from,
              message: `Core concepts has ${bullets} bullets (3 to 6)`
            }
          ]
        : [];
    }
  },
  {
    id: "operations-rows",
    applies: rel => isFoundation(rel),
    check: ({ parsed }) => {
      const section = sectionOf(parsed, 2, "Operations");
      if (!section) return [];
      const rows =
        linesIn(parsed, section.from + 1, section.to, ["table"]).filter(
          l => !/^\s*\|[\s:|-]+\|\s*$/.test(l.text)
        ).length - 1;
      return rows > 12
        ? [
            {
              line: section.from,
              message: `the Operations table has ${rows} rows (limit 12)`
            }
          ]
        : [];
    }
  },
  {
    id: "endpoint-entry",
    applies: rel => isFoundation(rel),
    check: ({ parsed }) => {
      const found = [];
      const section = sectionOf(parsed, 2, "API endpoints");
      if (!section) return found;
      const entries = parsed.headings.filter(
        h => h.level === 3 && h.line > section.from && h.line < section.to
      );
      entries.forEach((head, n) => {
        const end = entries[n + 1]?.line ?? section.to;
        const method = head.text.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\S+)/);
        if (!method) return;
        const fences = parsed.fences.filter(
          f => f.startLine > head.line && f.startLine < end
        );
        const text = parsed.lines.slice(head.line, end - 1).join("\n");
        const missing = [];
        if (method[2].startsWith("/api/"))
          missing.push("a URL without the /api/ prefix");
        const curl = fences.find(f => /\bcurl\b/.test(f.body.join("\n")));
        if (
          !curl ||
          !/\$API\b/.test(curl.body.join("\n")) ||
          !/\$ACCESS_TOKEN\b/.test(curl.body.join("\n"))
        ) {
          missing.push("a curl with $API and $ACCESS_TOKEN");
        }
        if (!fences.some(f => f.lang.toLowerCase() === "json"))
          missing.push("a sample response");
        if (!/fixture/i.test(text)) missing.push("a fixture name");
        if (
          ["POST", "PUT", "PATCH"].includes(method[1]) &&
          !/request\s*body|RequestBody|Body\b/i.test(text)
        ) {
          missing.push("a request body shape");
        }
        if (missing.length > 0)
          found.push({
            line: head.line,
            message: `endpoint "${head.text.slice(0, 40)}" lacks ${missing.join(", ")}`
          });
      });
      return found;
    }
  },
  {
    id: "flow-form",
    applies: rel => isFoundation(rel),
    check: ({ parsed }) => {
      const found = [];
      const section = sectionOf(parsed, 2, "Flows");
      if (!section) return found;
      const flows = parsed.headings.filter(
        h => h.level === 3 && h.line > section.from && h.line < section.to
      );
      if (flows.length > 7)
        found.push({
          line: section.from,
          message: `${flows.length} flows (limit 7)`
        });
      flows.forEach((head, n) => {
        const end = flows[n + 1]?.line ?? section.to;
        const text = parsed.lines.slice(head.line, end - 1).join("\n");
        if (!text.includes("Guarantees the platform holds:"))
          found.push({
            line: head.line,
            message: `flow "${head.text.slice(0, 30)}" lacks the "Guarantees the platform holds:" lead-in`
          });
        if (!text.includes("Constraints the caller has to plan around:"))
          found.push({
            line: head.line,
            message: `flow "${head.text.slice(0, 30)}" lacks the "Constraints the caller has to plan around:" lead-in`
          });
        if (linesIn(parsed, head.line + 1, end, ["heading"]).length > 0) {
          found.push({
            line: head.line,
            message: `flow "${head.text.slice(0, 30)}" uses sub-headings for its lead-ins`
          });
        }
      });
      for (const fence of parsed.fences) {
        if (
          fence.lang.toLowerCase() !== "mermaid" ||
          fence.startLine < section.from ||
          fence.startLine > section.to
        )
          continue;
        const first = fence.body.find(l => l.trim() !== "")?.trim() ?? "";
        if (/^sequenceDiagram\b/.test(first))
          found.push({
            line: fence.startLine,
            message: "a sequenceDiagram: use flowchart TD"
          });
        else if (!/^flowchart\s+TD\b/.test(first))
          found.push({
            line: fence.startLine,
            message: "a flow chart that is not flowchart TD"
          });
      }
      return found;
    }
  },
  {
    id: "state-model-words",
    applies: rel => isFoundation(rel),
    check: ({ parsed, config }) => {
      const section = sectionOf(parsed, 2, "State model");
      if (!section) return [];
      const found = [];
      for (const { line, text } of linesIn(
        parsed,
        section.from + 1,
        section.to,
        ["prose", "table"]
      )) {
        for (const word of config.stateModelWords) {
          if (wordRegex(word).test(text.toLowerCase()))
            found.push({
              line,
              message: `orchestration word "${word}" under State model`
            });
        }
      }
      return found;
    }
  },
  {
    id: "foundation-process",
    applies: rel => isFoundation(rel),
    check: ({ parsed, config }) => {
      const found = [];
      const patterns = [...config.processTokens, config.trackerIdPattern].map(
        p => new RegExp(p)
      );
      parsed.lines.forEach((line, index) => {
        if (
          parsed.kinds[index] === "fence" ||
          parsed.kinds[index] === "comment"
        )
          return;
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match)
            found.push({
              line: index + 1,
              message: `process vocabulary "${match[0]}" in a foundation doc`
            });
        }
      });
      return found;
    }
  },
  {
    id: "foundation-prescriptive",
    applies: rel => isFoundation(rel),
    check: ({ parsed, config }) => {
      const found = [];
      parsed.lines.forEach((line, index) => {
        if (parsed.kinds[index] === "fence") return;
        for (const phrase of config.prescriptivePhrases) {
          if (line.toLowerCase().includes(phrase))
            found.push({
              line: index + 1,
              message: `prescriptive phrase "${phrase}"`
            });
        }
      });
      return found;
    }
  },
  {
    id: "client-bag-note",
    applies: rel => isFoundation(rel),
    check: ({ parsed, config }) => {
      const found = [];
      const notes = parsed.lines
        .map((line, index) => ({ line: index + 1, text: line }))
        .filter(l =>
          /^\*[^*].*client-only|^\*.*UI-workaround bag.*\*$/i.test(
            l.text.trim()
          )
        );
      if (notes.length > 1)
        found.push({
          line: notes[1].line,
          message: "the client-only bag note appears more than once"
        });
      if (config.clientBagKey) {
        const key = new RegExp(`\\b${config.clientBagKey}\\b`);
        parsed.lines.forEach((line, index) => {
          if (key.test(line) && !notes.some(n => n.line === index + 1)) {
            found.push({
              line: index + 1,
              message: `the client-only bag key "${config.clientBagKey}" appears outside the note`
            });
          }
        });
      }
      return found;
    }
  },
  {
    id: "framework-words",
    applies: rel =>
      isFoundation(rel) || /(^|\/)docs\/(reference|adr)\//.test(rel),
    check: ({ parsed, config }) => {
      const found = [];
      parsed.lines.forEach((line, index) => {
        if (
          parsed.kinds[index] === "fence" ||
          parsed.kinds[index] === "comment"
        )
          return;
        for (const word of config.frameworkWords) {
          const pattern = word.startsWith(".")
            ? new RegExp(word.replace(/[.(]/g, "\\$&"))
            : new RegExp(`(?<![\\w/-])${word}(?![\\w-])`);
          if (pattern.test(line))
            found.push({ line: index + 1, message: `stack word "${word}"` });
        }
      });
      return found;
    }
  },
  {
    id: "fence-language",
    applies: () => true,
    check: ({ parsed }) =>
      parsed.fences
        .filter(f => f.lang === "")
        .map(f => ({
          line: f.startLine,
          message: "a code fence with no language tag"
        }))
  }
];

// ---------------------------------------------------------------------------
// Walk and run

/** The Markdown files of a git checkout (tracked and not ignored), else null. */
function gitFiles(root, config) {
  if (!existsSync(join(root, ".git"))) return null;
  const run = spawnSync(
    "git",
    [
      "-C",
      root,
      "ls-files",
      "-z",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      "*.md"
    ],
    {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024
    }
  );
  if (run.status !== 0) return null;
  return run.stdout
    .split("\0")
    .filter(rel => rel && existsSync(join(root, rel)))
    .filter(rel => !config.ignoreFileNames.includes(base(rel)))
    .filter(rel => !config.ignorePaths.some(p => rel.startsWith(p)))
    .filter(
      rel =>
        !rel.split("/").some(segment => config.ignoreDirNames.includes(segment))
    )
    .sort();
}

function walk(root, config) {
  const fromGit = gitFiles(root, config);
  if (fromGit) return fromGit;
  const out = [];
  const visit = dir => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const rel = relative(root, abs).split(sep).join("/");
      let stats;
      try {
        stats = statSync(abs);
      } catch {
        continue;
      }
      if (stats.isDirectory()) {
        if (config.ignoreDirNames.includes(name)) continue;
        if (config.ignorePaths.some(p => `${rel}/`.startsWith(p))) continue;
        visit(abs);
      } else if (name.endsWith(".md")) {
        if (config.ignoreFileNames.includes(name)) continue;
        if (config.ignorePaths.some(p => rel.startsWith(p))) continue;
        out.push(rel);
      }
    }
  };
  visit(root);
  return out.sort();
}

/** Every finding of every rule over the tree, as { file, line, rule, message }. */
export function collect(root, config) {
  const findings = [];
  const exists = path => existsSync(path);
  for (const rel of walk(root, config)) {
    const abs = join(root, rel);
    const text = readFileSync(abs, "utf8");
    const parsed = parseMarkdown(text);
    const blocks = proseBlocks(parsed);
    const ctx = { rel, abs, root, text, parsed, blocks, config, exists };
    for (const rule of RULES) {
      if (!rule.applies(rel, config)) continue;
      for (const finding of rule.check(ctx)) {
        findings.push({
          file: rel,
          line: finding.line,
          rule: rule.id,
          message: finding.message
        });
      }
    }
  }
  // Module docs folders carry a changelog.
  for (const rel of walk(root, config)) {
    const match = rel.match(/^(.*\/modules\/[^/]+)\/docs\/README\.md$/);
    if (!match) continue;
    const docs = join(root, match[1], "docs");
    if (
      !exists(join(docs, "CHANGELOG.md")) &&
      !exists(join(docs, "changelog.md")) &&
      !exists(join(root, match[1], "CHANGELOG.md"))
    ) {
      findings.push({
        file: `${match[1]}/docs/CHANGELOG.md`,
        line: 1,
        rule: "changelog-format",
        message: "a module has a changelog"
      });
    }
  }
  return findings;
}

export function countByFile(findings) {
  const counts = {};
  for (const f of findings) {
    counts[f.file] ??= {};
    counts[f.file][f.rule] = (counts[f.file][f.rule] ?? 0) + 1;
  }
  return counts;
}

function sortedBaseline(counts) {
  const out = {};
  for (const file of Object.keys(counts).sort()) {
    out[file] = {};
    for (const rule of Object.keys(counts[file]).sort())
      out[file][rule] = counts[file][rule];
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const option = name => {
    const at = args.indexOf(name);
    return at === -1 ? null : args[at + 1];
  };
  const repoRoot = resolve(HERE, "..", "..", "..");
  const root = option("--root") ? resolve(option("--root")) : repoRoot;
  const configPath = option("--config") ?? join(HERE, "gate-prose.config.json");
  const baselinePath =
    option("--baseline") ??
    join(root === repoRoot ? HERE : root, "gate-prose.baseline.json");

  let config;
  try {
    config = JSON.parse(
      readFileSync(
        isAbsolute(configPath) ? configPath : resolve(configPath),
        "utf8"
      )
    );
  } catch (error) {
    console.log(`config — [${SELF}] unreadable config: ${error.message}`);
    process.exit(1);
  }

  const findings = collect(root, config);
  const counts = countByFile(findings);

  if (args.includes("--update-baseline")) {
    writeFileSync(
      baselinePath,
      `${JSON.stringify(sortedBaseline(counts), null, 2)}\n`
    );
    console.log(
      `[${SELF}] baseline written: ${findings.length} hits in ${Object.keys(counts).length} files -> ${relative(process.cwd(), baselinePath)}`
    );
    process.exit(0);
  }

  let baseline = {};
  if (!args.includes("--no-baseline") && existsSync(baselinePath)) {
    try {
      baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
    } catch (error) {
      console.log(
        `${relative(process.cwd(), baselinePath)} — [${SELF}] unreadable baseline: ${error.message}`
      );
      process.exit(1);
    }
  }

  let failures = 0;
  let stale = 0;
  let baselined = 0;
  for (const [file, rules] of Object.entries(counts)) {
    for (const [rule, count] of Object.entries(rules)) {
      const allowed = baseline[file]?.[rule] ?? 0;
      baselined += Math.min(count, allowed);
      if (count > allowed) {
        const hits = findings.filter(f => f.file === file && f.rule === rule);
        // The first `allowed` hits are the baselined ones. Report the rest.
        for (const hit of hits.slice(allowed)) {
          console.log(`${hit.file}:${hit.line} — [${hit.rule}] ${hit.message}`);
          failures += 1;
        }
      } else if (count < allowed) {
        stale += allowed - count;
      }
    }
  }
  for (const [file, rules] of Object.entries(baseline)) {
    for (const [rule, allowed] of Object.entries(rules)) {
      if (!counts[file]?.[rule]) stale += allowed;
    }
  }

  const note =
    stale > 0
      ? `, ${stale} stale baseline hits (run --update-baseline to prune)`
      : "";
  if (failures > 0) {
    console.log(
      `[${SELF}] RED — ${failures} new findings, ${baselined} baselined${note}.`
    );
    process.exit(1);
  }
  console.log(
    `[${SELF}] GREEN — no new findings, ${baselined} baselined${note}.`
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();
