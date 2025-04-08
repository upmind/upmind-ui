<template>
  <article :class="styles.domain.card.root">
    <header :class="styles.domain.card.header">
      <Icon
        :icon="getContent.icon"
        size="xs"
        :class="styles.domain.card.icon"
      />

      <div :class="styles.domain.card.content">
        <h6 :class="styles.domain.card.label">
          {{ getContent.label }}
        </h6>

        <section :class="styles.domain.card.container">
          <div :class="styles.domain.card.title">
            <h2 :class="styles.domain.card.sld">
              {{ props.sld
              }}<strong :class="styles.domain.card.tld">
                {{ props.tld }}
              </strong>
            </h2>
          </div>

          <Promotion
            v-if="meta.isAvailable"
            :class="styles.domain.card.promotion"
            :meta="summary?.meta"
            :saving-amount="summary?.savingAmount"
            :saving-price="summary?.savingPrice"
            :saving-percent="summary?.savingPercent"
            code=""
            size="md"
          />
        </section>

        <DomainDescription
          v-if="meta.isAvailable"
          :domain="domain"
          :summary="summary"
          :isOwned="isOwned"
          :inBasket="inBasket"
          :tld="tld"
          @update="onUpdate"
          code=""
        />
      </div>
    </header>

    <footer :class="styles.domain.card.footer.root">
      <DomainPrices v-if="meta.isAvailable" :summary="summary" />

      <DomainActions
        :domain="domain"
        :isOwned="isOwned"
        :inBasket="inBasket"
        :selected="selected"
        :summary="summary"
        :type="type"
        :disabled="meta.isDisabled"
        :processing="meta.isProcessing"
        :tld="tld"
        @update="onUpdate"
        @remove="onRemove"
      />
    </footer>
  </article>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../domain.config";
import { useBasketProduct } from "@upmind-automation/headless-vue";

// --- components
import { Icon, Badge, Button, Link } from "@upmind-automation/upmind-ui";
import Promotion from "../../basket/product/components/Promotion.vue";
import DomainActions from "./DomainActions.vue";
import DomainDescription from "./DomainDescription.vue";
import DomainPrices from "./DomainPrices.vue";

// --- types
import type { ComputedRef } from "vue";
import type { DomainCardProps } from "../types";
// -----------------------------------------------------------------------------
const emit = defineEmits<{
  (e: "update:selected", domain: string): void;
  (e: "remove", domain: string): void;
}>();

const props = withDefaults(defineProps<DomainCardProps>(), {
  color: "base",
});

// ---

const { t } = useI18n();

const meta = computed(() => ({
  isDisabled: props.disabled,
  isProcessing: props.processing,
  isAvailable: props.summary.meta.available,
}));

const styles = useStyles(
  ["domain.card", "domain.card.footer"],
  meta,
  config
) as ComputedRef<{
  domain: {
    card: {
      root: string;
      header: string;
      icon: string;
      content: string;
      container: string;
      label: string;
      title: string;
      sld: string;
      tld: string;
      promotion: string;
      footer: {
        root: string;
      };
    };
  };
}>;

const getContent = computed(() => {
  if (props.isOwned) {
    return {
      icon: "lock",
      label: t("domain.card.owned.label"),
    };
  } else if (props.inBasket) {
    return {
      icon: "check-circle-solid",
      label: t("domain.card.basket.label"),
    };
  } else if (props?.summary?.meta?.available) {
    return {
      icon: "check-circle",
      label: t("domain.card.available.label"),
    };
  } else {
    return {
      icon: "transfer",
      label: t("domain.card.transfer.label"),
    };
  }
});

function onUpdate(value: string): void {
  if (meta.value.isDisabled || meta.value.isProcessing) return;
  emit("update:selected", value);
}

function onRemove(value: string): void {
  if (meta.value.isDisabled || meta.value.isProcessing) return;
  emit("remove", value);
}
</script>
