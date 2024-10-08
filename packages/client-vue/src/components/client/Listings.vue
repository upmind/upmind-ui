<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? 'Drawer' : 'Section'"
    title="Change address"
    :open="isOpen"
    @reject="onClose"
    @update:open="onClose"
    skrim="light"
    :class="styles.clientListings.root"
    v-auto-animate
  >
    <header :class="styles.clientListings.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <div v-if="!meta.isAvailable">
      <UpmAuth no-tabs />
    </div>

    <UpwSkeletonList
      :class="styles.clientListings.loading"
      v-else-if="meta.isLoading"
    />

    <template v-else>
      <UpwTextbox
        v-if="!noFilter && meta.canFilter"
        @input="filter($event?.currentTarget?.value)"
        :placeholder="$t(`client.${type}.actions.filter`)"
        size="sm"
      />

      <div :class="styles.clientListings.items">
        <UpmCard
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
        <UpmEmpty :i18nKey="type" />
      </slot>

      <UpmItem
        v-if="meta.isEditing || meta.isAdding"
        :model-value="selected"
        :key="selected?.id"
        :i18nKey="i18nKey"
        @reject="onClose"
      />

      <div
        :class="styles.clientListings.actions"
        v-if="!meta.isAdding && !meta.isEditing && !meta.isLoading && !modal"
      >
        <Button
          :label="$t(`client.${type}.actions.add`)"
          variant="ghost"
          @click="add"
          block
        />
      </div>
    </template>

    <footer :class="styles.clientListings.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>

    <template #actions>
      <Button
        v-for="(action, key) in actions"
        :key="key"
        v-bind="action"
        :loading="action.loading"
        :disabled="action?.disabled"
        @click="doAction(action)"
      />
    </template>
  </component>
</template>

<script>
// --- external
import { defineComponent, provide, ref } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
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
  useClientUnifiedAddresses,
  useClientUnifiedAddress,
} from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import Section from "../Section.vue";
import UpmAuth from "../session/Auth.vue";
import UpmEmpty from "./Empty.vue";
import UpmCard from "./Card.vue";
import UpmItem from "./Item.vue";
import { UpwTextbox, UpwSkeletonList } from "@upmind/upwind";

// --- custom elements
import { Button, Drawer } from "@upmind/upwind";

// --- utils
import { isFunction } from "lodash-es";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmClientListings",
  directive: { autoAnimate: vAutoAnimate },
  components: {
    Button,
    Drawer,
    UpwTextbox,
    UpwSkeletonList,
    Section,
    // ---
    UpmAuth,
    // ---
    UpmEmpty,
    UpmCard,
    UpmItem,
  },
  emits: ["update:open", "add", "select"],
  props: {
    type: {
      type: String, //as PropType<"addresses" | "emails" | "phones" | "companies">,
      required: true,
    },
    i18nKey: { type: String, required: true },
    open: { type: Boolean },
    modal: { type: Boolean, default: false },
    // ---
    noActions: { type: Boolean },
    noFilter: { type: Boolean },
    cols: { type: [String, Number], default: 1 },
  },
  setup(props) {
    let clientListings, client;

    switch (props.type) {
      case "addresses":
        clientListings = useClientAddresses();
        client = useClientAddress;
        break;
      case "emails":
        clientListings = useClientEmails();
        client = useClientEmail;
        break;
      case "phones":
        clientListings = useClientPhones();
        client = useClientPhone;
        break;
      case "companies":
        clientListings = useClientCompanies();
        client = useClientCompany;
        break;
      case "unified":
        clientListings = useClientUnifiedAddresses();
        client = useClientUnifiedAddress;
        break;
    }

    const styles = useStyles(["clientListings"], clientListings.meta, config);

    // provide the correct composable to our child components
    provide("client", client);

    const active = ref(clientListings.selected.value);

    // safetycheck to ensure we have a selected item
    clientListings
      .isReady()
      .then(() => (active.value = clientListings.selected.value));

    return {
      ...clientListings,
      active,
      styles,
    };
  },

  computed: {
    actions() {
      return {
        add: {
          label: this?.$t(`client.${this.type}.actions.add`),
          variant: "flat",
          block: true,
          handler: () => {
            this.$emit("update:open", false);
            this.add();
          },
        },
      };
    },
    sortedItems() {
      // if we may have an active 'selected', and we want to sort the items so that the selected item is always on top
      // we dont do this to the  reactive 'selected' to prevent jank re-ordering
      // we use the inital value as opposed to the reactive value
      return this.items.sort((x, y) =>
        x.id == this.active?.id ? -1 : y.id == this.active?.id ? 1 : 0
      );
    },
    isOpen() {
      return this.open;
    },
  },
  methods: {
    onClose() {
      this.$emit("update:open", false);
    },

    onSelect(item) {
      this.select(item.id);
      this.$emit("update:open", true);
    },
    doAction(item) {
      if (isFunction(item?.handler)) {
        item.handler();
      }
    },
  },
});
</script>
