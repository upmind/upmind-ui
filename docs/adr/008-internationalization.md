# ADR 008: Internationalization with Localazy

**Date:** January 2024 (Retroactive)
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

The Upmind platform serves customers globally and requires:

1. Support for 40+ languages
2. External translator access without code knowledge
3. Consistent translations across all applications
4. Runtime language switching
5. Markdown support in translations

---

## Decision

Adopt **vue-i18n** for runtime translation with **Localazy** for translation management and collaboration.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Localazy                           │
│         (Translation management platform)               │
│         Translators edit here                           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ sync
┌─────────────────────────────────────────────────────────┐
│              @upmind-automation/i18n                    │
│              packages/i18n/public/                      │
│              JSON files per locale                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ import
┌─────────────────────────────────────────────────────────┐
│                    Applications                         │
│              cart, hosting, webcentral                  │
│                  vue-i18n runtime                       │
└─────────────────────────────────────────────────────────┘
```

---

## Package Structure

```
packages/i18n/
├── public/
│   ├── en.json           # English (source)
│   ├── de.json           # German
│   ├── fr.json           # French
│   ├── es.json           # Spanish
│   └── ... (40+ locales)
├── src/
│   └── index.ts          # Export utilities
├── localazy.json         # Sync configuration
└── package.json
```

---

## Translation File Format

```json
{
  "button": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save_changes": "Save Changes"
  },
  "error": {
    "required_field": "This field is required",
    "invalid_email": "Please enter a valid email address"
  },
  "confirm": {
    "order_placed": "Your order has been placed successfully"
  }
}
```

### Naming Conventions

Translation keys follow a **hierarchical naming convention** based on context and purpose.

#### Top-Level Namespace Structure

| Namespace | Purpose | Example Key |
| --------- | ------- | ----------- |
| `action` | Action verbs for buttons/links | `action.save`, `action.continue` |
| `button` | Button-specific labels | `button.submit`, `button.add_to_basket` |
| `confirm` | Success/confirmation messages | `confirm.order_placed` |
| `error` | Error messages (non-validation) | `error.network_failed` |
| `label` | Form field labels | `label.email`, `label.password` |
| `placeholder` | Form field placeholders | `placeholder.enter_email` |
| `text` | General text content | `text.no_results`, `text.loading` |
| `title` | Page/section headings | `title.checkout`, `title.my_account` |
| `validation` | Validation error messages | `validation.required`, `validation.email` |

#### Feature-Based Namespaces

Group translations by feature/module using dot notation:

```json
{
  "basket": {
    "title": "Your Basket",
    "empty": "Your basket is empty",
    "item_count": "{count} item | {count} items",
    "button": {
      "checkout": "Proceed to Checkout",
      "continue_shopping": "Continue Shopping"
    }
  },
  "checkout": {
    "title": "Checkout",
    "step": {
      "billing": "Billing Details",
      "payment": "Payment Method",
      "review": "Review Order"
    }
  }
}
```

#### Naming Rules

1. **Use snake_case** for all keys: `add_to_basket`, not `addToBasket`
2. **Use dot notation** for nesting: `basket.button.checkout`
3. **Be specific** in feature context: `basket.title` not just `title`
4. **Use pluralization** with pipes: `{count} item | {count} items`
5. **Prefix actions with verbs**: `action.save`, `action.delete`, `action.confirm`

#### File/Context Mapping

| Context | Namespace | Example |
| ------- | --------- | ------- |
| Basket module | `basket.*` | `basket.item_added` |
| Checkout flow | `checkout.*` | `checkout.step.payment` |
| Client area | `client.*` | `client.profile.title` |
| Domain registration | `domain.*` | `domain.search.placeholder` |
| Product configurator | `product.*` | `product.options.title` |
| Authentication | `auth.*` | `auth.login.title` |
| Forms (generic) | `form.*` | `form.field.required` |

---

## Validation Language Pack

The i18n package includes a **dedicated validation language pack** that integrates with JSON Forms (AJV validation).

### Purpose

JSON Forms uses AJV for validation, which returns error codes like `required`, `format`, `minLength`. The validation language pack maps these to user-friendly messages.

### Structure

```json
{
  "validation": {
    "required": "This field is required",
    "format": {
      "email": "Please enter a valid email address",
      "uri": "Please enter a valid URL",
      "date": "Please enter a valid date",
      "date-time": "Please enter a valid date and time"
    },
    "minLength": "Must be at least {limit} characters",
    "maxLength": "Must be no more than {limit} characters",
    "minimum": "Must be at least {limit}",
    "maximum": "Must be no more than {limit}",
    "pattern": "Invalid format",
    "enum": "Please select a valid option",
    "type": {
      "string": "Must be text",
      "number": "Must be a number",
      "integer": "Must be a whole number",
      "boolean": "Must be true or false",
      "array": "Must be a list",
      "object": "Must be an object"
    },
    "oneOf": "Must match exactly one schema",
    "anyOf": "Must match at least one schema",
    "const": "Must be {allowedValue}",
    "contains": "Must contain a valid item",
    "uniqueItems": "All items must be unique",
    "additionalProperties": "Unknown property: {additionalProperty}"
  }
}
```

### AJV Error Mapping

```typescript
// packages/headless/src/modules/form/validation.ts
function translateAjvError(error: AjvError): string {
  const { t } = useI18n()

  switch (error.keyword) {
    case 'required':
      return t('validation.required')
    case 'format':
      return t(`validation.format.${error.params.format}`)
    case 'minLength':
      return t('validation.minLength', { limit: error.params.limit })
    case 'type':
      return t(`validation.type.${error.params.type}`)
    // ... etc
  }
}
```

### JSON Forms Integration

```typescript
// Custom error translator for JSON Forms
const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

const translateErrors = (errors: ErrorObject[]) => {
  return errors.map(error => ({
    ...error,
    message: translateAjvError(error),
  }))
}
```

> [!IMPORTANT]
> The validation language pack is critical for user experience. All AJV error codes must have corresponding translations, or users will see raw error keywords.

---

## Translation Override Hierarchy

Translations can be overridden at multiple levels, with a clear precedence order:

```
┌─────────────────────────────────────────────────────────┐
│     1. Brand Meta (Backend API)                         │
│        Highest priority - runtime override              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ overrides
┌─────────────────────────────────────────────────────────┐
│     2. App-Level Overrides                              │
│        apps/cart/src/i18n/en.json                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ overrides
┌─────────────────────────────────────────────────────────┐
│     3. @upmind-automation/i18n                          │
│        packages/i18n/public/en.json                     │
│        Base translations (lowest priority)              │
└─────────────────────────────────────────────────────────┘
```

### 1. Base Package Translations

The foundation — all apps consume these by default:

```
packages/i18n/public/
├── en.json    # English base
├── de.json    # German base
└── ...
```

### 2. App-Level Overrides

Each app can override specific keys:

```
apps/cart/
└── src/
    └── i18n/
        └── overrides/
            ├── en.json    # Cart-specific overrides
            └── de.json
```

```json
// apps/cart/src/i18n/overrides/en.json
{
  "basket": {
    "title": "Shopping Cart"  // Overrides "Your Basket"
  },
  "checkout": {
    "button": {
      "complete": "Place My Order"  // Overrides "Complete Order"
    }
  }
}
```

Merging at app initialization:

```typescript
// apps/cart/src/i18n/index.ts
import baseMessages from '@upmind-automation/i18n/public/en.json'
import overrides from './overrides/en.json'
import { merge } from 'lodash-es'

const messages = merge({}, baseMessages, overrides)
```

### 3. Brand Meta Overrides (Backend API)

The **highest priority** — brands can customize translations at runtime:

```typescript
// Brand meta structure from API
interface BrandMeta {
  i18n: {
    en: {
      "basket.title": "My Shopping Bag",
      "button.checkout": "Buy Now"
    }
  }
}
```

Applied at runtime:

```typescript
// packages/headless/src/modules/brand/useI18nOverrides.ts
function applyBrandOverrides(brandMeta: BrandMeta) {
  const { i18n } = brandMeta
  const { mergeLocaleMessage } = useI18n()

  Object.entries(i18n).forEach(([locale, overrides]) => {
    mergeLocaleMessage(locale, expandDotNotation(overrides))
  })
}
```

### Why This Hierarchy?

| Level | Use Case |
| ----- | -------- |
| Package base | Consistent default translations |
| App overrides | App-specific terminology (cart vs portal) |
| Brand meta | Per-brand customization without deploy |

> [!NOTE]
> Brand meta overrides allow white-label customers to customize translations without code changes or redeploys.

---

## Usage in Components

### Basic Translation

```vue
<template>
  <UiButton>{{ t('button.submit') }}</UiButton>
</template>

<script setup>
import { useI18n } from '@upmind-automation/headless'

const { t } = useI18n()
</script>
```

### With Interpolation

```vue
<template>
  <p>{{ t('text.welcome_user', { name: user.name }) }}</p>
</template>
```

```json
{
  "text": {
    "welcome_user": "Welcome, {name}!"
  }
}
```

### Pluralization

```vue
<template>
  <p>{{ t('basket.item_count', { count: items.length }) }}</p>
</template>
```

```json
{
  "basket": {
    "item_count": "{count} item | {count} items"
  }
}
```

### Markdown Support

```vue
<template>
  <div v-html="t('text.terms_notice')" />
</template>
```

```json
{
  "text": {
    "terms_notice": "@.markdown:{'terms.acceptance'}"
  }
}
```

---

## Localazy Integration

### Configuration

```json
// localazy.json
{
  "writeKey": "...",
  "readKey": "...",
  "upload": {
    "type": "json",
    "files": "public/en.json"
  },
  "download": {
    "files": "public/${lang}.json"
  }
}
```

### Workflow

1. **Developers** add new keys to `en.json`
2. **CI** uploads source to Localazy on merge
3. **Translators** use Localazy web UI
4. **CI** downloads translations periodically
5. **Apps** consume updated translations

### Development vs Production Workflow

| Environment | Translation Loading |
| ----------- | ------------------- |
| **Development** | Source `en.json` loaded directly into headless — keys immediately available |
| **Staging/Production** | Apps load from built i18n package — requires CI sync |

In **development mode**, the English source translations are imported directly from `packages/i18n/public/en.json` into the headless package. This means:

- New translation keys are **immediately available** after saving
- No build step required during development
- Fast iteration on UI copy

```typescript
// packages/headless/src/i18n/index.ts (dev mode)
import messages from '@upmind-automation/i18n/public/en.json'

// Direct import for instant availability
export const devMessages = messages
```

For **staging/production**, the standard workflow applies:

1. Commit changes to `en.json`
2. CI uploads to Localazy
3. Translations sync across locales
4. CI downloads and commits updated files
5. Next deploy includes new translations

> [!TIP]
> During development, you can add translation keys and use them immediately. Just remember to commit the `en.json` changes so the production workflow can process them.

---

## Formatting Gotchas

Common issues documented in `packages/i18n/README.md`:

| Issue | Solution |
| ----- | -------- |
| HTML entities (`&amp;`) | Use actual characters |
| Double spaces | Use regex cleanup |
| Missing pipe spaces | Ensure ` | ` format |
| Markdown modifier spacing | Use `@.markdown:{'key'}` exactly |

### Cleanup Regex Examples

```regex
# Find double spaces
Find: (\".*?)( {2,})(.*?\")
Replace: $1 $3

# Fix markdown modifier
Find: @\.markdown\s*:\s*\{\s*'([^'}]+?)'\s*\}
Replace: @.markdown:{'$1'}
```

---

## Consequences

### Positive

1. **Translator-friendly** — Localazy provides intuitive UI
2. **No code access needed** — translators work independently
3. **Centralized** — single source of truth for all apps
4. **Version control** — translations in git history
5. **Markdown support** — rich text in translations
6. **Flexible overrides** — app and brand-level customization
7. **Validation integration** — seamless JSON Forms support

### Negative

1. **Sync latency** — translations not instant
2. **Key management** — unused keys accumulate
3. **Format discipline** — requires regex cleanup
4. **Override complexity** — multiple levels to consider

### Neutral

1. **External dependency** — relies on Localazy service

---

## Related Documents

- [packages/i18n/README.md](../../packages/i18n/README.md) — Formatting gotchas
- [ADR 004: Monorepo Structure](./004-monorepo-structure.md)
