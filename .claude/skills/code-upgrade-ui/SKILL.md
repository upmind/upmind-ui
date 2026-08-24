---
name: code-upgrade-ui
description: Bring an existing design-system/packages/ui component up to the composed-component standard — a mechanical CC1–CC25 conformance audit plus a parity audit against its old-lib `.ce.vue`, then the fixes, with a locator-impact sweep before any test-key change. Use when a composed/consolidated component already exists but is missing rules, dropped capability, or needs conforming to the current contract.
---

# /code-upgrade-ui — bring an existing component up to standard

The component exists; the question is what it is missing. This skill produces **two audits and then the fixes** — never fixes from memory, never a rewrite. Its sibling `/code-compose-ui` builds new ones; use that when there is no composed main yet.

> **Comments — HARD GATE.** `rules/code-quality.md#comments` is in your context — obey it. An upgrade that adds narration comments has made the file worse. Default to **no comment**.

## Binding documents

Same three as `/code-compose-ui`, read and never restated: **`design-system/packages/ui/COMPONENT_SPEC.md`**, **`.claude/rules/code-ui.companion.md` § Composed components (CC1–CC25)**, and **ADR-024** (the four ratified retirements). Path table and oracle-reachability procedure: `/code-compose-ui` Step 0 — do not re-derive them.

## Step 0 — should it exist? (CC-A)

`grep -c 'default as' design-system/packages/ui/src/components/<slug>/index.ts` — one symbol means the component should have no composed layer at all, and an existing one is a candidate for deletion rather than repair. More than one, continue.

CC-B conversion (plain-name main, `parts/`, `tests/`) is part of every upgrade — a flat folder IS a finding, fixed in the same change (one review covers content and shape).

## Step 1 — conformance audit (mechanical, no judgement)

Produce one row per law. Evidence is `file:line` or the law is not assessed.

| Law | Verdict | Evidence |
| --- | --- | --- |
| CC1 naming / additive | PASS · FAIL · N/A | `<file>:<line>` |
| … through CC25 | | |

Run these to seed it (from a checkout that has `design-system/packages/ui`):

```bash
cd design-system/packages/ui/src/components

# CC5 — slots undeclared
grep -L "defineSlots" */*.vue

# CC8 — attrs not routed
grep -L "inheritAttrs: false" */*.vue

# CC9/CC10 — every useTestAttrs call, and whether it carries a key.
# NO-KEY means the call emits no data-test-key at all unless a consumer supplies one.
perl -0777 -ne 'while (/useTestAttrs\(\{(.*?)\}\)/gs) { my $a=$1; $a =~ s/\s+/ /g;
  printf "%-40s %-7s %s\n", $ARGV, ($a =~ /key:/ ? "HASKEY" : "NO-KEY"), $a }' */*.vue

# CC10 — item value interpolated into the key (breaks collection locators)
grep -nE 'key: `[^`]*\$\{' */*.vue

# CC18 — v-for keyed on the index instead of item identity
grep -nE ':key="index"|:key="`?\$\{?index' */*.vue

# CC19 — asChild leaking onto the composed component's own surface
grep -nE 'asChild\??:' */*.vue

# CC22 — English copy defaulted inside the library
grep -nE '^\s+[a-zA-Z]+: "[A-Z]' */*.vue

# CC12 — multi-clause conditions left in the template
grep -nE 'v-(if|show)="[^"]*(\|\||&&)' */*.vue

# CC12/CC14 — no meta computed at all
grep -L "const meta = computed" */*.vue

# CC3 — presentation the composed layer does not own
grep -nE 'class="[a-z][a-z0-9-]+ ' */*.vue
grep -n "cva(\|cn(" */*.vue

# CC13 — real ternaries (a bare `?.*:` also matches every optional prop declaration)
grep -nE '\S \? .* : ' */*.vue
# CC13 — early-return boolean chains
grep -nE '^\s*(if \(.*\) )?return (true|false);' */*.vue
# CC0 — script before template
for f in */*.vue; do head -1 "$f" | grep -q "<template>" || echo "$f script-first"; done

# CC3 — a prop per element instead of one `ui` map
grep -nE '^\s+(header|list|content|item|term|details|body|footer)Class\??:' */*.vue */types.ts

# CC7 — underscore throwaways (the destructure-and-discard pattern)
grep -n ": _[a-zA-Z]" */*.vue

# CC8b — useTestAttrs lifted into the script instead of called in the template
grep -nE "const [a-zA-Z]*TestAttrs|function [a-zA-Z]*TestAttrs" */*.vue

# CC26 — variants.ts hygiene: no join-arrays, no comments; zero-variant cva only when ≥2 call sites share it
grep -rn '\.join(" ")' */variants.ts
grep -rnE '^\s*(//|/\*)' */variants.ts
for f in */variants.ts; do python3 -c "
import re,sys
s=open('$f').read()
for m in re.finditer(r'export const (\w+) = cva\(',s):
    i=m.end();d=1
    while d and i<len(s): d+=(s[i]=='(')-(s[i]==')');i+=1
    if 'variants:' not in s[m.end():i]: print('$f:'+m.group(1)+' (verify >=2 consumers)')
"; done
# CC26 — class strings marooned in script consts/records/computeds
# (templates and variants.ts are the only homes; sweep the CONSUMER flips too)
grep -rnE '^\s*(const|let)\s.*["'"'"'`].*\b(flex|grid|bg-|text-|border-|rounded|gap-[0-9]|p[xy]?-[0-9]|m[xy]?-[0-9]|max-w-|min-h-|overflow-|w-full)' \
  --include='*.vue' --include='*.ts' . | grep -v variants.ts
```

A grep hit is a candidate, not a finding — open the file and confirm before writing a row.

## Step 2 — parity audit against the oracle

The oracle is `packages/ui/src/ui/<slug>/<Name>.ce.vue` plus its `types.ts` and `<slug>.config.ts`. Read all three (CC15). One row per oracle capability, one disposition each, per `verify-parity-oracle.md`:

`Direct` · `Renamed` · `Absorbed-by` · `Dropped-with-Linear-issue` · `Not-supported-with-reason`

- `useStyles` / `uiConfig` / `*.config.ts` / per-slot override maps → `Not-supported-with-reason: ADR-024 §2`. **Nothing else gets that disposition for free.**
- Every default that changed is a row (CC17).
- A blank or unexplained "not needed" is a missing row, not a pass.

**Check downstream before you call something dropped.** A capability may have been rebuilt at the call site or in a primitive after the composed component landed:

```bash
git log --oneline -S "<capability>" -- design-system/packages/ui apps/cart packages/client-vue | head
grep -rn "<capability>" design-system/packages/ui/src/components/<slug>/ apps/cart packages/client-vue
```

Several gaps on the current branch were already patched downstream *after* the composed component shipped — the fix belongs back in the component, and the downstream patch usually then deletes.

## Step 3 — triage

Sort every finding into exactly one bucket. The bucket determines who may approve it.

| Bucket | What it is | Approval |
| --- | --- | --- |
| **A · Conformance** | A CC law broken with no behaviour change to fix it — undeclared slots, missing `meta`, keyless test attrs where nothing yet locates it, a ternary | Apply now |
| **B · Capability restoration** | An oracle capability that is genuinely absent — behaviour returns | Needs the parity row; apply, then prove |
| **C · Signed drop** | Capability deliberately not coming back | **Blocked** on a Linear issue reference. Never self-sign. |

**Routing rule (CC3).** If the missing capability is a visual variant or a class (`variant`, `width`, `ring`, sizes), it belongs in the **primitive + `variants.ts`**, not the composed component. Fix it there and let the composed component pass the prop through. A composed component that grows a `cva` to close a parity gap has broken CC3 while closing CC16.

**Bucket C is where this skill stops and asks.** Do not narrow a component until a row disappears — that is the exact failure `verify-cosplay.md` and CC16 exist to catch.

## Step 3b — consumer audit (before applying anything)

The oracle says what the old component could do; the **consumers** say what this one must. Find every hand-assembler — apps, client-vue, **and lib-internal stories** (`.stories.ts` templates hand-assemble too; the barrel rename breaks them silently):

```bash
grep -rln '<Name>Trigger\|<Name>Content\|<Name>Item' \
  packages/client-vue/src apps/cart/src --include='*.vue'
grep -rln '<Name>Trigger' design-system/packages/ui/src --include='*.stories.ts'
```

Read each call site and classify: **expressible today** · **needs a capability** · **hold-with-filed-gap** (CC-C). Capabilities come from this audit, not imagination — Select's `#value` slot and generic option typing both fell out of four term-selectors rendering rich rows. Extend the component FIRST, then flip; a consumer flipped onto a component that cannot express it is a regression with extra steps. When domain objects must ride through item slots, make the component generic over its option type (`generic="T extends <Name>Option"`, the DataTable precedent) — never have consumers cast.

## Step 4 — apply, in this order

1. **Public surface** — props, collection types, `defineSlots`, defaults. Changing these ripples; do it first and typecheck.
2. **Attribute + test-hook routing** — CC8–CC11. See Step 5 *before* touching a key.
3. **Derivation** — the `meta` computed, named clauses, lodash. Behaviour-preserving.
4. **Capability restorations** (buckets B + 3b), primitive-first per the routing rule.
5. **The CC-B reshape** (same change, per CC-B):

   | From | To |
   | --- | --- |
   | `<Name>.composed.vue` | `<Name>.vue` — the plain name, `defineOptions({ name: "<Name>" })` |
   | `<Name>.vue` (root primitive) | `parts/<Name>Root.vue` |
   | every other part `.vue` | `parts/` (fix `../../lib` → `../../../lib`, `./variants` → `../variants`) |
   | `<Name>.composed.test.ts` | `tests/<Name>.test.ts` |
   | `<Name>.test.ts` (primitive suite) | `tests/<Name>Parts.test.ts` (register the root as `<Name>Root`) |
   | `<Name>Composed*` types | plain `<Name>Props` / `<Name>Slots` / `<Name>Ui` |
   | the negative control | **regenerate** — its hunks name the old file path — as `tests/<Name>.<what-it-breaks>.patch` |

   `index.ts` and `registry.ts` re-export the new names; the `<Name>Composed` export dies here (consumers never used it — verify, don't assume).
   Every `.vue` this reshape moves or touches flips **template-first** (CC0) in the same change — the turn already owns the file, so the block swap costs nothing here and shrinks the post-queue library sweep. Regenerate any negative control whose hunks anchor into a reordered file.

6. **Consumer flips** (every site from Step 3b, same change) — the rename breaks them at runtime silently (children fed to a composed main are dropped), so lib rename and flips are one atomic turn. Flips obey CC26: `class`/`ui` values are written inline in the template at the call site — never hoisted into a script const, however long. A flip that wants a name→class record is missing a variant; route it per Step 3.
7. **The shipped artefacts** — tests/ (test + negative control), story, registry, index (CC23–CC25). Stories flip to composed-first too; keep every scenario (convert, never delete).

Minimum diff throughout: change only the path with the gap. Every adjacent path you touch is a new chance to regress.

Worked examples: `tabs/` (built to standard, consumers flipped across four branches) and `select/` (full turn: reshape + `#value`/generic capabilities + eleven consumer flips, commits `refactor(ui-next)!: Select takes the plain name…` and `fix(client-vue): every Select consumer…`).

## Step 5 — regression net

**Locator-impact sweep — blocking, before any `data-test-key` change.** These keys are live Playwright locators; changing one silently breaks specs:

```bash
grep -rn "<slug>" tests/Playwright/ | grep -iE "test-key|getByTestId|locator"
grep -rn "data-test-key" design-system/packages/ui/src/components/<slug>/
```

Either preserve the old key or update the specs in the same change. When restoring CC10 (constant collection key + `value`), the old lib's key is the compatible one — `key: "tab-item"`, `value: [item.value, index]`.

**Prove each fix can fail.** For every bucket-B restoration, a negative control in the folder's `tests/` (`<TestBasename>.<what-it-breaks>.patch`) must drive its assertion RED before the fix counts — `pnpm test` runs them automatically via `scripts/verify-must-fail.ts`. The seat that wrote the source authors the mutant; verifying RED happens blind, without reading the diff. A restoration with no failing-first proof is a claim.

**Then verify:**

```bash
npx eslint src/components/<slug> <every consumer file touched>   # BEFORE committing — import/order and prettier are errors here
pnpm --filter @upmind/ui test
pnpm --filter @upmind/ui typecheck
pnpm --filter @upmind/ui build:registry
```

Read the log's EXIT line. **Never commit with `--no-verify`** — the hooks run lint-staged, and skipping them is how a whole night's import-order errors reach the operator's editor (receipt: 16 across the drawer/dropdown/alert/tooltip turns, 10 Aug). When auditing the cross-package errorset, audit the baseline's *contents* once per session, not just the delta count — real errors hide inside "known noise" (receipt: the duplicated-vue unwrap family buried a live handler-type bug in SubProductRenderer).

**Visual regression (blocking).** An upgrade that changes the rendered tree is a visual change. Run the `tests/Playwright/e2e/visual-regression/` specs covering the surfaces the component appears on — it is the only visual check in the repo — and read the verdict from `.last-run.json` plus time-filtered `allure-results`. Restoring a dropped visual (Tooltip's arrow, Drawer's drag handle, Tabs' sliding indicator) *will* move baselines; re-baseline deliberately, never blanket-accept.

Then drive the component in Storybook **and** at a real `apps/cart` call site — a green unit test is not delivery. Reuse the running dev server; never kill it.

## Step 6 — file

Both audit tables (conformance + parity) go to `docs/sdd/<ID>/parity.yaml` or a Linear comment on the story. `docs/reviews/` and `docs/plans/` are gitignored — a table filed only there is not filed. Update Linear status with a completion comment as each component lands.

## Checklist

- [ ] Conformance table complete — CC1–CC25, every row with `file:line` evidence
- [ ] Parity table complete — one row per oracle capability, every disposition explicit
- [ ] Downstream checked before declaring anything dropped
- [ ] Every finding triaged A / B / C; no bucket-C item self-signed
- [ ] Visual-variant gaps fixed in the primitive + `variants.ts`, not the composed layer (CC3)
- [ ] Locator sweep run before any test-key change; specs updated or keys preserved
- [ ] Every restoration proved by a negative-control patch in tests/ going RED first
- [ ] Package test / typecheck / build:registry green; driven for real in cart
- [ ] Both tables filed where they persist

## Quick invoke

```
/code-upgrade-ui <slug>
```

Audit `<slug>`'s composed component against CC1–CC25 and against its old-lib `.ce.vue`, triage the findings, apply buckets A and B, and stop on anything needing a signed drop.

---

## Appendix — the current backlog

State of `ui-migration/composed-components-usetestattrs` (commits `08756b29e`, `59d3c1acf`, `e6aa29268`, `e123dff8b`), audited 3 Aug 2026. These seven are the work queue; re-verify each row before acting on it — the branch may have moved.

**Conformance, all seven** — verified with the Step 1 greps, not read off the diff:

- **CC9 — not one of the seven emits a stable `data-test-key`.** Every `useTestAttrs` call is keyless except Tabs', and Tabs' is the interpolated one (CC10). Select's and DropdownMenu's *item* hooks pass a `value` with no `key`, so they emit `data-test-value` with nothing to select on. This is the headline finding: the branch ported `useTestAttrs` and then wired it so it produces almost nothing.
- **CC5 — no `defineSlots` in any of the seven**, though every one of them takes slots.
- **CC12 — no `meta` computed in any of the seven**; the gates sit inline in the templates.
- **CC0 / CC3 / CC7 / CC8b (the 10 Aug rulings) are unmet in all five untouched components**: script-first order, `contentClass` props on Select and DropdownMenu (should be `ui`), `_`-prefixed destructure throwaways throughout, and `useTestAttrs` lifted into script consts. Tabs, DescriptionList and Dialog already conform.
- CC8 met except **Alert** and **Tabs**. CC3 met except **Drawer**. CC18 broken in **DropdownMenu** only (`:key="index"` over a list its own `hidden` flag filters).
- Clean across all seven, so CC13 / CC19 / CC22 are preventative here rather than remedial: no ternaries, no boolean early-return chains, no `asChild` leaking onto a composed surface, no English copy defaulted inside the library.
- CC20 is *inconsistent* rather than broken: Select exposes `ariaLabel`, Dialog and Drawer lean on `title`, DropdownMenu and Tooltip say nothing. Each needs its accessible-name route stated.

**Suggested order.** Not arbitrary — it front-loads the two that are actively wrong:

1. **Tabs** — CC10 is a live test-infrastructure bug: the interpolated key means no spec can select the tab collection. Fixing it also restores the old lib's compatible `key: "tab-item"`.
2. **Dialog** — the `dismissable: false` close-guard is the most serious behavioural drop; a dialog that must not be dismissed currently can be.
3. **Select** — the richest surface, and the one whose parity table teaches the most; do it third so the pattern is settled before the long tail.
4. **Drawer** — the sr-only title/description restoration is an a11y fix, and CC3's inline classes come out with it.
5. **DropdownMenu** — the index key (CC18) plus the breaking `#trigger` change; needs a consumer sweep before the trigger decision.
6. **Alert**, **Tooltip** — smallest surfaces, mostly conformance.

| Component | Conformance | Parity gaps vs `.ce.vue` |
| --- | --- | --- |
| `AlertComposed` | CC5, CC8, CC9, CC12 | `action` prop + `#action` slot (Link + arrow icon); `icon` **prop** (slot-only now); `size`; `click` emit; `color`→`variant` remap undocumented (CC17); old lib had JSDoc'd `defineSlots` — a documentation regression |
| `TooltipComposed` | CC5, CC9 | `TooltipArrow`; `color`; `to` portal target; trigger `tabindex="-1"`; `disableClosingTrigger: true` default; `delayDuration: 150` default now unset (CC17) |
| `SelectComposed` | CC5, CC9 (trigger **and** item hook keyless), CC12. Minor: `toTestValue`'s `typeof` chain is a lodash `includes` candidate | `additionalItems` (second group, icons, `emitOnly`); `variant` outline/ghost; `width`; `ring`; `dataHover`/`dataFocus`; `to`; item `title`+`label` two-part display; item `const` alias; item `id`; the items-changed re-key that fixes stale selection; the invisible placeholder spacer; `size` default `lg`→`md` (CC17) |
| `TabsComposed` | CC5, CC8, CC12, **CC10 (`key: \`tab-${value}\`` — breaks collection locators; old was `key: "tab-item", value: [item.value, index]`)**, CC9 (no component-level key) | single-tab degrade (`useTabs`/`force`) — **already regressed `Sections` and was patched twice downstream**; the animated sliding indicator; `#prepend`/`#append`; item `icon`; `align`/`overflow`/`border` |
| `DialogComposed` | CC5, CC9, CC12 (four-term header `v-if`) | **`dismissable: false` close-guard** (non-dismissable dialogs — the most serious drop); `forceClose` + default footer Close; `noHeader`/`noFooter`; `size`/`overflow`/`fit`; `classHeader`/`classContent`/`classFooter`; `to`; `#header`/`#actions`/`#close`; the scrollable wrapper (`DialogContentScroll`) |
| `DrawerComposed` | CC5, CC9, CC12, **CC3 (inline `class="min-h-0 flex-1 overflow-y-auto px-4"` on a raw div)** | the drag handle + its `data-vaul-no-drag` when not dismissible; **the sr-only Title/Description that keep a custom header accessible** (a11y regression); `#header`/`#close`/`#actions`; `DrawerClose` wrapper; `to`; `classHeader`/`classContent`/`classFooter`; `size`/`width`/`overflow`/`height`/`fit`. Minor: root types come from `vaul-vue` while `useForwardPropsEmits` comes from `reka-ui` |
| `DropdownMenuComposed` | CC5, CC9 (content **and** item hook keyless), CC12, **CC18 (`:key="index"`)** | the default `Button` trigger (`variant`/`loading`/`label`/`size`/`ring`/`icon`/`avatar`/`aria-expanded`) — `#trigger` is now required, a breaking change for consumers; item `icon`/`avatar`; the async `handler` + processing + auto-close-on-select; `DropdownMenuGroup` wrapper; `to`/`width`/`popoverClass`/`itemClass` |

Ratified everywhere, needing no issue: `uiConfig`, `useStyles`, `*.config.ts`, the per-slot override maps (ADR-024 §2).

Most of the variant gaps (`variant`, `width`, `ring`, `size`, `overflow`, `fit`) are **primitive** gaps — route them to `variants.ts` per the Step 3 routing rule, not into the composed layer.
