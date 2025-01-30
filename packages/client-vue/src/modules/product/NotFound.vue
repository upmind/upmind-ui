<template>
  <article>
    <UpmContentSection>
      <UpmProductNotFound
        open
        modal
        skrim="light"
        :text="t('cart.notFound.text')"
        :action="{
          color: 'primary',
          handler: back,
          prependIcon: 'arrow-left',
          label: t('cart.notFound.actions.continue'),
        }"
      >
        <template #title>
          <i18n-t
            keypath="cart.notFound.title"
            tag="span"
            for="cart.notFound.title"
            class="font-bold text-primary"
          >
            <mask class="bg-promotion leading-relaxed text-accent-foreground">{{
              t("cart.notFound.product")
            }}</mask>
          </i18n-t>
        </template>
      </UpmProductNotFound>
    </UpmContentSection>
  </article>
</template>

<script lang="ts" setup>
// ---
import { useI18n } from "vue-i18n";
// -- components
import {
  UpmContentSection,
  UpmProductNotFound,
  useRoutingEngine,
} from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------
const { back } = useRoutingEngine();
const { t } = useI18n();
</script>
