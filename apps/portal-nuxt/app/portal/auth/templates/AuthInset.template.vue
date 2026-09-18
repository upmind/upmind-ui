<template>
  <PortalAuthShell>
    <Page width="reading">
      <PageHeader v-if="$slots.back">
        <slot name="back" />
      </PageHeader>

      <PageBody>
        <Card :ui="{ content: LOGGED_OUT_CARD_CONTENT_CLASS }">
          <slot name="form" />
        </Card>
      </PageBody>
    </Page>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// The one-page flow's card — what develop's `SessionInset.template.vue` draws on
// the cart's centred Inset layout with `:aside="false"`: a back row, one card,
// and no summary beside it.
import { Card, Page, PageBody, PageHeader } from "@upmind/ui";
import PortalAuthShell from "../PortalAuthShell.vue";
import { LOGGED_OUT_CARD_CONTENT_CLASS } from "~/portal/shell/variants";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
