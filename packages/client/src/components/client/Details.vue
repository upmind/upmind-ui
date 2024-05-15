<template>
  <section :class="styles.clientDetails.root">
    <header :class="styles.clientDetails.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <div v-if="!meta.isAvailable">
      <upm-auth no-tabs />
    </div>

    <upw-skeleton-list
      :class="styles.clientDetails.loading"
      v-else-if="meta.isLoading || (meta.isAdding && !meta.isEmpty)"
    />

    <!-- If we dont have any default or selected :- render a form for a new address -->
    <upm-form
      v-if="!meta.isLoading && meta.isAdding && !activeDialog"
      i18nKey="addresses"
      :model-value="selected"
      :dialog="!meta.isEmpty"
    />

    <!-- otherwise show the default address as a card -->
    <div :class="styles.clientDetails.content" v-else-if="selected">
      <h5 :class="styles.clientDetails.title">
        {{ $t("client.details.title") }}
        <upw-button
          variant="link"
          :label="$t('client.details.actions.change')"
          size="sm"
          @click="onChange"
        />
      </h5>

      <upm-card
        i18nKey="addresses"
        :model-value="selected"
        selected
        :selectable="false"
        no-actions
        :key="selected?.id"
      />

      <div :class="styles.clientDetails.actions">
        <!--
              <upw-button
              variant="link"
              :label="$t('client.details.actions.edit')"
              size="sm"
              @click="onEdit"
            /> -->
      </div>
    </div>

    <upm-listings
      v-model="activeDialog"
      type="addresses"
      i18nKey="addresses"
      dialog
      no-filter
    />

    <footer :class="styles.clientDetails.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>
  </section>
</template>

<script>
// --- external
import { defineComponent, provide, ref } from "vue";

// --- internal
import { useClient } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmAuth from "../session/Auth.vue";
import UpmForm from "./Form.vue";
import UpmCard from "./Card.vue";
import UpmListings from "./Listings.vue";
import { UpwSkeletonList, UpwButton, UpwTabs, UpwDialog } from "@upmind/upwind";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClientDetails",
  components: {
    UpwSkeletonList,
    UpwButton,
    UpwTabs,
    UpwDialog,
    // ---
    UpmAuth,
    // ---
    UpmForm,
    UpmCard,
    UpmListings,
  },
  props: {
    i18nKey: { type: String },
  },
  setup() {
    const client = useClient();
    const styles = useStyles(["clientDetails"], client.meta, config);
    // ---

    const {
      selected,
      getSelected,
      addresses,
      companies,
      add,
      address,
      company,
      meta,
    } = client;
    const selectedClient = address; // TODo provide the appropriat eone base don the type of default address or company
    // Provide the selected client to the form/card components
    provide("client", selectedClient);

    // ---
    // check if we have a selected client, if we dont then we are creating a new one
    getSelected().then(selected => {
      if (!selected) add();
    });

    // ---

    return {
      add,
      selected,
      selectedClient,
      meta,
      styles,
      addresses,
      companies,
      // ---
      inlineForm: ref(true),
      activeTab: ref("addresses"),
      activeDialog: ref(false),
      tabs: [
        {
          value: "addresses",
          label: "Address",
        },
        {
          value: "companies",
          label: "Business",
        },
      ],
    };
  },

  methods: {
    onChange() {
      this.activeDialog = true;
    },
    onEdit() {
      this.selectedClient(this.selected).edit();
    },
    onClose() {
      this.activeDialog = false;
    },
  },
});
</script>
.
