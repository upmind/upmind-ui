<template>
  <PortalAuthShell>
    <Page width="reading">
      <PageHeader v-if="$slots.hero">
        <slot name="hero" />
      </PageHeader>

      <PageBody>
        <slot name="form" />
      </PageBody>
    </Page>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// One full-width column — what develop's `SessionEnclosed.template.vue` draws on
// the cart's SPLIT_VERTICAL layout: stacked surface rows, no aside and no card.
// The cart places no markdown here, so this template places no note.
import { Page, PageBody, PageHeader } from "@upmind/ui";
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
