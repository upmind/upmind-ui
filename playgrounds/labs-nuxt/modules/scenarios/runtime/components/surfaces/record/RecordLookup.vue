<template>
  <Card size="sm" :data-attrs="{ 'data-test-key': 'record-lookup-card' }">
    <div :class="recordLookup.root()">
      <EmptyState
        :title="t(picker.i18n.title)"
        :description="t(picker.i18n.text)"
      >
        <template v-if="picker.icon" #icon
          ><Icon :icon="picker.icon"
        /></template>
      </EmptyState>

      <div v-if="pickerForm" class="w-full" data-test-key="record-lookup">
        <Form
          :schema="pickerForm.schema"
          :uischema="pickerForm.uischema"
          :model-value="pickerModel"
          :additional-renderers="formRenderers"
          no-actions
          size="sm"
          @update:model-value="onPick"
        />
      </div>

      <div :class="recordLookup.input()">
        <Input
          v-model="idInput"
          :placeholder="t(picker.i18n.input)"
          :data-attrs="{ 'data-test-key': 'record-id-input' }"
          @keyup.enter="openInput"
        />
        <Button
          :disabled="!idInput.trim() || resolving"
          :loading="resolving"
          :data-attrs="{ 'data-test-key': 'record-open' }"
          @click="openInput"
        >
          {{ t(picker.i18n.open) }}
        </Button>
      </div>

      <Alert
        v-if="unmatched && picker.resolve"
        variant="warning"
        appearance="outline"
        :title="t(picker.resolve.i18n.title)"
        :description="t(picker.resolve.i18n.text, { reference: unmatched })"
        :data-attrs="{ 'data-test-key': 'record-not-found' }"
      />
    </div>
  </Card>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/record/RecordLookup
 * @description What a record page draws with no record in its url: the
 * declared collection's own picker form, whose pick IS the navigation, beside a
 * direct id input. The picker cell is booted fresh and destroyed on unmount.
 * An input that is not an id is resolved through the collection's declared
 * criteria filter, on its own fresh cell, and the first match opened.
 */

import { Alert, Button, Card, EmptyState, Input } from "@upmind/ui";
import { onUnmounted, ref, unref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { formRenderers } from "@upmind-automation/client-vue";
import { Form, Icon } from "@upmind-automation/foundation";
import { recordLookup } from "../RecordSurface.styles";
import { recordPath } from "./record.utils";
import { get, head, isFunction } from "lodash-es";
import type { RecordLookupProps } from "../RecordSurface.types";
import type { FormProps } from "@upmind-automation/client-vue";
// -----------------------------------------------------------------------------

// Loose hex, not RFC-4122: real ids carry non-standard version/variant nibbles.
const ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const props = defineProps<RecordLookupProps>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const idInput = ref("");
const pickerModel = ref<Record<string, unknown>>({});
const resolving = ref(false);
const unmatched = ref<string>();

watch(idInput, () => {
  unmatched.value = undefined;
});

const cell = props.picker.use().as(props.picker.actor);
const fresh = cell.fresh?.() ?? cell;

const pickerForm = get(fresh.useContext(), props.picker.schema) as
  | Pick<FormProps, "schema" | "uischema">
  | undefined;

function open(id: string): void {
  if (!id) return;
  void router.push(
    recordPath(`/${props.route}/:id`, id, route.params.scopeSuffix)
  );
}

async function resolveId(
  reference: string,
  filter: string
): Promise<string | undefined> {
  const scoped = props.picker.use().as(props.picker.actor);
  const lookup = scoped.fresh?.() ?? scoped;
  const actions = lookup.useActions();
  return Promise.resolve()
    .then(() => {
      (get(actions, "setCriteria") as (criteria: unknown) => void)({
        filters: { [filter]: reference }
      });
      return (get(actions, "isReady") as () => Promise<unknown>)();
    })
    .then(() => {
      const rows = unref(get(lookup.useContext(), "data")) as
        | Record<string, unknown>[]
        | undefined;
      return get(head(rows), "id") as string | undefined;
    })
    .finally(() => {
      (get(actions, "destroy") as () => void)();
    });
}

async function openInput(): Promise<void> {
  const input = idInput.value.trim();
  const filter = props.picker.resolve?.filter;
  if (!input || resolving.value) return;
  if (!filter || ID_PATTERN.test(input)) return open(input);

  resolving.value = true;
  return resolveId(input, filter)
    .then(id => {
      if (id) open(id);
      else unmatched.value = input;
    })
    .finally(() => {
      resolving.value = false;
    });
}

function onPick(next: Record<string, unknown> | undefined): void {
  const picked = get(next, props.picker.field) as string | undefined;
  pickerModel.value = { [props.picker.field]: picked };
  if (picked) open(picked);
}

onUnmounted(() => {
  const destroy = get(fresh.useActions(), "destroy");
  if (isFunction(destroy)) destroy();
});
</script>
