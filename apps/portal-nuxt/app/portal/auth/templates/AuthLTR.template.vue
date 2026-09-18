<template>
  <PortalAuthShell>
    <Page width="wide">
      <PageHeader v-if="$slots.hero">
        <slot name="hero" />
      </PageHeader>

      <PageBody :aside="$slots.summary ? 'right' : 'none'">
        <slot name="form" />

        <PageAside v-if="$slots.summary" ariaLabel="Summary">
          <slot name="summary" />
        </PageAside>
      </PageBody>
    </Page>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// Two columns, the form leading — what develop's `SessionLTR.template.vue`
// draws on the cart's TWO_COLUMN_LTR layout: a fluid form column beside a fixed
// aside, both stacked below `lg`. `Page`'s own `aside="right"` is that grid.
// The cart places no markdown here, so this template places no note. The
// aside only exists when something fills it: an empty track would reserve a
// fifth of the page for nothing.
import { Page, PageAside, PageBody, PageHeader } from "@upmind/ui";
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
