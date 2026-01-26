# Code Review Preferences

This file configures AI code review behavior for this workspace.
These preferences define the team's coding standards.

## Review Focus Areas

### Code Quality

- **clarity**: Prefer clear, self-documenting code over clever solutions
- **simplicity**: Flag overly complex functions (>30 lines or >3 nesting levels)
- **duplication**: Identify repeated code patterns that could be extracted
- **naming**: Enforce descriptive, consistent naming conventions

### TypeScript Best Practices

- **strict_types**: All functions must have explicit parameter and return types
- **no_any**: Avoid `any` type - use proper types or `unknown`
- **types_over_interfaces**: Prefer `type` over `interface` for all type definitions
- **const_assertions**: Use `as const` for immutable values

### DEVX.md Alignment

- **lodash_over_native**: Use Lodash for all array/object operations (`map`, `filter`, `find`, `reduce`)
- **section_grouping**: Group code by `// --- state`, `// --- context`, `// --- private`, `// --- methods`, `// --- utils`
- **jsdoc_in_return**: JSDoc comments only above properties in the return object
- **no_direct_state_access**: Use Upmind utilities, never `state.context` or `state.matches` directly
- **return_type_export**: Every composable must export its return type
- **canonical_names**: Use standard names (`context`, `errors`, `meta`) - no renaming

### Vue/Nuxt Conventions

- **composition_api**: Use `<script setup lang="ts">`
- **composable_naming**: Composables must be named `useSomething`
- **auto_imports**: Don't add unnecessary imports (Nuxt auto-imports)
- **props_typing**: Props must be typed with `defineProps<T>()`
- **model_typing**: Models must be typed with `defineModel<T>()`

### Vue Component Structure

**SFC Order** (strict):

1. `<template>` (template first, always)
2. `<script setup lang="ts">`
3. NO `<style>` blocks - use CVA instead

**Script Setup Organization Order**:

1. Imports (grouped with comments)
2. Props/Emits/Models definitions
3. Composables
4. Refs/Reactive state
5. Computed properties
6. Watchers
7. Functions/Methods
8. Lifecycle hooks

**Import Order** (with section comments):

```typescript
//--- external
import { ref, computed } from 'vue'

//--- internal
import { useAuth } from '~/modules/auth/useAuth'

//--- components
import AuthLoginForm from './components/AuthLoginForm.vue'

//--- utils
import { formatDate } from '~/utils/formatDate'

//--- types
import type { User } from '~/modules/auth/auth.types'

//------------------------------------------------------------------------------
```

**Component Naming**: PascalCase.vue (Vue standard)

### Module Structure

Organize code by **modules** (self-contained feature areas):

```
modules/
  auth/
    AuthPage.vue              # Main component
    auth.service.ts           # Prefixed with module name
    auth.types.ts
    auth.machine.ts           # XState machine
    useAuth.ts                # Composable
    auth.styles.ts            # CVA styles
    components/
      AuthLoginForm.vue       # Module-scoped components
      AuthSignupForm.vue
```

- Each file prefixed with module name (not generic names)
- Self-contained: services, types, composables, components together
- Flat structure within module when possible

**Non-UI / Library Packages** follow the same module structure:

```
packages/
  core/
    modules/
      validation/
        validation.service.ts
        validation.types.ts
        validation.utils.ts
        validation.spec.ts     # Tests co-located
        index.ts               # Public exports

      http/
        http.client.ts
        http.types.ts
        http.interceptors.ts
        index.ts
```

- Same naming convention: prefix files with module name
- Export public API via `index.ts`
- Co-locate tests with source files

### XState Conventions

- **machine_file_naming**: State machines named `{feature}.machine.ts`
- **action_naming**: Actions named descriptively (`updateBasket`, `setError`, `clearActors`)
- **guard_naming**: Guards prefixed with `has`, `is`, `can` (`hasProducts`, `canCheckout`)
- **service_separation**: Services in separate `services.ts` file
- **spawn_helpers**: Helper functions for spawning actors (`spawnBilling`, `spawnCurrency`)
- **context_typing**: Machine context must have explicit type (`context: {} as BasketContext`)
- **event_naming**: Events in SCREAMING_SNAKE_CASE (`REFRESH`, `PREFRESH`, `CHECKOUT`)
- **state_organization**: Use parallel states for independent concerns
- **smart_merge**: Use `defaultsDeep` for partial updates, match arrays by ID not index
- **actor_refresh**: Actors refreshed via `send({ type: "REFRESH", data })` pattern

### CSS / Styling (Tailwind + CVA)

- **tailwind_cva**: Always use Tailwind with CVA (Class Variance Authority)
- **no_inline_classes**: NO inline Tailwind classes in templates
- **no_style_blocks**: NO `<style>` blocks in SFCs
- **no_inline_styles**: NO inline style attributes ever
- **no_adhoc_values**: NO arbitrary Tailwind values like `w-[123px]` - use defined tokens only
- **separate_styles**: All CVA styles in dedicated `.styles.ts` files

**CVA Pattern** (separate file + useStyles helper):

```typescript
// Button.styles.ts - CVA config (separate file)
import { cva, type VariantProps } from 'class-variance-authority'

export const buttonStyles = cva('base-classes', {
  variants: {
    variant: { primary: '...', secondary: '...' },
    size: { sm: '...', md: '...', lg: '...' }
  },
  defaultVariants: { variant: 'primary', size: 'md' }
})

export type ButtonStyleProps = VariantProps<typeof buttonStyles>
```

```typescript
// useStyles.ts - Helper composable (shared utility)
import { computed, type ComputedRef } from 'vue'
import type { VariantProps } from 'class-variance-authority'

export function useStyles<T extends (...args: any) => string>(
  cvaConfig: T,
  props: ComputedRef<VariantProps<T>> | VariantProps<T>
) {
  return computed(() => {
    const variantProps = 'value' in props ? props.value : props
    return cvaConfig(variantProps)
  })
}
```

```vue
<!-- Button.vue - Uses styles via useStyles helper -->
<template>
  <button :class="styles">
    <slot />
  </button>
</template>

<script setup lang="ts">
//--- internal
import { useStyles } from '~/composables/useStyles'

//--- styles
import { buttonStyles, type ButtonStyleProps } from './Button.styles'

//------------------------------------------------------------------------------

const props = defineProps<ButtonStyleProps>()

const styles = useStyles(buttonStyles, computed(() => props))
</script>
```

### Template Formatting

- **multiline_threshold**: Multi-line attributes when line exceeds 80 characters
- **single_root**: Templates should have single root element when possible
- **semantic_html**: Use semantic HTML elements (`<nav>`, `<article>`, etc.)

### Security

- **no_secrets**: No hardcoded API keys, passwords, or tokens
- **no_eval**: No `eval()` or `Function()` constructor
- **input_validation**: User inputs must be validated/sanitized
- **safe_regex**: Flag potentially catastrophic regex patterns

### Performance

- **no_blocking**: Avoid blocking operations in reactive code
- **lazy_loading**: Large components should be lazy-loaded
- **memo_expensive**: Expensive computations should use `computed()`
- **optimal_build**: Large build packages should be split as much as possible and tree shaking must be implemented

### Documentation

- **jsdoc_public**: Public functions/exports must have JSDoc
- **readme_updates**: Changes to public API should update README
- **changelog**: Breaking changes must be documented
- **ard**: All Architectural decisions need to be documented

## Acceptance Criteria Validation

When reviewing code:

1. Extract acceptance criteria from the linked issue
2. Check each criterion against the code changes
3. Mark each as ✅ Satisfied or ❓ Needs verification

## Severity Levels

- 🔴 **Blocker**: Must fix before merge (security, breaking bugs)
- 🟠 **Warning**: Should fix (quality, performance issues)
- 🟡 **Suggestion**: Nice to have (style, minor improvements)
- 🟢 **Praise**: Highlight good patterns as examples for the team
