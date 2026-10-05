<template>
  <section
    v-if="notice === ModuleState.LOADING"
    role="status"
    :aria-label="t('text.loading')"
    :class="recordSurface.root()"
    data-test-key="record-skeleton"
  >
    <div :class="recordSurface.header()">
      <div :class="recordSurface.heading()">
        <Skeleton :class="recordSurface.skeletonTitle()" />
        <Skeleton
          v-if="uischema.header.status"
          :class="recordSurface.skeletonBadge()"
        />
      </div>
      <div v-if="skeleton.header" :class="recordSurface.actions()">
        <Skeleton
          v-for="index in skeleton.header"
          :key="index"
          :class="recordSurface.skeletonAction()"
        />
      </div>
    </div>
    <div :class="recordSurface.body()">
      <div
        v-for="section in skeleton.sections"
        :key="section.key"
        :class="recordSurface.section()"
      >
        <Skeleton
          v-if="section.heading"
          :class="recordSurface.skeletonHeading()"
        />
        <div v-if="section.fields" :class="recordSurface.skeletonGrid()">
          <div
            v-for="index in section.fields"
            :key="index"
            :class="recordSurface.skeletonField()"
          >
            <Skeleton :class="recordSurface.skeletonLabel()" />
            <Skeleton :class="recordSurface.skeletonValue()" />
          </div>
        </div>
        <div
          v-for="index in section.rows"
          :key="index"
          :class="recordSurface.skeletonRow()"
        >
          <Skeleton :class="recordSurface.skeletonValue()" />
          <Skeleton :class="recordSurface.skeletonAction()" />
        </div>
      </div>
    </div>
    <div
      v-if="skeleton.writes || skeleton.utilities"
      :class="recordSurface.footer()"
    >
      <div v-if="skeleton.writes" :class="recordSurface.writes()">
        <Skeleton
          v-for="index in skeleton.writes"
          :key="index"
          :class="recordSurface.skeletonAction()"
        />
      </div>
      <div v-if="skeleton.utilities" :class="recordSurface.utilities()">
        <Skeleton
          v-for="index in skeleton.utilities"
          :key="index"
          :class="recordSurface.skeletonUtility()"
        />
      </div>
    </div>
  </section>

  <ModuleStateNotice v-else-if="notice" :state="notice" :detail="detail" />

  <section v-else :class="recordSurface.root()" data-test-key="record-surface">
    <header :class="recordSurface.header()">
      <div :class="recordSurface.heading()">
        <h2
          :class="recordSurface.title()"
          :title="title"
          data-test-key="record-title"
        >
          {{ title }}
        </h2>
        <div v-if="status || badges.length" :class="recordSurface.badges()">
          <StatusBadge
            v-if="status"
            size="sm"
            tone="neutral"
            data-test-key="record-status"
          >
            {{ status }}
          </StatusBadge>
          <Badge
            v-for="badge in badges"
            :key="badge.key"
            size="sm"
            appearance="muted"
            :variant="badge.color"
            :data-test-key="`record-badge-${badge.key}`"
          >
            {{ badge.label }}
          </Badge>
        </div>
      </div>

      <div
        v-if="headerItems.length"
        :class="recordSurface.actions()"
        data-test-key="record-header-actions"
      >
        <Tooltip
          v-for="item in headerItems"
          :key="item.name"
          :label="locked ? t('labs.replay_locked') : item.label"
          :active="!!locked"
        >
          <Button
            size="sm"
            :variant="item.variant"
            :disabled="item.disabled"
            :loading="item.loading"
            :data-attrs="{ 'data-test-value': kebabCase(item.label) }"
            @click="item.onSelect"
          >
            <Icon
              v-if="item.icon"
              :icon="item.icon"
              size="nano"
              aria-hidden="true"
            />
            {{ item.label }}
          </Button>
        </Tooltip>
      </div>
    </header>

    <div v-if="lead" :class="recordSurface.lead()" data-test-key="record-lead">
      <p :class="recordSurface.leadTitle()" :data-test-value="lead.name">
        {{ t(lead.i18n.title, leadParams) }}
      </p>
      <p v-if="lead.i18n.text" :class="recordSurface.leadText()">
        {{ t(lead.i18n.text, leadParams) }}
      </p>
    </div>

    <Alert
      v-if="actionError"
      variant="danger"
      appearance="muted"
      :title="actionError"
      :class="recordSurface.alert()"
      :data-attrs="{ 'data-test-key': 'record-action-error' }"
    />

    <div v-if="sections.length" :class="recordSurface.body()">
      <template v-for="entry in sections" :key="entry.section.key">
        <Section
          v-if="entry.heading"
          :value="entry.section.key"
          :label="t(entry.section.i18n!)"
          :icon="entry.section.icon"
          :card="false"
          :border="true"
          :data-attrs="{
            'data-test-key': `record-section-${entry.section.key}`
          }"
        >
          <template v-if="entry.actions.length" #actions>
            <Link
              v-for="item in entry.actions"
              :key="item.name"
              color="muted"
              size="sm"
              :disabled="item.disabled"
              :data-attrs="{ 'data-test-value': kebabCase(item.label) }"
              @click="item.onSelect"
            >
              <Icon v-if="item.icon" :icon="item.icon" aria-hidden="true" />
              {{ item.label }}
            </Link>
          </template>

          <component
            :is="entry.renderer"
            :section="entry.section"
            :model="model"
            :locked="locked"
            :bind="bindActions"
            :busy="busy"
            :invoke="invoke"
            :allows="isGateOpen"
            :loading="sources.isLoading(entry.section.key)"
          />
        </Section>
        <div
          v-else
          :class="recordSurface.section()"
          :data-test-key="`record-section-${entry.section.key}`"
        >
          <component
            :is="entry.renderer"
            :section="entry.section"
            :model="model"
            :locked="locked"
            :bind="bindActions"
            :busy="busy"
            :invoke="invoke"
            :allows="isGateOpen"
            :loading="sources.isLoading(entry.section.key)"
          />
        </div>
      </template>
    </div>

    <footer
      v-if="primaryItems.length || moreItems.length || utilityItems.length"
      :class="recordSurface.footer()"
      data-test-key="record-footer"
    >
      <div
        v-if="primaryItems.length || moreItems.length"
        :class="recordSurface.writes()"
        data-test-key="record-actions"
      >
        <Tooltip
          v-for="item in primaryItems"
          :key="item.name"
          :label="locked ? t('labs.replay_locked') : item.label"
          :active="!!locked"
        >
          <Button
            size="sm"
            variant="ghost"
            :class="recordSurface.utility({ color: item.color })"
            :disabled="item.disabled"
            :loading="item.loading"
            :data-attrs="{ 'data-test-value': kebabCase(item.label) }"
            @click="item.onSelect"
          >
            <Icon
              v-if="item.icon"
              :icon="item.icon"
              size="nano"
              aria-hidden="true"
            />
            {{ item.label }}
          </Button>
        </Tooltip>

        <DropdownMenu v-if="moreItems.length" :items="moreMenu">
          <template #trigger>
            <Button
              size="sm"
              variant="ghost"
              :class="recordSurface.utility()"
              :disabled="locked"
              :title="locked ? t('labs.replay_locked') : undefined"
              :data-attrs="{
                'data-test-key': 'record-more',
                'data-test-value': 'show-more-options'
              }"
            >
              {{ t("text.more") }}
              <Icon icon="chevron-down" size="nano" aria-hidden="true" />
            </Button>
          </template>
          <template #item="{ item }">
            <span :data-test-value="item.dataAttrs?.['data-test-value']">
              {{ item.label }}
            </span>
          </template>
        </DropdownMenu>
      </div>

      <div
        v-if="utilityItems.length"
        :class="recordSurface.utilities()"
        data-test-key="record-utilities"
      >
        <Button
          v-for="item in utilityItems"
          :key="item.name"
          size="sm"
          variant="ghost"
          :class="recordSurface.utility({ color: item.color })"
          :disabled="item.disabled"
          :loading="item.loading"
          :title="locked ? t('labs.replay_locked') : undefined"
          :data-attrs="{ 'data-test-value': kebabCase(item.label) }"
          @click="item.onSelect"
        >
          <Icon
            v-if="item.icon"
            :icon="item.icon"
            size="nano"
            aria-hidden="true"
          />
          {{ item.label }}
        </Button>
      </div>
    </footer>
  </section>

  <Dialog
    v-if="openAction?.form"
    :open="true"
    :title="formTitle"
    :close-label="t('action.close')"
    :data-attrs="{ 'data-test-key': 'record-form-dialog' }"
    @update:open="onDialogOpen"
  >
    <div :class="recordSurface.form()">
      <Form
        v-if="formSlot?.schema"
        :schema="formSlot.schema"
        :uischema="formSlot.uischema"
        :model-value="formSlot.model"
        :additional-errors="validationErrors"
        :disabled="isSubmitting"
        no-actions
        size="sm"
        @update:model-value="onFormChange"
      />
      <Spinner v-else :label="t('text.loading')" />

      <Alert
        v-if="formError"
        variant="danger"
        appearance="muted"
        :title="formError"
        :data-attrs="{ 'data-test-key': 'record-form-error' }"
      />
    </div>

    <template #footer>
      <div :class="recordSurface.formActions()">
        <Button
          variant="ghost"
          :disabled="pending"
          :data-attrs="{ 'data-test-key': 'record-form-cancel' }"
          @click="closeDrawer(true)"
        >
          {{ t("action.cancel") }}
        </Button>
        <Button
          :disabled="isSubmitting || !canSubmit"
          :loading="pending"
          :data-attrs="{ 'data-test-key': 'record-form-submit' }"
          @click="submit"
        >
          {{ submitLabel }}
        </Button>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/RecordSurface
 * @description The single-record surface — the systematic twin of `ListSurface`,
 * drawn entirely from a declared `RecordUischema` against the live port of the
 * manager on screen. ONE panel: a header bar (title, the one status badge, the
 * flag badges and at most two primary actions, the rest under "More"), the
 * declared sections resolved by `kind` through the section registry, and a
 * footer bar of utilities.
 *
 * An action whose `gate` meta flag is false is not drawn. A `form` action opens
 * the ONE shared drawer over `context[form.context]`, routing change, submit
 * and cancel to the manager actions it names and closing when submit settles;
 * a `navigate` action pushes its route; a `transfer` action hands the session
 * to the client area; any other fires its `run` action. A header `lead` and an
 * `alert` section say the first of their declared notices whose gates open.
 */

import {
  Alert,
  Badge,
  Button,
  Dialog,
  DropdownMenu,
  Link,
  Skeleton,
  Spinner,
  StatusBadge,
  Tooltip
} from "@upmind/ui";
import { computed, ref, unref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoutingEngine, useTransfer, useUrl } from "@upmind-automation/headless";
import { Form, Icon, Section } from "@upmind-automation/foundation";
import { useRecordSources } from "../../composables/useRecordSources";
import {
  ActionPlacementTypes,
  RecordActionPlacementTypes
} from "../../scenario.types";
import { resolveScope } from "../../scenario.utils";
import { resolveModuleDetail, resolveRecordState } from "../module-state";
import { ModuleState } from "../module-state.types";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import { resolveRecordSection } from "./record/record.renderers";
import {
  drawableCells,
  noticeValues,
  openNotice,
  recordPath
} from "./record/record.utils";
import { recordSurface } from "./RecordSurface.styles";
import {
  compact,
  drop,
  every,
  filter,
  get,
  includes,
  isEmpty,
  isFunction,
  isNil,
  kebabCase,
  keys,
  map,
  pick,
  size,
  startsWith,
  take,
  toString,
  trim
} from "lodash-es";
import type {
  RecordControl,
  RecordFormSlot,
  RecordSurfaceProps
} from "./RecordSurface.types";
import type {
  RecordActionDeclaration,
  RecordCollectionSection,
  RecordFieldsSection,
  RecordSectionDeclaration,
  RecordFormDeclaration
} from "../../scenario.types";
import type { FormProps, MenuItem } from "@upmind/ui";
// -----------------------------------------------------------------------------

const PRIMARY_LIMIT = 2;

const SKELETON_ROWS = 3;

const props = defineProps<RecordSurfaceProps>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const routing = useRoutingEngine();

const pending = ref(false);
const running = ref<string>();
const actionError = ref<string>();
const formError = ref<string>();
const openAction = ref<RecordActionDeclaration>();

const snapshot = computed(() => props.port.snapshot());
const context = computed(
  () => snapshot.value.context as Record<string, unknown>
);
const meta = computed(() => snapshot.value.meta as Record<string, boolean>);

const record = computed(
  () =>
    get(context.value, props.uischema.record) as
      | Record<string, unknown>
      | undefined
);

const held = computed<Record<string, unknown>>(() => ({
  ...record.value,
  ...pick(context.value, props.uischema.siblings ?? [])
}));

const sources = useRecordSources(
  () => props.uischema.sections,
  () => held.value
);

const model = computed<Record<string, unknown>>(() => ({
  ...held.value,
  ...sources.values.value
}));

// A held record stays on screen through a refresh or a refused write; only a
// boot with nothing to draw yet shows the module's own state. A read still in
// flight may already publish an empty object, which holds nothing.
const notice = computed(() => {
  const state = resolveRecordState(meta.value, context.value);
  if (state === ModuleState.UNSERVED) return state;
  if (!isEmpty(record.value)) return undefined;
  return state === ModuleState.READY ? ModuleState.LOADING : state;
});

const detail = computed(() => resolveModuleDetail(context.value));

// A mapped record may nest a translated ref (`status.name`), which a plain read
// would stringify as an object.
function textAt(scope?: string): string | undefined {
  const value = scope ? unref(resolveScope(model.value, scope)) : undefined;
  return isNil(value) || value === "" ? undefined : String(value);
}

const title = computed(() => textAt(props.uischema.header.title) ?? "");

const status = computed(() => textAt(props.uischema.header.status));

const lead = computed(() =>
  openNotice(props.uischema.header.lead, gate => isGateOpen(gate))
);

const leadParams = computed(() =>
  lead.value ? noticeValues(lead.value, model.value) : {}
);

const badges = computed(() =>
  map(
    filter(props.uischema.header.badges ?? [], badge =>
      badge.scope
        ? !!resolveScope(model.value, badge.scope)
        : !!meta.value[badge.flag]
    ),
    badge => ({
      key: kebabCase(badge.flag),
      label: t(badge.i18n, { value: textAt(badge.scope) }),
      color: badge.color
    })
  )
);

// A collection's items are each their own Section, so it never draws a group
// heading over them.
function isHeaded(section: RecordSectionDeclaration): boolean {
  return !!section.i18n && section.kind !== "collection";
}

function isBlankSection(section: RecordSectionDeclaration): boolean {
  const entry = resolveRecordSection(section);
  if (entry?.isBlank) return entry.isBlank(section, model.value, isGateOpen);
  if (section.kind === "fields")
    return isEmpty(
      drawableCells((section as RecordFieldsSection).elements, model.value)
    );
  if (section.kind === "collection")
    return (
      !sources.isLoading(section.key) &&
      isEmpty(
        unref(
          resolveScope(model.value, (section as RecordCollectionSection).scope)
        )
      )
    );
  return false;
}

const sections = computed(() =>
  compact(
    map(props.uischema.sections, section => {
      const entry = resolveRecordSection(section);
      if (isBlankSection(section)) return undefined;
      return (
        entry && {
          section,
          renderer: entry.renderer,
          heading: isHeaded(section),
          actions: bindActions(section.actions ?? [])
        }
      );
    })
  )
);

// The boot draws the panel the declaration will fill: a placeholder for every
// header action, field, collection row and utility it names.
const skeleton = computed(() => {
  const writes = placed(RecordActionPlacementTypes.FOOTER).length;
  const overflow = placed(RecordActionPlacementTypes.OVERFLOW).length;
  return {
    header: placed(RecordActionPlacementTypes.HEADER).length,
    writes:
      Math.min(writes, PRIMARY_LIMIT) +
      (writes > PRIMARY_LIMIT || overflow ? 1 : 0),
    sections: filter(
      map(props.uischema.sections, section => ({
        key: section.key,
        heading: isHeaded(section),
        fields: size((section as Partial<RecordFieldsSection>).elements),
        rows:
          resolveRecordSection(section)?.skeletonRows ??
          (section.kind === "fields" ? 0 : SKELETON_ROWS)
      })),
      section => section.heading || !!section.fields || !!section.rows
    ),
    utilities: placed(RecordActionPlacementTypes.UTILITY).length
  };
});

function isBusy(action: RecordActionDeclaration): boolean {
  if (action.busy) return isGateOpen(action.busy);
  return (
    openAction.value?.name === action.name || running.value === action.name
  );
}

const isSubmitting = computed(() => pending.value || !!meta.value.isProcessing);

const busy = computed(() => isSubmitting.value || !!openAction.value);

function isGateOpen(gate?: string, row?: Record<string, unknown>): boolean {
  if (!gate) return true;
  const negated = startsWith(gate, "!");
  const name = negated ? gate.slice(1) : gate;
  const flag = startsWith(name, "#/")
    ? !!unref(resolveScope(row ?? model.value, name))
    : !!meta.value[name];
  return negated ? !flag : flag;
}

function hasAction(name?: string): boolean {
  return !name || isFunction(get(props.port.actions, name));
}

function isAvailable(
  action: RecordActionDeclaration,
  row?: Record<string, unknown>
): boolean {
  return (
    isGateOpen(action.gate, row) &&
    hasAction(action.run) &&
    hasAction(action.form?.submit)
  );
}

function call(name: string, ...args: unknown[]): unknown {
  const action = get(props.port.actions, name);
  return isFunction(action)
    ? (action as (...values: unknown[]) => unknown)(...args)
    : undefined;
}

function messageOf(error: unknown): string {
  return (
    (get(error, "message") as string | undefined) ??
    t("error.something_went_wrong")
  );
}

function refusal(): string {
  return messageOf(get(context.value, "error"));
}

function toItem(
  action: RecordActionDeclaration,
  row?: Record<string, unknown>
): RecordControl {
  return {
    color: action.color,
    name: action.name,
    label: t(action.i18n),
    icon: action.icon,
    variant: action.variant ?? "outline",
    placement: ActionPlacementTypes.VISIBLE,
    disabled: !!props.locked || busy.value,
    loading: isBusy(action),
    onSelect: () => void select(action, row)
  };
}

function bindActions(
  actions: RecordActionDeclaration[],
  row?: Record<string, unknown>
): RecordControl[] {
  return map(
    filter(actions, action => isAvailable(action, row)),
    action => toItem(action, row)
  );
}

function placed(
  ...placements: RecordActionPlacementTypes[]
): RecordActionDeclaration[] {
  return filter(props.uischema.actions, action =>
    includes(placements, action.placement ?? RecordActionPlacementTypes.FOOTER)
  );
}

const headerItems = computed(() =>
  bindActions(placed(RecordActionPlacementTypes.HEADER))
);

const writeItems = computed(() =>
  bindActions(placed(RecordActionPlacementTypes.FOOTER))
);

const primaryItems = computed(() => take(writeItems.value, PRIMARY_LIMIT));

const moreItems = computed(() => [
  ...drop(writeItems.value, PRIMARY_LIMIT),
  ...bindActions(placed(RecordActionPlacementTypes.OVERFLOW))
]);

const moreMenu = computed<MenuItem[]>(() =>
  map(moreItems.value, item => ({
    label: item.label,
    value: item.name,
    disabled: item.disabled || item.loading,
    dataAttrs: { "data-test-value": kebabCase(item.label) },
    onSelect: item.onSelect
  }))
);

const utilityItems = computed(() =>
  bindActions(placed(RecordActionPlacementTypes.UTILITY))
);

function navigate(
  target: NonNullable<RecordActionDeclaration["navigate"]>,
  row?: Record<string, unknown>
): void {
  const id = target.idScope
    ? (resolveScope(row ?? model.value, target.idScope) as string | undefined)
    : undefined;

  // A query-only target stays on the route the funnel has already resolved, so
  // a plain push never reaches its guard and a `?init` intent is never answered.
  if (!target.route) {
    void routing.navigate({
      name: route.name,
      params: route.params,
      query: { ...route.query, ...target.query }
    });
    return;
  }

  void router.push({
    path: recordPath(
      target.route,
      id,
      target.unscoped ? undefined : route.params.scopeSuffix
    ),
    query: target.query
  });
}

function argsOf(
  scopes: string[] | undefined,
  source: Record<string, unknown>
): unknown[] {
  return map(scopes, scope => unref(resolveScope(source, scope)));
}

async function run(
  action: RecordActionDeclaration,
  row?: Record<string, unknown>
): Promise<void> {
  pending.value = true;
  running.value = action.name;
  return Promise.resolve()
    .then(() => call(action.run!, ...argsOf(action.args, row ?? model.value)))
    .then(result => {
      if (result === false) actionError.value = refusal();
    })
    .catch(error => {
      actionError.value = messageOf(error);
    })
    .finally(() => {
      pending.value = false;
      running.value = undefined;
    });
}

// The client area's own transfer page signs the code in, then lands on `redirect`.
const TRANSFER_PATH = "auth/transfer";

async function transfer(
  action: RecordActionDeclaration,
  target: NonNullable<RecordActionDeclaration["transfer"]>
): Promise<void> {
  const id = target.idScope
    ? toString(resolveScope(model.value, target.idScope))
    : undefined;
  pending.value = true;
  running.value = action.name;
  return useTransfer()
    .transferTo()
    .then(handoff => {
      if (!handoff?.code) throw new Error(t("error.something_went_wrong"));
      window.location.href = useUrl(
        TRANSFER_PATH,
        {
          code: handoff.code,
          redirect: recordPath(target.redirect, id, undefined)
        },
        { base: handoff.redirect_url, context: "" }
      ).toString();
    })
    .catch(error => {
      actionError.value = messageOf(error);
      pending.value = false;
      running.value = undefined;
    });
}

async function select(
  action: RecordActionDeclaration,
  row?: Record<string, unknown>
): Promise<void> {
  if (action.navigate) return navigate(action.navigate, row);
  if (action.transfer) return transfer(action, action.transfer);

  actionError.value = undefined;

  if (action.form) {
    if (action.run)
      call(action.run, ...argsOf(action.args, row ?? model.value));
    formError.value = undefined;
    openRow.value = row;
    draft.value = action.form.prefill
      ? pick(row ?? model.value, keys(schemaOf(action.form)?.properties))
      : {};
    openAction.value = action;
    return;
  }

  if (action.run) await run(action, row);
}

async function invoke(name: string, ...args: unknown[]): Promise<unknown> {
  pending.value = true;
  actionError.value = undefined;
  return Promise.resolve()
    .then(() => call(name, ...args))
    .catch(error => {
      actionError.value = messageOf(error);
      throw error;
    })
    .finally(() => {
      pending.value = false;
    });
}

// --- the shared form drawer

const activeForm = computed(() => openAction.value?.form);

// A write taking arguments publishes no model, so the drawer holds it.
const openRow = ref<Record<string, unknown>>();
const draft = ref<Record<string, unknown>>({});

function slotOf(form: RecordFormDeclaration): RecordFormSlot | undefined {
  return form.context
    ? (get(context.value, form.context) as RecordFormSlot | undefined)
    : undefined;
}

function schemaOf(
  form: RecordFormDeclaration
): { properties?: object; required?: string[] } | undefined {
  return (form.schema ?? slotOf(form)?.schema) as
    | { properties?: object; required?: string[] }
    | undefined;
}

const formSlot = computed<RecordFormSlot | undefined>(() => {
  const form = activeForm.value;
  if (!form) return undefined;
  const slot = slotOf(form);
  return {
    schema: (form.schema ?? slot?.schema) as RecordFormSlot["schema"],
    uischema: (form.uischema ?? slot?.uischema) as RecordFormSlot["uischema"],
    model: slot?.model ?? draft.value
  };
});

const validationErrors = computed(
  () =>
    get(context.value, "validationErrors") as
      | FormProps["additionalErrors"]
      | undefined
);

const canSubmit = computed(() => {
  const form = activeForm.value;
  if (form?.valid) return !!meta.value[form.valid];
  if (!form || slotOf(form)?.model) return true;
  return every(
    schemaOf(form)?.required,
    field => !isEmpty(trim(toString(draft.value[field])))
  );
});

const formTitle = computed(() => {
  const action = openAction.value;
  return action ? t(action.form?.i18n ?? action.i18n) : undefined;
});

const submitLabel = computed(() =>
  t(activeForm.value?.submitI18n ?? "action.save")
);

function formArgs(form: RecordFormDeclaration, ...rest: unknown[]): unknown[] {
  return form.target ? [form.target, ...rest] : rest;
}

function settle(work: () => unknown): void {
  try {
    void Promise.resolve(work()).catch(error => {
      formError.value = messageOf(error);
    });
  } catch (error) {
    formError.value = messageOf(error);
  }
}

function onFormChange(next: Record<string, unknown> | undefined): void {
  const form = activeForm.value;
  if (!form) return;
  if (!form.set) {
    draft.value = next ?? {};
    return;
  }
  const set = form.set;
  settle(() => call(set, ...formArgs(form, next ?? {})));
}

function closeDrawer(cancelled: boolean): void {
  const form = activeForm.value;
  openAction.value = undefined;
  formError.value = undefined;
  const cancel = form?.cancel;
  if (cancelled && form && cancel)
    settle(() => call(cancel, ...formArgs(form)));
}

function onDialogOpen(open: boolean): void {
  if (!open) closeDrawer(true);
}

async function submit(): Promise<void> {
  const form = activeForm.value;
  if (!form) return;
  pending.value = true;
  formError.value = undefined;
  return Promise.resolve()
    .then(() =>
      call(
        form.submit,
        ...argsOf(form.args, {
          ...(openRow.value ?? model.value),
          ...draft.value
        })
      )
    )
    .then(result => {
      if (result === false) formError.value = refusal();
      else openAction.value = undefined;
    })
    .catch(error => {
      formError.value = messageOf(error);
    })
    .finally(() => {
      pending.value = false;
    });
}
</script>
