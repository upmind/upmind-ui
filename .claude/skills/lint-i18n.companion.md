> Companion to the upmind-agent skill /lint-i18n — Upmind-monorepo-specific bindings/overrides.

## Sync trigger

The translation-management sync in this repo is `pnpm localazy`. Run the lint after
**every** `pnpm localazy` in any app.

## Scope bindings (`$LOCALE_DIRS`)

**Default (source of truth):**

```bash
LOCALE_DIRS="packages/i18n/public/locales/"
```

If this package is clean, the app locales will be clean after sync.

**App locales — expand only if the user says "check all" or names an app:**

```bash
LOCALE_DIRS="packages/i18n/public/locales/ apps/cart/src/assets/locales/ apps/cart-nuxt/src/assets/locales/ apps/hosting/src/assets/locales/ apps/velia/src/assets/locales/"
```

## Gotchas reference doc (`$GOTCHAS_DOC`)

The canonical gotchas reference is `packages/i18n/README.md`. Read it at step 2:

```bash
cat packages/i18n/README.md
```

When a new gotcha is discovered, add it to **both** the base skill workflow AND
`packages/i18n/README.md`.

## Special-file verification (step 15)

- Special file: `term.json` — key sets must match across locales.
- Canonical locale directory: `packages/i18n/public/locales/en`.

For every locale that changed, diff its `term.json` keys against the English canonical:

```bash
diff <(jq -S 'keys' packages/i18n/public/locales/en/term.json) <(jq -S 'keys' packages/i18n/public/locales/fr/term.json) || echo "⚠️ Key mismatch in fr/term.json"
```

Repeat for each changed locale (swap `fr` for the locale). Keys should match; values
differ but formatting rules still apply.
