<template>
  <component
    :is="meta.component"
    v-if="meta.kind === 'module'"
    :variant="meta.variant"
    v-bind="meta.props"
    @select="onModuleSelect"
  />
  <PortalSection
    v-else-if="meta.kind === 'group'"
    :surface="meta.surface"
    :header="meta.header"
  >
    <div
      v-bind="useTestAttrs({ key: 'portal-module-group', value: meta.axis })"
      data-slot="portal-module-group"
      :class="portalGroupClass(meta.axis)"
    >
      <PortalSlotContent
        v-for="(member, index) in meta.members"
        :key="index"
        :resolved-slot="member"
        :collapsed="props.collapsed"
      />
    </div>
  </PortalSection>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/shell/PortalSlotContent
 * @description Renders one resolved slot (design.md §D5, §D6). `empty` and
 * `rejected` render nothing; `rejected` also dev-logs its reason — the loud
 * console error AC1.3/AC2.2 need, kept out of the pure resolver. `group`
 * recurses over its members on the group's own axis, never gating on the host
 * slot itself (F2 — that check already happened one level up, in resolve()).
 * A group carrying `surface`/`header` wears `PortalSection` — the boards'
 * `card.*` tiles are groups presented as cards; a bare group passes through
 * `PortalSection`'s bare branch and renders exactly as before.
 */
import { useTestAttrs } from "@upmind/ui";
import { computed, watchEffect } from "vue";
import PortalSection from "../content/PortalSection.vue";
import { resolveDataRefProps } from "../mock/data-refs";
import { injectActiveMockData, injectRouteContext } from "../mock/injection";
import { getModuleDescriptor } from "../registry";
import { portalGroupClass } from "./variants";
import type { RowSurface } from "../content/types";
import type { ResolvedRowHeader, ResolvedSlot } from "../resolve";
import type { GroupAxis } from "../types";
import type { PortalSlotContentProps } from "./types";
import type { Component } from "vue";
import { useMockActionRunner } from "~/composables/useMockActionRunner";

defineOptions({ name: "PortalSlotContent" });

const props = defineProps<PortalSlotContentProps>();

// The data-ref resolution seam (mock/data-refs.ts): module props may name
// live mock data; the active shape's dataset answers, provided by the layout
// and the page host (mock/injection.ts). A bare unit mount has no provider
// and reads "no dataset", so literal props keep working there.
const activeData = injectActiveMockData();
const routeContext = injectRouteContext();

// The action seam's other half (mock/actions.ts): a module's `select` emit
// runs the mutation through its facade, and the result names the feedback
// (composables/useMockActionRunner.ts). Without a dataset (a bare unit mount)
// every emit is a no-op.
const { run: runMockAction } = useMockActionRunner(
  () => activeData.value,
  () => routeContext.value
);

async function onModuleSelect(value: unknown) {
  if (typeof value !== "string") return;
  await runMockAction(value);
}

type SlotMeta =
  | { readonly kind: "empty" }
  | { readonly kind: "rejected"; readonly reason: string }
  | {
      readonly kind: "module";
      readonly component?: Component;
      readonly variant?: string;
      readonly props?: Readonly<Record<string, unknown>>;
    }
  | {
      readonly kind: "group";
      readonly axis: GroupAxis;
      readonly members: readonly ResolvedSlot[];
      readonly surface?: RowSurface;
      readonly header?: ResolvedRowHeader;
    };

const meta = computed<SlotMeta>(() => {
  const resolvedSlot = props.resolvedSlot;
  if (resolvedSlot === undefined) return { kind: "empty" };
  if (resolvedSlot.status === "rejected") {
    return { kind: "rejected", reason: resolvedSlot.reason };
  }
  if (resolvedSlot.status === "group") {
    return {
      kind: "group",
      axis: resolvedSlot.axis,
      surface: resolvedSlot.surface,
      header: resolvedSlot.header,
      members: resolvedSlot.members
    };
  }
  const descriptor = getModuleDescriptor(resolvedSlot.id);
  return {
    kind: "module",
    component: descriptor?.component,
    variant: resolvedSlot.variant,
    // `collapsed` joins the spread only for a module whose descriptor asks for
    // it. Binding it to every module made the ten that never declared it take
    // it as a FALLTHROUGH attribute — `collapsed="false"` on their root node in
    // production HTML, 13 of them on /account alone. Which modules read the
    // rail's state is data on the descriptor, not a guess here.
    props: resolveDataRefProps(
      descriptor?.readsCollapsed
        ? { ...resolvedSlot.props, collapsed: props.collapsed }
        : resolvedSlot.props,
      activeData.value,
      routeContext.value
    )
  };
});

// Development-only, and the whole reason this lives beside the render rather
// than in resolve.ts: a pure resolver that logged would not be pure, and
// import.meta.dev strips this call (and the branch) from a production build
// entirely — quiet in production, loud in development (§D5, AC1.3, AC2.2).
watchEffect(() => {
  if (import.meta.dev && meta.value.kind === "rejected") {
    console.error(`[portal] ${meta.value.reason}`);
  }
});
</script>
