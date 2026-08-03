import { SCENARIO_JSDOC_TAG, TAG_KIND } from "./tags.types";
import type { PlaygroundTag, PlaygroundTagMap } from "./tags.types";

const JSDOC_BLOCK = /\/\*\*([\s\S]*?)\*\//g;

// Anchored to a doc-comment line's own leading `*`/whitespace (no `m`-flag
// mid-line match is possible) and terminated by a whitespace/end-of-line
// lookahead, so a tag counts ONLY as the first token of its own line — a
// prose mention mid-sentence ("an @scenario-exclude member") or a
// prefix-extended token ("@scenario-excludes-nothing") never matches.
// `reason` (group 2) is the remainder of that SAME line only; a reason
// written on a following doc-comment line is not picked up.
const TAG_LINE = new RegExp(
  `^[ \\t]*\\*?[ \\t]*(${SCENARIO_JSDOC_TAG.INCLUDE}|${SCENARIO_JSDOC_TAG.EXCLUDE})(?=[ \\t]|$)([^\\r\\n]*)`,
  "m"
);

// Modifier/keyword tokens that can sit between a doc block and the member
// identifier it documents (`export async function login(…)`, a generator
// method `async *streamThing() {}`, plain object-property shorthand
// `login: (…) => …`, etc.).
const MEMBER_NAME =
  /^\s*(?:export\s+|default\s+|async\s+|function\s+|const\s+|let\s+|var\s+|public\s+|private\s+|protected\s+|readonly\s+|static\s+|declare\s+|override\s+|abstract\s+|get\s+|set\s+|\*\s*)*([A-Za-z_$][\w$]*)/;

// A token that MEMBER_NAME's modifier alternation failed to consume (an
// unenumerated modifier, or a bare keyword with nothing real following it)
// falls through and gets captured as if it were the member name itself.
// Rejecting every one of these tokens as a candidate member turns that
// backtrack into a dropped association (no tag) rather than a wrong one.
const RESERVED_MEMBER_TOKENS = new Set([
  "export",
  "default",
  "async",
  "function",
  "const",
  "let",
  "var",
  "public",
  "private",
  "protected",
  "readonly",
  "static",
  "declare",
  "override",
  "abstract",
  "get",
  "set",
  "import",
  "type",
  "interface",
  "class",
  "enum",
  "namespace",
  "module"
]);

function resolveMemberName(sourceAfterBlock: string): string | undefined {
  const memberMatch = MEMBER_NAME.exec(sourceAfterBlock);
  if (!memberMatch) return undefined;

  const candidate = memberMatch[1];
  return RESERVED_MEMBER_TOKENS.has(candidate) ? undefined : candidate;
}

/**
 * Parses `@scenario-include`/`@scenario-exclude` JSDoc tags out of a
 * module's source text — plain regex/line scanning over source text, no TS
 * compiler dependency. Each tag is associated with the identifier
 * immediately following its doc block; a doc block followed by anything else
 * (a blank line into another comment, an unresolved modifier) associates
 * with nothing rather than the wrong member. Accumulates into a
 * null-prototype map so an own `__proto__`/`constructor`/`prototype` member
 * name can never pollute the returned map's prototype chain.
 */
export function parsePlaygroundTags(sourceText: string): PlaygroundTagMap {
  const tags: Record<string, PlaygroundTag> = Object.create(null);

  for (const block of sourceText.matchAll(JSDOC_BLOCK)) {
    const tagMatch = TAG_LINE.exec(block[1]);
    if (!tagMatch) continue;

    const blockEnd = (block.index ?? 0) + block[0].length;
    const memberName = resolveMemberName(sourceText.slice(blockEnd));
    if (!memberName) continue;

    const reason = tagMatch[2].trim();

    tags[memberName] =
      tagMatch[1] === SCENARIO_JSDOC_TAG.EXCLUDE
        ? reason.length > 0
          ? { kind: TAG_KIND.EXCLUDE, reason }
          : { kind: TAG_KIND.EXCLUDE }
        : { kind: TAG_KIND.INCLUDE };
  }

  return tags;
}
