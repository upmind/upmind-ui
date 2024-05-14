<template>
  <section :class="styles.clientListings.root">
    <header :class="styles.clientListings.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <div v-if="!meta.isAvailable">
      <upm-auth no-tabs />
    </div>

    <upw-skeleton-list
      :class="styles.clientListings.loading"
      v-else-if="meta.isLoading"
    />

    <template v-else>
      <upw-textbox
        @input="filter($event?.currentTarget?.value)"
        :placeholder="$t(`client.${type}.actions.filter`)"
        v-if="meta.canFilter && !processing"
        size="sm"
      />

      <div :class="styles.clientListings.items">
        <upm-card
          v-for="item in items"
          :key="item.id"
          :item="item"
          :selected="item.id === selected?.id"
          @select="select"
          :loading="processing"
          :hidden="meta.isAdding && item.id === selected?.id"
          :disabled="meta.isEditing && item.id === selected?.id"
          :i18nKey="type"
        />
      </div>

      <slot name="empty" v-bind="{ meta }" v-if="meta.isEmpty">
        <upm-empty :i18nKey="type" />
      </slot>

      <upm-form
        v-if="meta.isEditing"
        :item="selected"
        :key="selected.id"
        :i18nKey="type"
      />

      <div
        :class="styles.clientListings.actions"
        v-if="!meta.isEditing && !meta.isLoading && !processing"
      >
        <upw-button
          block
          icon="plus"
          :label="$t(`client.${type}.actions.add`)"
          variant="ghost"
          @click="add"
        />
      </div>
    </template>

    <footer :class="styles.clientListings.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>
  </section>
</template>

<script>
// --- external
import { defineComponent, provide } from "vue";

// --- internal
import {
  useClientEmails,
  useClientEmail,
  useClientPhones,
  useClientPhone,
  useClientAddresses,
  useClientAddress,
  useClientCompanies,
  useClientCompany,
} from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmAuth from "../session/Auth.vue";
import UpmEmpty from "./Empty.vue";
import UpmCard from "./Card.vue";
import UpmForm from "./Form.vue";
import { UpwTextbox, UpwButton, UpwSkeletonList } from "@upmind/upwind";

// --- utils
import { isEqual } from "lodash-es";

// --- types
// import type { PropType } from "vue";
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmClientListings",
  components: {
    UpwTextbox,
    UpwButton,
    UpwSkeletonList,
    // ---
    UpmAuth,
    // ---
    UpmEmpty,
    UpmCard,
    UpmForm,
  },
  emits: ["update:modelValue"],
  props: {
    type: {
      type: String, //as PropType<"addresses" | "emails" | "phones" | "companies">,
      required: true,
    },
    modelValue: { type: String },
    processing: { type: Boolean },
  },
  setup(props) {
    let clientListings, client;

    switch (props.type) {
      case "addresses":
        clientListings = useClientAddresses();
        client = useClientAddress;
        // UpmCard = defineAsyncComponent(() => import(`./address/Card.vue`));
        // UpmForm = defineAsyncComponent(() => import(`./address/Form.vue`));
        break;
      case "emails":
        clientListings = useClientEmails();
        client = useClientEmail;
        // UpmCard = defineAsyncComponent(() => import(`./email/Card.vue`));
        // UpmForm = defineAsyncComponent(() => import(`./email/Form.vue`));
        break;
      case "phones":
        clientListings = useClientPhones();
        client = useClientPhone;
        // UpmCard = defineAsyncComponent(() => import(`./phone/Card.vue`));
        // UpmForm = defineAsyncComponent(() => import(`./phone/Form.vue`));
        break;
      case "companies":
        clientListings = useClientCompanies();
        client = useClientCompany;
        // UpmCard = defineAsyncComponent(() => import(`./company/Card.vue`));
        // UpmForm = defineAsyncComponent(() => import(`./company/Form.vue`));

        break;
    }

    const styles = useStyles(["clientListings"], clientListings.meta, config);

    // provide the correct composable to our child components
    provide("client", client);

    return {
      ...clientListings,
      styles,
    };
  },
  mounted() {
    this.select(this.modelValue);
  },
  watch: {
    selected(newValue, oldValue) {
      if (
        !isEqual(newValue?.id, oldValue?.id) &&
        !isEqual(newValue?.id, this.modelValue)
      ) {
        this.$emit("update:modelValue", newValue);
      }
    },
  },
});
</script>
