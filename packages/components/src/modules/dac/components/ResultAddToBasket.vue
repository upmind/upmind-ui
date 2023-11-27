<template>
  <div class="hidden sm:block">
    <CheckCircleIcon v-if="is_available" class="text-success h-7 w-7" />
    <ArrowsRightLeftIcon v-else class="text-auto-25 h-7 w-7" />
  </div>

  <div class="max-w-full grow-[99]">
    <!-- Status Label -->
    <I18n
      tag="p"
      class="text-tiny uppercase leading-4"
      :class="{
        'text-success': is_available,
        'text-auto-50': !is_available
      }"
      :path="is_available ? 'available_label' : 'transfer_label'"
    />

    <div class="gap-x-8 overflow-hidden sm:flex sm:items-center">
      <!-- Domain Name (SLD + TLD) -->
      <p
        class="text-rtl text-auto grow truncate text-xl sm:text-2xl"
        :class="{
          'transition-transform sm:group-hover:translate-x-2': is_available
        }"
      >
        <span class="font-light opacity-80">{{ sld }}</span>
        <strong
          :class="{
            'font-semibold': true,
            'group-hover:text-success transition-colors': is_available
          }"
          >{{ tld }}</strong
        >
      </p>

      <div
        class="flex shrink-0 flex-row-reverse items-center gap-x-3 sm:flex-row"
      >
        <!-- 'Save X%' tag -->
        <template v-if="is_available">
          <SavingTag :key="domain" :percentage="percentage_saving" />
        </template>

        <!-- Price -->
        <template v-if="is_available">
          <I18n
            tag="p"
            path="price_by_n_years"
            class="text-auto-50 mr-auto shrink-0 text-sm"
            :count="billing_cycle_years"
          >
            <template #price>
              <span class="text-auto text-lg font-semibold sm:text-xl">{{
                price_discounted_formatted || price_formatted
              }}</span>
            </template>
          </I18n>
        </template>
      </div>
    </div>

    <!-- Billing Summary -->
    <template v-if="is_available">
      <UpmMarkdown tag="p" class="text-auto-50 text-xs">{{
        billing_summary
      }}</UpmMarkdown>
    </template>
  </div>

  <template v-if="is_available">
    <UpmButton
      as="anchor"
      :href="order_url"
      class="hover:!bg-success hover:!text-success-contrast text-success border-success hover:text-success-contrast mt-2 w-full shrink-0 grow justify-center border-2 bg-transparent hover:bg-opacity-100 sm:mt-0 sm:w-auto"
    >
      <ShoppingCartIcon class="h-4 w-4 xl:hidden" />
      <I18n path="add_to_basket_cta" class="sm:max-xl:hidden" />
    </UpmButton>
  </template>

  <template v-else>
    <I18n
      tag="p"
      path="transfer_instruction"
      class="text-auto-50 grow basis-72 text-xs"
      :values="{ percentage: percentage_saving }"
    >
      <template #action>
        <a :href="order_url" class="underline">{{
          $t("clicking_here_cta").toLocaleLowerCase()
        }}</a>
      </template>
      <template #tld>{{ tld.toUpperCase() }}</template>
      <template #price>{{
        $tc("price_by_n_years", billing_cycle_years, {
          price: price_discounted_formatted || price_formatted
        })
      }}</template>
    </I18n>
  </template>
</template>

<script lang="ts">
import { defineComponent, toRefs } from "vue";
import UpmMarkdown from "@src/components/UpmMarkdown.vue";
import SavingTag from "./components/SavingTag.vue";
import { CheckCircleIcon } from "@heroicons/vue/24/outline";
import { ArrowsRightLeftIcon, ShoppingCartIcon } from "@heroicons/vue/20/solid";

export default defineComponent({
  name: "UpmRequest",
  components: {
    UpmMarkdown,
    SavingTag,
    CheckCircleIcon,
    ArrowsRightLeftIcon,
    ShoppingCartIcon
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
      default: () => ({})
    }
  },
  setup(props) {
    const {
      billing_cycle_years,
      billing_summary,
      domain,
      is_available,
      order_url,
      percentage_saving,
      price_discounted_formatted,
      price_formatted,
      sld,
      tld
    } = toRefs(props.modelValue);

    return {
      billing_cycle_years,
      billing_summary,
      domain,
      is_available,
      order_url,
      percentage_saving,
      price_discounted_formatted,
      price_formatted,
      sld,
      tld
    };
  }
});
</script>
