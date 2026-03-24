<template>
  <section class="flex w-full flex-col gap-6" data-testid="registrant-review">
    <header class="flex flex-col gap-1">
      <h3 class="text-fg-primary text-lg font-semibold">
        {{ t("domain.registrant_review_title") }}
      </h3>
      <p class="text-fg-tertiary text-sm">
        {{ t("domain.registrant_review_msg") }}
      </p>
    </header>

    <!-- Domain registrant cards -->
    <div class="flex flex-col gap-4" v-auto-animate>
      <RegistrantCard
        v-for="status in statuses"
        :key="status.productId"
        :status="status"
        @edit="onEdit"
      />
    </div>

    <!-- Summary -->
    <div v-if="pendingCount > 0" class="bg-utility-warning-25 rounded-lg p-3">
      <p class="text-utility-warning-700 text-sm">
        {{ t("domain.registrant_pending_msg", { count: pendingCount }) }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <Button
        :label="t('action.confirm_and_continue')"
        icon-append="arrow-right"
        color="primary"
        size="lg"
        block
        :disabled="!isComplete"
        @click="onConfirm"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import {
  useDomainRegistrant,
  useRoutingEngine
} from "@upmind-automation/headless";

// --- components
import { Button } from "@upmind-automation/upmind-ui";
import RegistrantCard from "./RegistrantCard.vue";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "edit", productId: string): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { navigateNext } = useRoutingEngine();
const { isComplete, pendingCount, statuses } = useDomainRegistrant();

// --- methods

function onEdit(productId: string): void {
  emit("edit", productId);
}

function onConfirm(): void {
  if (!isComplete.value) return;
  navigateNext();
}
</script>
