<template>
  <component
    :is="dialog ? 'upw-dialog' : 'section'"
    @reject="onClose"
    size="xl"
    :actions="actions"
    title="Change address"
    :model-value="modelValue"
    @update:modelValue="onClose"
  >
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
          v-if="!noFilter && meta.canFilter"
          @input="filter($event?.currentTarget?.value)"
          :placeholder="$t(`client.${type}.actions.filter`)"
          size="sm"
        />

        <div :class="styles.clientListings.items">
          <upm-card
            v-for="item in sortedItems"
            :key="item.id"
            :model-value="item"
            :selected="item.id === selected?.id"
            @update:modelValue="onSelect"
            :hidden="meta.isAdding && item.id === selected?.id"
            :disabled="meta.isEditing && item.id === selected?.id"
            :i18nKey="i18nKey"
            :no-actions="noActions"
            @click:action="onClose"
          />
        </div>

        <slot name="empty" v-bind="{ meta }" v-if="meta.isEmpty">
          <upm-empty :i18nKey="type" />
        </slot>

        <upm-item
          v-if="meta.isEditing"
          :model-value="selected"
          :key="selected?.id"
          :i18nKey="i18nKey"
        />

        <div
          :class="styles.clientListings.actions"
          v-if="!meta.isAdding && !meta.isEditing && !meta.isLoading && !dialog"
        >
          <upw-button
            :label="$t(`client.${type}.actions.add`)"
            variant="ghost"
            @click="onAdd"
            block
          />
        </div>
      </template>

      <footer :class="styles.clientListings.footer">
        <slot name="footer" v-bind="{ meta }"></slot>
      </footer>
    </section>
  </component>
</template>

<script>
// --- external
import { defineComponent, provide, ref } from "vue";

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
import UpmItem from "./Item.vue";
import {
  UpwTextbox,
  UpwButton,
  UpwSkeletonList,
  UpwDialog,
} from "@upmind/upwind";

// --- utils

// --- types
// import type { PropType } from "vue";
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmClientListings",
  components: {
    UpwTextbox,
    UpwButton,
    UpwSkeletonList,
    UpwDialog,
    // ---
    UpmAuth,
    // ---
    UpmEmpty,
    UpmCard,
    UpmItem,
  },
  emits: ["update:modelValue", "add", "select"],
  props: {
    type: {
      type: String, //as PropType<"addresses" | "emails" | "phones" | "companies">,
      required: true,
    },
    i18nKey: { type: String, required: true },
    modelValue: { type: Boolean },
    dialog: { type: Boolean, default: true },
    // ---
    noActions: { type: Boolean },
    noFilter: { type: Boolean },
    cols: { type: [String, Number] },
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
      initial: ref(null),
      styles,
    };
  },

  computed: {
    actions() {
      return {
        add: {
          label: this?.$t(`client.addresses.actions.add`),
          variant: "flat",
          block: true,
          action: () => {
            this.$emit("update:modelValue", false);
            this.add();
          },
        },
      };
    },
    sortedItems() {
      // if we may have an initial 'selected', and we want to sort the items so that the selected item is always on top
      // we dont do this to the  reactive 'selected' to prevent jank re-ordering
      // we use the inital value as opposed to the reactive value
      return this.items.sort((x, y) =>
        x.id == this.initial?.id ? -1 : y.id == this.initial?.id ? 1 : 0
      );
    },
  },
  methods: {
    onClose() {
      this.$emit("update:modelValue", false);
    },
    onAdd() {
      this.$emit("update:modelValue", false);
      this.add();
    },
    onSelect(item) {
      this.select(item.id);
      this.$emit("update:modelValue", false);
    },
  },
  watch: {
    selected(value) {
      if (!this.initial && !!value) {
        this.initial = value;
      } else if (this.initial && !value) {
        // if we dont have a value, select our inital
        this.select(this.initial?.id);
      } else if (!this.initial && !value) {
        // we dont ever want to NOT have a selected item, so get the 'default'
        this.getSelected();
      }
    },
  },
});
</script>
