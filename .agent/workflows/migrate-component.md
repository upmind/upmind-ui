---
description: Migrate a single component from one UI framework to another
---

# Migrate Component Workflow

Use this workflow when migrating individual components between UI frameworks (e.g., Vuetify → shadcn, Material → Tailwind).

## Configuration

Identify your migration:

- **Source framework:** [e.g., Vuetify, Material-UI]
- **Target framework:** [e.g., shadcn/vue, Radix]
- **Component location:** [e.g., components/, src/ui/]

## Steps

### 1. Identify Component

Ask user:

```
Which component are you migrating?
- Component name: [e.g., Button, Card]
- Current location: [path]
```

### 2. Analyze Current Usage

// turbo
Find all usages of the component:

```bash
# Adjust pattern for your framework
grep -r "v-btn\|VBtn\|<Button" --include="*.vue" --include="*.tsx" . | head -20
```

Document:

- Usage count
- Common props used
- Custom modifications

### 3. Check Target Equivalent

Create a mapping table:

| Source | Target | Notes |
|--------|--------|-------|
| v-btn | Button | Direct mapping |
| v-card | Card | CardHeader, CardContent |
| v-text-field | Input | Needs wrapper |

### 4. Design New Component API

```typescript
// Proposed new API
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  disabled?: boolean
  loading?: boolean
}
```

Map old props to new:

```
Old → New
color="primary" → variant="default"
outlined → variant="outline"
small → size="sm"
```

### 5. Generate/Create Component

// turbo
If using a component library CLI:

```bash
npx shadcn-vue@latest add button
# or
npx shadcn-ui@latest add button
```

### 6. Create Wrapper (If Needed)

If extending for project-specific features:

```vue
<script setup>
import { Button } from '@/components/ui/button'

const props = defineProps({
  // Standard props
  variant: String,
  size: String,
  // Custom additions
  loading: Boolean,
  icon: String,
})
</script>

<template>
  <Button :variant="variant" :size="size" :disabled="loading">
    <Loader v-if="loading" class="animate-spin" />
    <slot v-else />
  </Button>
</template>
```

### 7. Migrate Usages

For each usage:

1. Update imports
2. Update props
3. Update v-model bindings
4. Update event handlers

```vue
<!-- Before -->
<v-btn color="primary" @click="save" :loading="saving">
  Save
</v-btn>

<!-- After -->
<Button variant="default" @click="save" :disabled="saving">
  <Loader v-if="saving" class="animate-spin mr-2" />
  Save
</Button>
```

### 8. Create Story (Optional)

```typescript
// ComponentName.stories.ts
export default {
  component: Button,
  tags: ['autodocs'],
}

export const Default = {
  args: { default: 'Click me' },
}

export const Loading = {
  args: { loading: true, default: 'Loading...' },
}
```

### 9. Verify

// turbo

```bash
npm run build
npm run storybook
npm run test
```

### 10. Update Migration Tracker

```markdown
## Component Migration Progress

| Component | Source | Target | Status |
|-----------|--------|--------|--------|
| Button | v-btn | Button | ✅ |
| Card | v-card | Card | 🔵 |
| Input | v-text-field | Input | 🔵 |
```

## Quick Migrate

```
Migrate [Component] from [Source] to [Target]. Find usages, create component, update all usages.
```

## Notes

- Migrate all components before removing old framework
- Test in actual pages, not just isolation
- Preserve all functionality
- Document API changes
