<template>
  <section :class="styles.client.root">
    <header :class="styles.client.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <div v-if="!meta.isAvailable">
      <upm-auth no-tabs />
    </div>

    <upw-skeleton-list
      :class="styles.client.loading"
      v-else-if="meta.isLoading || (meta.isAdding && !meta.isEmpty)"
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
        <upw-button
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
        <upw-button
          :key="selected?.id"
          variant="link"
          :label="$t('client.actions.convert')"
          size="sm"
          @click="onEdit"
          v-if="!selected?.state?.value?.context?.model.company_details"
        />

        <!-- <pre>{{ selected?.state?.value?.context?.model }}</pre> -->
      </div>
    </div>

    <upm-listings
      v-model="activeDialog"
      type="unified"
      i18nKey="unified"
      dialog
      no-filter
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
import config from "./config.cva";

// --- components
import UpmAuth from "../session/Auth.vue";
import UpmItem from "./Item.vue";
import UpmCard from "./Card.vue";
import UpmListings from "./Listings.vue";
import { UpwSkeletonList, UpwButton } from "@upmind/upwind";

// --- utils
import { get, isEmpty } from "lodash";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClient",
  components: {
    UpwSkeletonList,
    UpwButton,
    // ---
    UpmAuth,
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
      handler(value) {
        const model = get(value?.state?.value, "context.model", {});
        if (isEmpty(model)) return;
        this.$emit("update:modelValue", model);
      },
    },
  },
});
</script>
.
