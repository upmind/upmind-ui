<template>
  <section :class="styles.client.root">
    <header :class="styles.client.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <upw-skeleton-list
      :class="styles.client.loading"
      v-if="
        meta.isLoading || (meta.isAdding && !meta.isEmpty) || meta.isEditing
      "
    />

    <!-- If we dont have any default or selected :- render a form for a new address -->
    <upm-item
      v-if="
        !meta.isLoading && (meta.isAdding || meta.isEditing) && !activeDialog
      "
      i18nKey="unified"
      :model-value="selected"
      :dialog="!meta.isEmpty"
      :autosave="meta.isEmpty"
    />

    <!-- otherwise show the default address as a card -->
    <div :class="styles.client.content" v-else-if="selected">
      <h5 :class="styles.client.title">
        {{ $t("client.title") }}
        <uw-button
          variant="link"
          :label="$t('client.actions.change')"
          size="sm"
          @click="onChange"
        />
      </h5>

      <upm-card
        i18nKey="unified"
        :model-value="selected"
        selected
        :selectable="false"
        no-actions
        :key="selected?.id"
      />

      <div :class="styles.client.actions">
        <uw-button
          :key="selected?.id"
          variant="link"
          :label="$t('client.actions.convert')"
          size="sm"
          @click="onEdit"
          v-if="!selected?.state?.value?.context?.model?.company_details"
        />
      </div>
    </div>

    <upm-listings
      v-model="activeDialog"
      type="unified"
      i18nKey="unified"
      dialog
      no-filter
      @update:modelValue="onClose"
    />

    <footer :class="styles.client.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>
  </section>
</template>

<script>
// --- external
import { defineComponent, provide, ref } from "vue";

// --- internal
import {
  useClientUnifiedAddress,
  useClientUnifiedAddresses,
} from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "../client/config.cva";

// --- components
import UpmItem from "../Client/Item.vue";
import UpmCard from "../Client/Card.vue";
import UpmListings from "../Client/Listings.vue";
import { UpwSkeletonList } from "@upmind/upwind";

// --- custom elements
import { UwButton, useCustomElement } from "@upmind/upwind";
useCustomElement(UwButton);

// --- utils
import { get, isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClient",
  components: {
    UpwSkeletonList,
    // ---
    UpmItem,
    UpmCard,
    UpmListings,
  },
  emits: ["update:modelValue"],
  props: {
    i18nKey: { type: String },
    modelValue: { type: Object },
  },
  setup() {
    const client = useClientUnifiedAddresses();
    const styles = useStyles(["client"], client.meta, config);
    // ---

    const { select, selected, getSelected, addresses, add, meta } = client;

    // Provide the client to the form/card components
    provide("client", useClientUnifiedAddress);

    // ---
    // check if we have a selected client, if we dont then we are creating a new one
    getSelected().then(selected => {
      if (!selected) add();
    });

    // ---

    return {
      add,
      selected,
      select,
      useClientUnifiedAddress,
      meta,
      styles,
      addresses,
      // ---
      activeDialog: ref(false),
    };
  },

  methods: {
    onChange() {
      this.activeDialog = true;
    },
    onEdit() {
      const client = this.useClientUnifiedAddress(this.selected);
      const model = client.model.value;
      client.edit();
      // force the company details to be shown
      client.input({ ...model, company_details: true });
    },
    onClose() {
      this.activeDialog = false;
    },
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(model) {
        if (isEmpty(model)) return;
        const id = model?.company_id || model?.address_id;
        this.select(id);
      },
    },
    selected: {
      immediate: true,
      handler(value, oldValue) {
        if (value?.id === oldValue?.id) return;

        const model = get(value?.state?.value, "context.model", {});
        if (isEmpty(model)) return;

        this.$emit("update:modelValue", model);
      },
    },
  },
});
</script>
.
