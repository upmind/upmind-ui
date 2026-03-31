<template>
  <article :class="cn(styles.card.root, props.class)">
    <header :class="styles.card.header.root">
      <!-- TODO: Add favourite action -->

      <div :class="styles.card.header.details.root">
        <section :class="styles.card.header.details.status.root">
          <small
            :class="styles.card.header.details.status.label"
            role="status"
            aria-label="Domain availability status"
          >
            {{ getStatus }}
          </small>

          <Badge
            v-if="meta.isExactMatch && isMobile"
            variant="minimal"
            color="neutral"
            size="sm"
            :label="t('text.exact_match')"
          />
        </section>

        <section :class="styles.card.header.details.title.root">
          <h3 :class="styles.card.header.details.title.fld">
            <span :class="styles.card.header.details.title.sld">
              {{ props.sld }}
            </span>
            <span :class="styles.card.header.details.title.tld">
              {{ props.tld }}
            </span>
          </h3>

          <Badge
            v-if="meta.isExactMatch && !isMobile"
            variant="minimal"
            color="neutral"
            size="md"
            :label="t('text.exact_match')"
          />
        </section>

        <section
          :class="styles.card.header.details.pricing"
          aria-label="Pricing information"
        >
          <DomainDescription
            :price="props.price"
            :meta="meta"
            :cycle="props.cycle"
          />
        </section>
      </div>
    </header>

    <footer :class="styles.card.footer.root">
      <template v-if="meta.isUnavailable">
        <!-- No extra text for unavailable state -->
      </template>
      <template v-else-if="meta.isAvailable">
        <div v-if="!isMobile">
          <Badge
            v-if="props.price.savingPercent"
            variant="muted"
            color="promo"
            :size="meta.isExactMatch ? 'md' : 'sm'"
            :label="
              t('action.save_value', { value: props.price.savingPercent })
            "
          />
        </div>

        <section :class="styles.card.footer.price.root">
          <CurrentPrice
            is="h3"
            :class="styles.card.footer.price.amount"
            :current-price="props.price.currentPrice"
          />

          <small v-if="!props.free" :class="styles.card.footer.price.term"
            >/ {{ parseBillingCycle(props.cycle!).suffix }}</small
          >

          <div class="ml-auto" v-if="isMobile && props.price.savingPercent">
            <Badge
              variant="muted"
              color="promo"
              :size="meta.isExactMatch ? 'md' : 'sm'"
              :label="
                t('action.save_value', { value: props.price.savingPercent })
              "
            />
          </div>
        </section>
      </template>
      <template v-else>
        <p class="text-muted mt-1 text-sm/tight md:mt-0 md:text-right">
          {{ $t("domain.transfer_owner_question")
          }}<br class="hidden md:block" />
          {{
            $t("domain.transfer_price_info", {
              currentPrice: props.price.currentPrice
            })
          }}<br class="hidden md:block" />
          {{ $t("domain.transfer_extension_info") }}
        </p>
      </template>

      <Tooltip :active="!meta.isExactMatch && !isMobile" :label="getTooltip">
        <Button
          :loading="meta.isProcessing"
          :icon="getIcon"
          :class="styles.card.footer.button.root"
          size="lg"
          :variant="meta.isAdded ? 'solid' : 'outline'"
          :color="meta.isAdded ? 'secondary' : 'primary'"
          :disabled="meta.isProcessing || meta.isDisabled"
          @click="
            meta.isAdded ? onRemove(props.domain) : onUpdate(props.domain)
          "
          :label="getLabel"
          :ui-config="
            {
              button: {
                label: styles.card.footer.button.label
              }
            } as any
          "
        />
      </Tooltip>
    </footer>
  </article>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";
import {
  useStyles,
  isMobile,
  Badge,
  Button,
  Tooltip,
  cn
} from "@upmind-automation/upmind-ui";
import config from "../domain.config";

// --- components
import DomainDescription from "./DomainDescription.vue";
import CurrentPrice from "../../product/components/pricing/CurrentPrice.vue";

// --- types
import type { DomainCardProps } from "../types";
import { useI18n } from "vue-i18n";

// -----------------------------------------------------------------------------
const emit = defineEmits<{
  (e: "add", domain: string): void;
  (e: "remove", domain: string): void;
}>();

const props = defineProps<DomainCardProps>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const meta = computed(() => ({
  isDisabled: !!props.disabled || !!props.unavailable,
  isProcessing: !!props.processing,
  isAvailable: !!props.available,
  isAdded: !!props.added,
  isExactMatch: !!props.exactMatch,
  isOwned: !!props.owned,
  isDiscounted: !!props.discounted,
  isUnavailable: !!props.unavailable,
  isTransferable: !!props.canTransfer,
  isHoverDisabled: !!props.disableHover
}));

const styles = useStyles(
  [
    "card",
    "card.header",
    "card.header.details",
    "card.header.details.status",
    "card.header.details.title",
    "card.footer",
    "card.footer.price",
    "card.footer.button"
  ],
  meta,
  config
);

const getStatus = computed(() => {
  if (meta.value.isUnavailable) {
    return t("text.unavailable");
  } else if (meta.value.isOwned) {
    return t("confirm.in_use");
  } else if (meta.value.isAdded) {
    return t("confirm.in_basket");
  } else if (meta.value.isAvailable) {
    return t("text.available");
  } else {
    return t("text.taken");
  }
});

const getIcon = computed(() => {
  if (meta.value.isUnavailable) {
    return "alert-circle";
  } else if (meta.value.isAdded) {
    return "check-circle-broken";
  } else if (meta.value.isAvailable) {
    return "shopping-bag-02";
  } else {
    return "switch-horizontal-02";
  }
});

const getLabel = computed(() => {
  if (meta.value.isUnavailable) {
    return t("text.unavailable");
  } else if (meta.value.isAdded) {
    return t("confirm.in_basket");
  } else if (meta.value.isAvailable) {
    return t("action.add_to_basket");
  }
  return t("domain.transfer_domain");
});

const getTooltip = computed(() => {
  if (meta.value.isUnavailable) {
    return t("text.unavailable");
  } else if (meta.value.isProcessing && !meta.value.isAdded) {
    return t("action.adding");
  } else if (meta.value.isProcessing && meta.value.isAdded) {
    return t("action.removing");
  } else if (meta.value.isAdded) {
    return t("confirm.in_basket");
  } else if (meta.value.isAvailable) {
    return t("action.add_to_basket");
  }
  return t("domain.transfer_domain");
});

function onUpdate(value: string): void {
  if (meta.value.isDisabled || meta.value.isProcessing) return;
  emit("add", value);
}

function onRemove(value: string): void {
  if (meta.value.isDisabled || meta.value.isProcessing) return;
  emit("remove", value);
}
</script>
