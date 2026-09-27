// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/states
 * @description Derives a page's forced states from its module's FEATURE — the
 * source of truth for what the module does. Every scenario that names a
 * transport condition becomes a forced state carrying that scenario's own
 * title; a feature naming none yields none. Nothing here reads the
 * recordings, the archetype, or a tag: whether a derived state can be
 * ANSWERED is the corpus's question (`capabilities.ts`), asked afterwards.
 *
 * The rules are phrase rules, and they are deliberately conservative: a
 * scenario the rules cannot read is a track, not a state.
 *
 * Four readings the first cut got wrong, and what fixed each (operator
 * ruling, 2026-09-12):
 *
 * - ONE SENTENCE CAN NAME SEVERAL CONDITIONS. "Know whether my list is
 *   loading, empty, or errored" is three states, not the first rule that
 *   matched it. Every condition in the sentence is read, and the words that
 *   named it ride along as the {@link ForcedState.phrase} that tells the three
 *   apart.
 * - A CONDITION THE SENTENCE DENIES IS NOT A STATE. "refused, not shown an
 *   empty list" names a refusal and denies an absence; "reports no error"
 *   names no failure at all.
 * - A DERIVED business state is not a transport one. "An unpaid invoice with
 *   no payments yet derives a pending state" is a mapper's arithmetic, and no
 *   fake network can produce it.
 * - THE CONDITIONS ARE THE TITLE'S; the GUARDS read the whole scenario. A
 *   state's label IS its scenario's title, so one read out of a step is offered
 *   under a sentence that never mentions it — and an Examples row substituted
 *   into a step ("rejected") is not a transport condition at all. A guard is
 *   the opposite risk: it can only ever withdraw an offer, and the step that
 *   says "no request is made" is where a client-side outcome is usually
 *   written.
 *
 * Client-side outcomes ("nothing is sent", "no request") are excluded whole:
 * no transport can be armed for a request that never leaves.
 */
import { parseFeatureScenarios } from "@upmind-automation/scenario-harness";
import {
  FORCE_RECIPE_KIND,
  FORCE_RECIPE_PENDING_WRITE,
  FORCE_RECIPE_TARGET
} from "./states.types";
import {
  compact,
  find,
  flatMap,
  includes,
  intersection,
  isEmpty,
  kebabCase,
  map,
  size,
  snakeCase,
  some,
  sortBy,
  toLower,
  truncate,
  uniqBy
} from "lodash-es";
import type {
  ForceRecipe,
  ForceRecipeId,
  ForceRecipeKind,
  ForcedState
} from "./states.types";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** Long enough to recognise the scenario in a url, short enough to read. */
const SLUG_LENGTH = 48;

/** A request that never leaves the client cannot be forced on the wire. */
const CLIENT_SIDE =
  /nothing is sent|no request is|no request at all|never sent|before anything is sent|without a request|asks the server nothing|asking the server nothing/i;

/**
 * A state the module DERIVES from data it already holds — a mapper's
 * arithmetic, not an answer a transport can give. Forcing cannot produce one,
 * so a scenario about one is a track.
 */
const DERIVED =
  /\bderives? (a|an|its|the)\b|\bmaps? as\b|\bmapped as\b|\bis mapped\b/i;

/** Below it a match is denied rather than named. */
const DENIED =
  /\b(not|never|no|neither|rather than|instead of|without)\s+(\S+\s+){0,3}$/i;

type Condition = {
  readonly kind: ForceRecipeKind;
  readonly test: RegExp;
};

/**
 * The phrases that NAME a transport condition. Each is matched everywhere it
 * occurs — a sentence naming two conditions declares two states — and a phrase
 * that embeds its own negative ("never settles") consumes it, so the denial
 * guard cannot read it as a condition being ruled out.
 */
const CONDITIONS: readonly Condition[] = [
  { kind: FORCE_RECIPE_KIND.PENDING, test: /\bnever left waiting\b/gi },
  // "never a wait that never ends" denies the wait that HANGS, never the
  // pending state itself — so the phrase consumes its own negative rather than
  // being dropped by the denial guard.
  { kind: FORCE_RECIPE_KIND.PENDING, test: /\bnever (a|an) wait\b/gi },
  { kind: FORCE_RECIPE_KIND.PENDING, test: /\bnever settles?\b/gi },
  { kind: FORCE_RECIPE_KIND.PENDING, test: /\bin flight\b/gi },
  { kind: FORCE_RECIPE_KIND.PENDING, test: /\bin progress\b/gi },
  {
    kind: FORCE_RECIPE_KIND.PENDING,
    test: /\bstill (loading|working|saving)\b/gi
  },
  { kind: FORCE_RECIPE_KIND.PENDING, test: /\bhas not finished loading\b/gi },
  { kind: FORCE_RECIPE_KIND.PENDING, test: /\bloading\b/gi },
  // Waiting IS the pending state, however the sentence puts it — "never a wait
  // that never ends", "Waiting always ends", "a client waiting for a gateway".
  { kind: FORCE_RECIPE_KIND.PENDING, test: /\bwaits?\b|\bwaiting\b/gi },

  { kind: FORCE_RECIPE_KIND.REFUSED, test: /\bgoes wrong\b/gi },
  { kind: FORCE_RECIPE_KIND.REFUSED, test: /\berrored\b/gi },
  { kind: FORCE_RECIPE_KIND.REFUSED, test: /\berror state\b/gi },
  { kind: FORCE_RECIPE_KIND.REFUSED, test: /\bfail(s|ed|ing|ure)?\b/gi },
  { kind: FORCE_RECIPE_KIND.REFUSED, test: /\brefus(ed|es|al)\b/gi },
  { kind: FORCE_RECIPE_KIND.REFUSED, test: /\breject(ed|s)\b/gi },
  { kind: FORCE_RECIPE_KIND.REFUSED, test: /\bdenied\b/gi },

  // An absence is only ever read off a SUBJECT that could have held something.
  // A bare "empty" is a value, a form field or a signal far more often than it
  // is a collection with nothing in it — which is how "Clearing a value sends
  // an explicit 'this is empty' signal" became a forced empty read.
  {
    kind: FORCE_RECIPE_KIND.ABSENT,
    test: /\bempty (list|collection|vault|catalogue|state|result set)\b/gi
  },
  {
    kind: FORCE_RECIPE_KIND.ABSENT,
    test: /\b(list|collection|vault|catalogue|history|results?|records?|rows?) (is|are|was|were) empty\b/gi
  },
  {
    kind: FORCE_RECIPE_KIND.ABSENT,
    test: /\bnothing to (show|see|list|read)\b/gi
  },
  { kind: FORCE_RECIPE_KIND.ABSENT, test: /\bnone at all\b/gi },
  {
    kind: FORCE_RECIPE_KIND.ABSENT,
    test: /\bno (records?|rows?|results?|items?|entries)\b/gi
  },
  { kind: FORCE_RECIPE_KIND.ABSENT, test: /\babsent\b/gi },
  { kind: FORCE_RECIPE_KIND.ABSENT, test: /\brecord that is not there\b/gi }
];

/**
 * The words an ENUMERATION is spelt with — "loading, empty, or errored", the
 * house phrase half these features state their read states in. Inside one, a
 * bare word IS its condition: the list is the subject the first item already
 * named.
 */
const ENUMERATED: Record<string, ForceRecipeKind> = {
  loading: FORCE_RECIPE_KIND.PENDING,
  empty: FORCE_RECIPE_KIND.ABSENT,
  errored: FORCE_RECIPE_KIND.REFUSED,
  error: FORCE_RECIPE_KIND.REFUSED,
  failed: FORCE_RECIPE_KIND.REFUSED,
  failing: FORCE_RECIPE_KIND.REFUSED,
  absent: FORCE_RECIPE_KIND.ABSENT,
  missing: FORCE_RECIPE_KIND.ABSENT
};

const ENUMERATION =
  /\b(?:loading|empty|errored|error|failed|failing|absent|missing)\b(?:\s*,\s*|\s+or\s+)(?:\b(?:loading|empty|errored|error|failed|failing|absent|missing)\b(?:\s*,\s*|\s+or\s+)?)+/gi;

/** What the sentence is doing to the wire, where it says so. */
const WRITES =
  /\b(saves?|saving|saved|changes?|changed|writes?|updates?|deletes?|deletion|removes?|removal|submits?|dispatch(es|ed)?|stores?|storing|stored|uploads?|uploading|pays?|payment|charges?|converts?|attaches?)\b/i;

const READS =
  /\b(reads?|loads?|loading|lists?|collection|fetch(es|ed)?|refresh(es|ed)?|history|profile|vault|definitions|catalogue|invoice|methods|gateways?|page|settings)\b/i;

/** One condition found in a sentence, with the words that named it. */
type Reading = {
  kind: ForceRecipeKind;
  phrase: string;
  at: number;
};

/** Whether the words in front of a match DENY it rather than name it. */
function isDenied(text: string, at: number): boolean {
  return DENIED.test(text.slice(Math.max(0, at - 32), at));
}

function matchesOf(text: string, condition: Condition): Reading[] {
  return map([...text.matchAll(condition.test)], match => ({
    kind: condition.kind,
    phrase: match[0],
    at: match.index ?? 0
  }));
}

/** Every condition an enumeration spells out, each at its own position. */
function enumeratedIn(text: string): Reading[] {
  return flatMap([...text.matchAll(ENUMERATION)], listed =>
    compact(
      map([...listed[0].matchAll(/[a-z]+/gi)], word => {
        const kind = ENUMERATED[toLower(word[0])];
        return kind
          ? {
              kind,
              phrase: word[0],
              at: (listed.index ?? 0) + (word.index ?? 0)
            }
          : undefined;
      })
    )
  );
}

/**
 * The clause a match sits in — the sentence cut at its own joins, so the verb
 * that says READ or WRITE is looked for where the condition was named and not
 * three clauses away. "I am told when a save fails, where I am working" is a
 * refused WRITE; "A failed read tells me it failed" is a refused READ.
 */
function clauseAt(text: string, at: number): string {
  const boundary = /,|;|\band\b|\bbut\b|\bor\b|\bwhile\b|\bthen\b/gi;

  let start = 0;
  let end = size(text);

  for (const join of text.matchAll(boundary)) {
    const index = join.index ?? 0;
    if (index + size(join[0]) <= at) start = index + size(join[0]);
    else if (index >= at + 1) {
      end = index;
      break;
    }
  }

  return text.slice(start, end);
}

/**
 * Which half of the exchange the condition is about. An absence is always a
 * read's — a write has no rows to come back without — and the other two follow
 * the clause's own verb, defaulting to the read every surface boots on.
 */
function targetOf(kind: ForceRecipeKind, clause: string) {
  if (kind === FORCE_RECIPE_KIND.ABSENT) return FORCE_RECIPE_TARGET.READ;

  return WRITES.test(clause) && !READS.test(clause)
    ? FORCE_RECIPE_TARGET.WRITE
    : FORCE_RECIPE_TARGET.READ;
}

/**
 * Whether this scenario is about something no transport can produce — a
 * request that never leaves, or a state the module derives from data it
 * already holds.
 */
function isExcluded(text: string): boolean {
  return CLIENT_SIDE.test(text) || DERIVED.test(text);
}

/** Every condition a sentence names, denials and duplicates dropped. */
function readingsIn(text: string): Reading[] {
  const found = [
    ...flatMap(CONDITIONS, condition => matchesOf(text, condition)),
    ...enumeratedIn(text)
  ];

  return sortBy(
    uniqBy(
      // A denial is dropped before the de-duplication, so a sentence naming a
      // condition once and denying it elsewhere still declares it.
      found.filter(reading => !isDenied(text, reading.at)),
      reading => `${reading.kind}:${reading.at}`
    ),
    reading => reading.at
  );
}

/** The scenario whole — its title and every step, as one sentence. */
function scenarioText(scenario: FeatureScenario): string {
  return [scenario.name, ...map(scenario.steps, step => step.text)].join(". ");
}

function recipesOf(
  scenario: FeatureScenario
): Array<ForceRecipe & { phrase: string }> {
  const title = scenario.name;

  // The GUARDS read the whole scenario; the conditions read only its TITLE.
  // A guard is a reason to offer nothing and cannot over-offer, and the step
  // that says "no request is made" is where a client-side outcome is usually
  // written. A CONDITION found in a step is the opposite risk: the label a
  // forced state carries is the title, so a state read out of step text is
  // offered under a sentence that never mentions it — and an Examples row
  // substituted into a step ("rejected") is not a transport condition at all.
  if (isExcluded(scenarioText(scenario))) return [];

  const readings = map(readingsIn(title), reading => ({
    kind: reading.kind,
    target: targetOf(reading.kind, clauseAt(title, reading.at)),
    phrase: reading.phrase
  }));

  // One recipe per scenario, whichever words named it first: a sentence saying
  // "failed" twice about the same read declares one state, not two.
  return uniqBy(readings, recipe => `${recipe.kind}/${recipe.target}`);
}

// -----------------------------------------------------------------------------

/** The scenario's identity on a url — its title and its recipe, kebab-cased. */
export function forcedStateSlug(title: string, recipe: ForceRecipe): string {
  return `${truncate(kebabCase(title), {
    length: SLUG_LENGTH,
    omission: ""
  })}-${forcedStateRecipeId(recipe)}`;
}

/**
 * What the picker and the chip CALL this state — one word per recipe, the same
 * word on every page (`Loading` · `Empty` · `Errored` · `Saving` · `Refused`),
 * as the i18n key `labs.force_preset_<recipe>`. The feature's own phrase stays
 * on the state (`phrase`) for receipts; it never names the button, or five
 * modules spell one state five ways (operator ruling, 2026-09-12).
 */
export function forcedStateLabel(recipe: ForceRecipe): string {
  return `labs.force_preset_${snakeCase(forcedStateRecipeId(recipe))}`;
}

/**
 * How the corpus is ASKED for this state — the one place a recipe becomes the
 * vocabulary `presets.ts` answers in. Nothing else in the app spells these.
 */
export function forcedStateRecipeId(recipe: ForceRecipe): ForceRecipeId {
  const isWrite = recipe.target === FORCE_RECIPE_TARGET.WRITE;

  if (recipe.kind === FORCE_RECIPE_KIND.PENDING)
    return isWrite ? FORCE_RECIPE_PENDING_WRITE : "loading";
  if (recipe.kind === FORCE_RECIPE_KIND.REFUSED)
    return isWrite ? "error-action" : "error-collection";

  return "empty";
}

/**
 * Every forced state the feature describes, in feature order. A feature
 * naming no transport condition yields an empty list — the page offers
 * nothing, and is left Live.
 *
 * `without` are the lane tags THIS page leaves out (`ScenarioTracks.without`):
 * a scenario tagged with one is another page's, so its forced states are not
 * this page's to offer. A page that names no lane offers every scenario's,
 * exactly as `useFeatureTracks` reads the same tags for its playlist.
 */
export function featureForcedStates(
  featureText: string,
  without?: readonly string[]
): ForcedState[] {
  const derived = flatMap(parseFeatureScenarios(featureText), scenario => {
    if (!isEmpty(without) && !isEmpty(intersection(scenario.tags, without)))
      return [];

    const recipes = recipesOf(scenario);

    return map(recipes, ({ phrase, ...recipe }) => ({
      slug: forcedStateSlug(scenario.name, recipe),
      title: scenario.name,
      label: forcedStateLabel(recipe),
      phrase,
      line: scenario.line,
      recipe
    }));
  });

  // A feature that says the same thing twice — two scenarios, one title —
  // offers it once: the slug IS the identity a url carries.
  return uniqBy(derived, state => state.slug);
}

/** Whether the feature describes any forced state at all. */
export function describesForcedStates(featureText: string): boolean {
  return some(parseFeatureScenarios(featureText), scenario =>
    some(recipesOf(scenario))
  );
}

/** The state a url slug names, of those a page offers. */
export function forcedStateAt(
  states: readonly ForcedState[],
  slug: unknown
): ForcedState | undefined {
  return find(states, state => state.slug === slug);
}

/** Whether these states include one answered by this recipe id. */
export function hasRecipe(
  states: readonly ForcedState[],
  recipe: ForceRecipeId
): boolean {
  return includes(
    map(states, state => forcedStateRecipeId(state.recipe)),
    recipe
  );
}
