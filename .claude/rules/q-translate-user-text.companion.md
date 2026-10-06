---
id: q-translate-user-text
paths:
  - 'packages/**/*.{ts,tsx,vue}'
  - 'apps/**/*.{ts,tsx,vue}'
---
# Upmind monorepo bindings

- The i18n package is `packages/i18n`. Its conventions are in `packages/i18n/CLAUDE.md`.
- Add a key only under `packages/i18n/src/`. Never edit `public/locales/`, because Localazy writes it.
- An operation, alert or error message goes in `src/core/error-en.json`, read with `t("error.<key>")`.
