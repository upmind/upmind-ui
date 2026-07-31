import { PLAYGROUND_JSDOC_TAG } from "./tags.types";
import type { PlaygroundTag, PlaygroundTagMap } from "./tags.types";

const JSDOC_BLOCK = /\/\*\*([\s\S]*?)\*\//g;
const TAG_LINE = new RegExp(
  `(${PLAYGROUND_JSDOC_TAG.INCLUDE}|${PLAYGROUND_JSDOC_TAG.EXCLUDE})([^\r\n]*)`
);
// Skips the modifier/keyword tokens that can sit between a doc block and the
// member identifier it documents (`export async function login(…)`, plain
// object-property shorthand `login: (…) => …`, etc.).
const MEMBER_NAME =
  /^\s*(?:export\s+|default\s+|async\s+|function\s+|const\s+|let\s+|var\s+|public\s+|private\s+|protected\s+|readonly\s+|static\s+|get\s+|set\s+)*([A-Za-z_$][\w$]*)/;

/**
 * Parses `@playground-include`/`@playground-exclude` JSDoc tags out of a
 * module's source text — plain regex/line scanning over source
 * text, no TS compiler dependency. Each tag is associated with the identifier
 * immediately following its doc block.
 */
export function parsePlaygroundTags(sourceText: string): PlaygroundTagMap {
  const tags: Record<string, PlaygroundTag> = {};

  for (const block of sourceText.matchAll(JSDOC_BLOCK)) {
    const tagMatch = TAG_LINE.exec(block[1]);
    if (!tagMatch) continue;

    const blockEnd = (block.index ?? 0) + block[0].length;
    const memberMatch = MEMBER_NAME.exec(sourceText.slice(blockEnd));
    if (!memberMatch) continue;

    const memberName = memberMatch[1];
    const reason = tagMatch[2].trim();

    tags[memberName] =
      tagMatch[1] === PLAYGROUND_JSDOC_TAG.EXCLUDE
        ? reason.length > 0
          ? { kind: "exclude", reason }
          : { kind: "exclude" }
        : { kind: "include" };
  }

  return tags;
}
