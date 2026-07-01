# packages/i18n

Translation source for the apps. The cart/client apps read locale strings from here.

## Edit `src/` only — never `public/locales/`

Only edit the **source** files under `packages/i18n/src/` (e.g. `src/modules/auth-en.json`, `src/core/form-en.json`). The `public/locales/**` tree is **downloaded from Localazy** (`src` = upload source, `public/locales` = download target, per `localazy.json`) — hand edits there get reverted on the next `download`.

The app reads `public/locales` at runtime, so a new key may not appear locally until a sync. That's expected — a sync-timing gap, not something to "fix" by editing `public/locales`.

## Where each kind of string lives

**Operation / alert / error messages → `src/core/error-en.json`**, as flat `snake_case` keys, referenced via `t("error.<key>")`. Keep the file alphabetically ordered and prefix every key by context (`session_`, `client_email_`, `basket_`, …).

Session/auth alert titles follow the `session_{form}_failed` convention: `session_login_failed`, `session_register_failed`, `session_recover_failed`, `session_verify_failed`, `session_resend_failed`.

**Per-field form config → `src/core/form-en.json`** — `description` / `label` / `placeholder` / per-field validation `error` ONLY. Never put operation or alert-title messages here.

> The pre-existing `form.login.error` / `form.register.error` / `form.recover.error` keys are a known mistake — they mislead by example. Don't copy the pattern (e.g. don't add `form.verify.error`); add the message to `error-en.json` instead, reusing an existing key if one fits (e.g. `client_email_verify_failed`).
