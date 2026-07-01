# Handover bundle — manifest

> Tells you how to package the workshop materials into the bundle the Contabo team unzips on Day 1.

The bundle is the team's lasting reference. Everything they need lives inside it; nothing references this monorepo at runtime.

---

## Target structure

```text
workshop-bundle/
├── LOADING_PROMPT.md
├── 01-workshop-plan.md
├── 02-module-foundations/
│   ├── session.md
│   ├── client.md
│   ├── brand.md
│   ├── system.md
│   ├── productCatalogue.md
│   ├── productCategories.md
│   ├── product.md
│   ├── basket.md
│   ├── basketProduct.md
│   ├── paymentDetails.md
│   ├── payment.md
│   └── invoices.md
├── 03-foundations-chapter.md
├── 04-sdd/
│   ├── 00-scaffold.md
│   ├── 01-auth.md
│   ├── 02-brand-bootstrap.md
│   ├── 03-catalogue.md
│   ├── 04-basket.md
│   ├── 05-checkout-address.md
│   ├── 06-payment.md
│   └── 07-panel.md
├── 05-build-your-own-core.md
├── feedback-prompt.md
├── 06-initiator/
│   ├── README.md
│   ├── generic.md
│   ├── cursor.md
│   ├── claude-code.md
│   └── templates/
│       ├── CLAUDE.md
│       └── .claude/
│           └── settings.json
└── 07-references/
    ├── fixture-index.md
    ├── fixture-format.md
    ├── canonical-rule.md
    └── recordings/
        ├── _index.json
        ├── post--oauth-access_token-client.json
        ├── post--oauth-access_token-guest.json
        ├── ... (all 93 fixtures from tests/fixtures/recordings/)
        └── put-orders-{basketId}.json
```

---

## Source → bundle mapping

| Source path (in this monorepo) | Bundle slot |
| --- | --- |
| `docs/workshop/contabo.md` | `01-workshop-plan.md` |
| `packages/headless/src/modules/session/docs/foundation.md` | `02-module-foundations/session.md` |
| `packages/headless/src/modules/client/docs/foundation.md` | `02-module-foundations/client.md` |
| `packages/headless/src/modules/brand/docs/foundation.md` | `02-module-foundations/brand.md` |
| `packages/headless/src/modules/system/docs/foundation.md` | `02-module-foundations/system.md` |
| `packages/headless/src/modules/productCatalogue/docs/foundation.md` | `02-module-foundations/productCatalogue.md` |
| `packages/headless/src/modules/productCategories/docs/foundation.md` | `02-module-foundations/productCategories.md` |
| `packages/headless/src/modules/product/docs/foundation.md` | `02-module-foundations/product.md` |
| `packages/headless/src/modules/basket/docs/foundation.md` | `02-module-foundations/basket.md` |
| `packages/headless/src/modules/basketProduct/docs/foundation.md` | `02-module-foundations/basketProduct.md` |
| `packages/headless/src/modules/paymentDetails/docs/foundation.md` | `02-module-foundations/paymentDetails.md` |
| `packages/headless/src/modules/payment/docs/foundation.md` | `02-module-foundations/payment.md` |
| `packages/headless/src/modules/invoices/docs/foundation.md` | `02-module-foundations/invoices.md` |
| `docs/workshop/foundations.md` | `03-foundations-chapter.md` |
| `docs/workshop/sdd/00-scaffold.md` | `04-sdd/00-scaffold.md` |
| `docs/workshop/sdd/01-auth.md` | `04-sdd/01-auth.md` |
| `docs/workshop/sdd/02-brand-bootstrap.md` | `04-sdd/02-brand-bootstrap.md` |
| `docs/workshop/sdd/03-catalogue.md` | `04-sdd/03-catalogue.md` |
| `docs/workshop/sdd/04-basket.md` | `04-sdd/04-basket.md` |
| `docs/workshop/sdd/05-checkout-address.md` | `04-sdd/05-checkout-address.md` |
| `docs/workshop/sdd/06-payment.md` | `04-sdd/06-payment.md` |
| `docs/workshop/sdd/07-panel.md` | `04-sdd/07-panel.md` |
| `docs/workshop/build-your-own-core.md` | `05-build-your-own-core.md` |
| `docs/workshop/LOADING_PROMPT.md` | `LOADING_PROMPT.md` |
| `docs/workshop/feedback-prompt.md` | `feedback-prompt.md` |
| `docs/workshop/README.md` (initiator-pick excerpt) | `06-initiator/README.md` |
| `docs/workshop/_initiator/generic.md` | `06-initiator/generic.md` |
| `docs/workshop/_initiator/cursor.md` | `06-initiator/cursor.md` |
| `docs/workshop/_initiator/claude-code.md` | `06-initiator/claude-code.md` |
| `docs/workshop/_initiator/templates/CLAUDE.md` | `06-initiator/templates/CLAUDE.md` |
| `docs/workshop/_initiator/templates/.claude/settings.json` | `06-initiator/templates/.claude/settings.json` |
| `docs/workshop/references/fixture-index.md` | `07-references/fixture-index.md` |
| `docs/workshop/references/fixture-format.md` | `07-references/fixture-format.md` |
| `.agent/rules/docs-modules.md` | `07-references/canonical-rule.md` |
| `tests/fixtures/recordings/*.json` (93 files) | `07-references/recordings/*.json` |

---

## Build script (one-shot)

A simple shell script to assemble the bundle. Run from the monorepo root.

```bash
#!/usr/bin/env bash
set -euo pipefail

BUNDLE="${1:-./workshop-bundle}"
ROOT="$(git rev-parse --show-toplevel)"

rm -rf "${BUNDLE}"
mkdir -p "${BUNDLE}"/{02-module-foundations,04-sdd,06-initiator,07-references/recordings}

# 01 — workshop plan
cp "${ROOT}/docs/workshop/contabo.md" "${BUNDLE}/01-workshop-plan.md"

# 02 — module foundations (12 files; currency skipped, orders merged into invoices)
for m in session client brand system productCatalogue productCategories product basket basketProduct paymentDetails payment invoices; do
  cp "${ROOT}/packages/headless/src/modules/${m}/docs/foundation.md" "${BUNDLE}/02-module-foundations/${m}.md"
done

# 03 — foundations chapter
cp "${ROOT}/docs/workshop/foundations.md" "${BUNDLE}/03-foundations-chapter.md"

# 04 — SDDs
cp "${ROOT}/docs/workshop/sdd/"*.md "${BUNDLE}/04-sdd/"

# 05 — build-your-own-core
cp "${ROOT}/docs/workshop/build-your-own-core.md" "${BUNDLE}/05-build-your-own-core.md"

# 06 — initiator (all three layers + a small README pointing at the right one)
cp "${ROOT}/docs/workshop/_initiator/generic.md"      "${BUNDLE}/06-initiator/generic.md"
cp "${ROOT}/docs/workshop/_initiator/cursor.md"       "${BUNDLE}/06-initiator/cursor.md"
cp "${ROOT}/docs/workshop/_initiator/claude-code.md"  "${BUNDLE}/06-initiator/claude-code.md"
# The 06-initiator/README.md is generated separately — see "Initiator README" section below.

# 07 — references
cp "${ROOT}/docs/workshop/references/fixture-index.md" "${BUNDLE}/07-references/fixture-index.md"
cp "${ROOT}/.agent/rules/docs-modules.md"              "${BUNDLE}/07-references/canonical-rule.md"
cp -R "${ROOT}/tests/fixtures/recordings/"*        "${BUNDLE}/07-references/recordings/"

echo "Bundle ready at ${BUNDLE}"
echo "Files: $(find "${BUNDLE}" -type f | wc -l | tr -d ' ')"
echo "Next: tar -czf ${BUNDLE}.tar.gz $(basename "${BUNDLE}") and ship."
```

Save as `scripts/build-handover-bundle.sh`, make executable, run.

---

## Initiator README (for slot `06-initiator/README.md`)

A 30-line file the team sees first in the initiator folder. Tells them which file to use.

```markdown
# Workshop initiator — which file to use

This folder contains three layered variants of the same workshop kickoff prompt. **Use the one that matches your agent tooling.** Don't manually combine them.

| Your agent | File to use |
| --- | --- |
| Cursor | `cursor.md` |
| Claude Code | `claude-code.md` |
| Aider / Codex / GitHub Copilot Workspace / Anthropic API direct / anything else | `generic.md` |

The variants are **additive** — `cursor.md` builds on `generic.md`, and `claude-code.md` builds on `cursor.md`. You feed your agent just **one** file as the initial system prompt; that file tells the agent to read its base layer(s) before continuing.

## What this initiator does

1. Runs a **Kickoff Interview** to capture your team's stack, conventions, and architecture choices (sections 4 / 5 / 6 of `generic.md`).
2. Loads the **module foundation docs** (`02-module-foundations/`), **Foundations chapter** (`03-foundations-chapter.md`), and **per-feature SDDs** (`04-sdd/`).
3. Drives the **build sequence** (8 features, scaffold → panel) with validation at each step.

See `generic.md` for the full operating principles, validation checklist, and pacing.
```

---

## Verification before shipping

After running the build script:

- [ ] `find ${BUNDLE} -type f | wc -l` returns ≥ 110 (12 modules + 8 SDDs + 5 top-level docs + 3 initiator layers + initiator README + 2 reference docs + 93 fixtures = ~124)
- [ ] Every `02-module-foundations/*.md` is non-empty and has a `# Module:` header
- [ ] Every `04-sdd/*.md` has a feature title and a validation checklist
- [ ] `06-initiator/README.md` exists and points at all three layers
- [ ] `07-references/recordings/` has ≥ 90 JSON files
- [ ] `tar -tzf ${BUNDLE}.tar.gz | head` looks sensible

---

## Distribution

- `.tar.gz` of the bundle directory.
- Hand over via whatever channel the team prefers — usually a private cloud drive link or attachment to a kickoff email.
- The bundle is self-contained and offline-usable. No URLs to monorepo internals; no live API dependencies *for reading the docs* (the prototype itself will call the live staging API).

---

## Updating after the workshop

The bundle is a snapshot. If module foundation docs evolve afterwards, the team can:

- Pull the latest from Upmind's published docs site (if/when one exists).
- Or re-run the build script against an updated monorepo checkout and ship a v2 bundle.

The team won't re-run the workshop, but they may iterate the prototype — the bundle stays useful as long as the platform contracts don't shift.
