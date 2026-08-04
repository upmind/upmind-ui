<template>
  <aside v-show="meta.isOpen" :class="styles.inspector.root">
    <header>
      <!-- Close Button -->
      <Button
        :class="styles.inspector.toggleButton"
        variant="subtle"
        color="secondary"
        size="sm"
        icon="x-close"
        icon-only
        @click="open = false"
      />

      <!-- Empty state when no sections registered -->
      <div v-if="!hasSections" :class="styles.inspector.tabs">
        <p class="text-muted p-4 text-center text-sm">
          No debug sections registered
        </p>
      </div>
    </header>

    <!-- Tabs with content (multi-section) -->
    <Tabs
      v-model="activeSection"
      :tabs="tabItems"
      :class="styles.inspector.tabs"
    >
      <!-- Dynamic content slots for each section -->
      <template
        v-for="section in sections"
        :key="section.name"
        #[`content.${section.name}`]
      >
        <div :class="styles.inspector.content">
          <!-- Scope Section -->
          <div v-if="section.scope" :class="styles.inspector.section">
            <div :class="styles.inspector.sectionHeader">
              <h2 :class="styles.inspector.sectionTitle">Scope</h2>
            </div>
            <div :class="styles.inspector.metaList">
              <!-- Self indicator -->
              <Badge
                v-if="section.scope.actor === ScopeActorTypes.SELF"
                variant="solid"
                size="sm"
                color="primary"
                append-icon="chevron-right"
              >
                {{ formatScopeLabel(ScopeActorTypes.SELF) }}
              </Badge>
              <!-- Active scope -->
              <Badge variant="solid" size="sm" color="primary">
                {{ formatScopeLabel(section.scope.actor) }}
              </Badge>
            </div>
            <!-- Matrix display -->
            <Collapsible :class="styles.inspector.collapsible">
              <CollapsibleTrigger as-child>
                <button :class="styles.inspector.collapsibleTrigger">
                  Matrix
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div :class="styles.inspector.scopeMatrix">
                  <div
                    v-for="(contexts, actor) in section.scope.matrix"
                    :key="actor"
                    :class="styles.inspector.scopeMatrixRow"
                  >
                    <span :class="styles.inspector.scopeMatrixActor">
                      {{ formatScopeLabel(actor) }}
                    </span>
                    <span :class="styles.inspector.scopeMatrixArrow">→</span>
                    <span :class="styles.inspector.scopeMatrixContexts">
                      {{
                        formatMatrixContexts(
                          contexts as string | string[] | undefined
                        )
                      }}
                    </span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <!-- State -->
          <div
            v-if="section.state !== undefined"
            :class="styles.inspector.section"
          >
            <div :class="styles.inspector.sectionHeader">
              <h2 :class="styles.inspector.sectionTitle">State</h2>
            </div>
            <div :class="styles.inspector.metaList">
              <template
                v-for="(segment, index) in getStateSegments(section.state)"
                :key="index"
              >
                <Badge variant="solid" color="promo" size="sm">
                  {{ segment }}
                </Badge>
              </template>

              <!-- Error collapsible -->
              <Collapsible
                v-if="getErrorCount(section.errors)"
                :class="styles.inspector.collapsible"
              >
                <CollapsibleTrigger as-child>
                  <Badge
                    variant="solid"
                    size="sm"
                    color="danger"
                    class="cursor-pointer"
                  >
                    {{ getErrorCount(section.errors) }}
                    {{
                      getErrorCount(section.errors) === 1 ? "Error" : "Errors"
                    }}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre :class="styles.inspector.errorPre">{{
                    formatError(section.errors)
                  }}</pre>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          <!-- Meta Section -->
          <div
            v-if="section.meta && size(keys(section.meta))"
            :class="styles.inspector.section"
          >
            <MetaPanel :meta="resolveMetaFlags(section.meta)" />
          </div>

          <!-- Context Section -->
          <div
            v-if="getVisibleContextItems(section.context).length"
            :class="styles.inspector.section"
          >
            <div :class="styles.inspector.sectionHeader">
              <h2 :class="styles.inspector.sectionTitle">Context</h2>
            </div>
            <div :class="styles.inspector.contextList">
              <Collapsible
                v-for="item in getVisibleContextItems(section.context)"
                :key="item.key"
                :class="styles.inspector.collapsible"
              >
                <CollapsibleTrigger as-child>
                  <button :class="styles.inspector.collapsibleTrigger">
                    {{ formatKey(item.key) }}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre :class="styles.inspector.contextPre">{{
                    item.value
                  }}</pre>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          <!-- Default slot for extra content -->
          <slot />
        </div>
      </template>
    </Tabs>
  </aside>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module inspector/Inspector
 * @description Inspector component for displaying machine state, meta, and context.
 */

import { ref, computed, unref, watch } from "vue";
import { ScopeActorTypes } from "@upmind-automation/headless";
import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tabs,
  useStyles
} from "@upmind-automation/upmind-ui";
import MetaPanel from "../factory/MetaPanel.vue";
import config from "./inspector.styles";
import { useInspector } from "./useInspector";
import {
  capitalize,
  entries,
  filter,
  flatMap,
  isArray,
  isObject,
  isString,
  join,
  keys,
  map,
  reduce,
  size,
  split,
  startCase,
  values
} from "lodash-es";
import type { ContextItem } from "./inspector.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------

const {
  sections: registeredSections,
  hasSections,
  isOpen: open
} = useInspector();

// --- state
const activeSection = ref("");

// --- styles
const meta = computed(() => ({ isOpen: open.value }));
const styles = useStyles(["inspector"], meta, config);

// --- computed
/** Get sections from the global registry */
const sections = registeredSections;

/** Convert sections to Tabs component format */
const tabItems = computed(() =>
  map(sections.value, section => ({
    value: section.name,
    label: section.name
  }))
);

// Set initial active section and reset when sections change
watch(
  sections,
  newSections => {
    if (newSections.length > 0) {
      // Reset to first section if current selection is not in the new sections
      const sectionNames = map(newSections, "name");
      if (!activeSection.value || !sectionNames.includes(activeSection.value)) {
        activeSection.value = newSections[0].name;
      }
    }
  },
  { immediate: true }
);

// --- methods
/** Format key using lodash startCase for readability */
function formatKey(key: string): string {
  return startCase(key);
}

/** Get visible context items, filtering out empty ones if hideIfEmpty is set */
function getVisibleContextItems(
  context?: Record<string, unknown | ContextItem>
) {
  if (!context) return [];

  return map(
    filter(entries(context), ([, item]) => {
      if (item && typeof item === "object" && "hideIfEmpty" in item) {
        const contextItem = item as ContextItem;
        if (contextItem.hideIfEmpty) {
          const value = contextItem.value;
          return value !== null && value !== undefined && value !== "";
        }
        return true;
      }
      return true;
    }),
    ([key, item]) => ({
      key,
      value:
        item && typeof item === "object" && "value" in item
          ? (item as ContextItem).value
          : item
    })
  );
}

/** Unrefs every meta value (MetaPanel's contract is plain booleans) and drops any still-undefined entry. */
function resolveMetaFlags(
  sectionMeta?: Record<string, boolean | ComputedRef<boolean> | undefined>
): Record<string, boolean> {
  if (!sectionMeta) return {};
  return reduce(
    entries(sectionMeta),
    (acc, [key, value]) => {
      const resolved = unref(value);
      if (resolved !== undefined) acc[key] = resolved;
      return acc;
    },
    {} as Record<string, boolean>
  );
}

/** Get error count from error object */
function getErrorCount(error: unknown): number {
  if (!error) return 0;
  if (isArray(error)) return size(error);
  if (isObject(error) && "details" in error && isArray(error.details)) {
    return size(error.details);
  }
  return 1;
}

/** Format error for display */
function formatError(error: unknown): string {
  if (!error) return "";
  return JSON.stringify(error, null, 2);
}

/** Convert state to segments for display. Handles both string states ("a.b.c") and object states ({a: "b", c: "d"}) */
function getStateSegments(state: unknown): string[] {
  if (!state) return ["unknown"];

  // Handle string states like "available.checking"
  if (isString(state)) {
    return map(split(state, "."), segment => startCase(segment));
  }

  // Handle object states (parallel states) like { login: "form", session: "active" }
  if (isObject(state) && !isArray(state)) {
    return flatMap(entries(state as Record<string, unknown>), ([key, value]) =>
      isString(value)
        ? [`${startCase(key)}: ${startCase(value)}`]
        : [startCase(key)]
    );
  }

  // Fallback
  return [String(state)];
}

/**
 * Explicit scope labels for display.
 * Built dynamically from ScopeActorTypes enum using lodash values().
 */
const SCOPE_LABELS: Record<string, string> = values(ScopeActorTypes).reduce(
  (acc, value) => {
    // Map enum values to display labels (capitalize for display)
    acc[value] = startCase(value);
    return acc;
  },
  {} as Record<string, string>
);

/** Format scope label using explicit mapping */
function formatScopeLabel(scope: string): string {
  return SCOPE_LABELS[scope] ?? capitalize(scope);
}

/** Format matrix contexts for display */
function formatMatrixContexts(
  contexts: never | string | string[] | undefined
): string {
  if (!contexts) return "—";
  if (isArray(contexts)) {
    return join(
      map(contexts, c => formatScopeLabel(c)),
      ", "
    );
  }
  return formatScopeLabel(contexts);
}
</script>
