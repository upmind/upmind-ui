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
              {{ sld
              }}<strong :class="styles.domain.card.tld">
                {{ tld }}
              </strong>
            </h2>
          </div>

          <Promotion
            v-for="(promotion, index) in promotions"
            :key="`promotion-${index}`"
            v-bind="promotion"
            :class="styles.domain.card.promotion"
            size="md"
          />
        </section>

        <DomainDescription
          v-if="meta.isAvailable"
          v-bind="domain"
          :title="props.domain"
        />
      </div>
    </header>

    <footer :class="styles.domain.card.footer.root">
      <DomainPrices
        v-if="meta.isAvailable"
        :meta="domain.meta"
        :price="domain.price"
      />

      <DomainActions
        :domain="domain.domain"
        :tld="domain.tld"
        :meta="domain.meta"
        :price="domain.price"
        :processing="meta.isProcessing"
        :selected="props.selected"
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
import { useBasketProduct } from "@upmind-automation/headless";

// --- components
import { Icon, Badge, Button, Link } from "@upmind-automation/upmind-ui";
import Promotion from "../../basket/product/components/Promotion.vue";
import DomainActions from "./DomainActions.vue";
import DomainDescription from "./DomainDescription.vue";
import DomainPrices from "./DomainPrices.vue";

// --- utils
import { omit } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { DomainCardProps } from "../types";
import type { DomainProduct } from "@upmind-automation/headless";
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

const domain = computed<DomainProduct>(
  () => omit(props, ["color", "secondary", "processing"]) as DomainProduct
);

const meta = computed(() => ({
  isDisabled: props.meta.disabled,
  isProcessing: props.processing,
  isAvailable: props.meta.available,
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
  if (props.meta.owned) {
    return {
      icon: "lock",
      label: t("domain.card.owned.label"),
    };
  } else if (props.meta.added) {
    return {
      icon: "check-circle-solid",
      label: t("domain.card.basket.label"),
    };
  } else if (props.meta.available) {
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
