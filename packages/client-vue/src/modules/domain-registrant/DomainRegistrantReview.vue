<template></template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import {
  useDomainRegistrant,
  useRoutingEngine
} from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import { Button } from "@upmind-automation/upmind-ui";
import DomainRegistrantCard from "./components/DomainRegistrantCard.vue";

// --- config
import config from "./domain-registrant.config";

// --- utils
import { filter, map } from "lodash-es";
import { toDomainRegistrantStatus } from "./utils";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "edit", productId: string): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
const styles = useStyles(["domainRegistrant.review"], {}, config);
const { navigateNext } = useRoutingEngine();
const { domains, meta } = useDomainRegistrant();

/** Product ID currently being edited inline (null = none) */
const editingProductId = ref<string | null>(null);

// --- computed

/** Convert domain basket products to registrant statuses. */
const statuses = computed(() => map(domains.value, toDomainRegistrantStatus));

/** Count of domains with incomplete registrant data. */
const pendingCount = computed(
  () => filter(statuses.value, status => !status.isComplete).length
);

// --- methods

function onEdit(productId: string): void {
  editingProductId.value = productId;
}

function onInlineSave(): void {
  editingProductId.value = null;
}

function onInlineCancel(): void {
  editingProductId.value = null;
}

function onConfirm(): void {
  if (!meta.value.isComplete) return;
  navigateNext();
}
</script>
