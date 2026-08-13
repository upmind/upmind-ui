<template>
  <DropdownMenu
    v-if="hasRows"
    :items="items"
    :title="t('labs.acting_for')"
    width="lg"
  >
    <template #trigger>
      <Button
        :label="triggerLabel"
        :ring="false"
        :icon="triggerIcon"
        :class="styles.actingFor.trigger"
        icon-append="chevron-down"
        size="sm"
        variant="ghost"
        :data-attrs="{ 'data-test-key': 'acting-for' }"
      />
    </template>

    <template #item="{ item }">
      <Tooltip
        v-if="isUnsupported(item.value)"
        :label="t('labs.acting_for_unsupported', { actor: item.label })"
      >
        <Button
          :label="item.label"
          :icon="item.icon"
          :data-attrs="item.dataAttrs"
          :ring="false"
          align="left"
          block
          disabled
          size="sm"
          variant="ghost"
        />
      </Tooltip>

      <Button
        v-else
        :label="item.label"
        :icon="item.icon"
        :data-attrs="item.dataAttrs"
        :aria-current="isCurrent(item.value) ? 'true' : undefined"
        :class="actorRow({ isCurrent: isCurrent(item.value) })"
        :ring="false"
        align="left"
        block
        size="sm"
        variant="ghost"
      >
        <template #append>
          <span :class="styles.actingFor.trailing">
            <span v-if="contextFor(item.value)" :class="styles.actingFor.tag">
              {{ contextFor(item.value) }}
            </span>
            <Icon
              v-if="isCurrent(item.value)"
              icon="check"
              size="nano"
              :class="styles.actingFor.mark"
            />
          </span>
        </template>
      </Button>
    </template>

    <div :class="styles.actingFor.idField">
      <Input
        v-model="idInput"
        :disabled="!contextType"
        :placeholder="t('labs.acting_for_id_placeholder')"
        @keydown.stop
        @keyup.enter="applyId"
      >
        <template #append>
          <Tooltip :label="t('labs.acting_for_id_apply')">
            <Button
              :disabled="!idInput"
              :ring="false"
              icon="check"
              icon-only
              size="sm"
              variant="ghost"
              :data-attrs="{ 'data-test-key': 'acting-for-id-apply' }"
              @click="applyId"
            />
          </Tooltip>
        </template>
      </Input>
    </div>
  </DropdownMenu>

  <Combobox
    v-if="hasRows && !!contextType"
    :items="clients"
    :model-value="currentContext?.id"
    :placeholder="t('labs.acting_for_search')"
    :search-placeholder="t('labs.acting_for_search_placeholder')"
    :empty-message="t('labs.acting_for_search_empty')"
    :data-attrs="{ 'data-test-key': 'acting-for-search' }"
    search
    size="md"
    width="sm"
    @update:model-value="applyContext"
  />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/scope/ActingForSegment
 * @description Who the page is acting FOR — the scope bar's third segment
 * (`G11`), and the one surface the page's scope matrix greys.
 *
 * The matrix maps ACTOR to context type, so the axis is the actor row
 * (`AC1.4`): the actor that resolves is offered with the context it resolves
 * to, and the OTHER actors it marks `never` are shown unavailable with the
 * reason.
 * The greying stops here — the global session pool is app chrome and is never
 * gated by a page's matrix (`AC1.2`/`P9`), which is why the client-emails page's own
 * playable staff track and the matrix's `never` staff can disagree (`ESC5`).
 *
 * No client search exists in core (`ESC4`), so the chooser searches what the
 * app already knows — the session pool's own clients and the contexts acted
 * for before — with an explicit id as the last resort. Only that item source
 * changes when a `useClients` increment lands.
 *
 * Acting for NOBODY is acting as SELF (`R6-3`), and self is the resting state
 * of the whole scope bar (`R6-3b`) — so the segment names self and recedes
 * until a context is explicitly picked, rather than announcing an absence.
 * That holds INSIDE the panel too (`R6-12`): every matrix marks SELF `never` by
 * convention (`scope.types.ts`), so the self row is the identity row, not an
 * unsupported one — it is what the trigger names at rest, it carries the mark,
 * and picking it is the way back out of a context.
 */

import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ScopeActorTypes, useSessionStore } from "@upmind-automation/headless";
import {
  Button,
  Combobox,
  DropdownMenu,
  Icon,
  Input,
  Tooltip,
  useStyles
} from "@upmind-automation/upmind-ui";
import {
  buildScopePath,
  useActorScope,
  useContextScope
} from "../../composables/scope";
import { usePlaygroundUrlState } from "../../composables/usePlaygroundUrlState";
import config, { actorRow } from "./ActingForSegment.styles";
import { useContextScopeSelector } from "./useContextScopeSelector";
import { filter, find, first, get, has, isEmpty, map, reject } from "lodash-es";
import type { ActorContextRow } from "./useContextScopeSelector";
import type { SessionEntry } from "@upmind-automation/headless";
import type {
  ComboboxItemProps,
  DropdownMenuItemProps
} from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const ACTOR_LABELS: Record<ScopeActorTypes, string> = {
  [ScopeActorTypes.SELF]: "labs.actor_self",
  [ScopeActorTypes.STAFF]: "labs.actor_staff",
  [ScopeActorTypes.CLIENT]: "labs.actor_client",
  [ScopeActorTypes.GUEST]: "labs.actor_guest"
};

const ACTOR_ICONS: Record<ScopeActorTypes, string> = {
  [ScopeActorTypes.SELF]: "user-square",
  [ScopeActorTypes.STAFF]: "building-07",
  [ScopeActorTypes.CLIENT]: "user-01",
  [ScopeActorTypes.GUEST]: "user-circle"
};

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const actorScope = useActorScope();
const currentContext = useContextScope();
const { preserveQuery } = usePlaygroundUrlState();
const { actorContexts, recentContexts, remember } = useContextScopeSelector();

const store = useSessionStore();
const { clientSessions } = store.useContext();
const { isAvailable } = store.useMeta();

const styles = useStyles(
  ["actingFor"],
  computed(() => ({ isActing: !!currentContext.value })),
  config
);

const idInput = ref("");
const armed = ref<ScopeActorTypes>();

// --- Computed

const hasRows = computed(() => !isEmpty(actorContexts.value));

/** The actors this page's matrix resolves a context for — the pickable rows. */
const resolving = computed(() => filter(actorContexts.value, "contextType"));

/**
 * Which row the chooser is arming: the one picked, else the actor the page is
 * already at, else the only one this page resolves for.
 */
const target = computed(
  () =>
    find(resolving.value, ["actor", armed.value]) ??
    find(resolving.value, ["actor", actorScope.value]) ??
    first(resolving.value)
);

const contextType = computed(() => target.value?.contextType);

const brandId = computed(() => route.params.brandIdOrOrg as string | undefined);

const page = computed(() => {
  const segments = filter(route.path.split("/"), Boolean);
  return (brandId.value ? segments[1] : segments[0]) ?? "";
});

const triggerLabel = computed(() =>
  currentContext.value
    ? t("labs.acting_for_active", { label: labelFor(currentContext.value.id) })
    : t("labs.acting_for_none")
);

/** The resting segment wears SELF's own icon; a context wears the layers one. */
const triggerIcon = computed(() =>
  currentContext.value ? "layers-three-01" : ACTOR_ICONS[ScopeActorTypes.SELF]
);

/**
 * One row per actor the matrix declares — self among them, and the way back out
 * of a context IS that self row rather than a second control saying the same
 * thing (`R6-12`).
 */
const items = computed<DropdownMenuItemProps[]>(() =>
  map(actorContexts.value, row => ({
    value: row.actor,
    label: t(ACTOR_LABELS[row.actor]),
    icon: ACTOR_ICONS[row.actor],
    dataAttrs: {
      "data-test-key": "acting-for-actor",
      "data-test-value": row.actor
    },
    handler: handlerFor(row)
  }))
);

/** The pool's own known clients — the session store is the one place they live. */
const pool = computed<Record<string, SessionEntry>>(() =>
  isAvailable.value ? clientSessions.value : {}
);

/** The clients the app already knows: the session pool's own, then the recent. */
const clients = computed<ComboboxItemProps[]>(() => [
  ...map(pool.value, (entry, id) =>
    clientItem(id, sessionLabel(entry, id), "labs.acting_for_source_session")
  ),
  ...map(
    reject(filter(recentContexts.value, ["type", contextType.value]), entry =>
      has(pool.value, entry.id)
    ),
    entry =>
      clientItem(
        entry.id,
        entry.label ?? entry.id,
        "labs.acting_for_source_recent"
      )
  )
]);

// --- Methods

function rowFor(value: string) {
  return find(actorContexts.value, ["actor", value]);
}

/** Self returns to the bare scope; a resolving actor arms its context type. */
function handlerFor(row: ActorContextRow): (() => unknown) | undefined {
  if (row.actor === ScopeActorTypes.SELF) return clear;
  if (!row.contextType) return undefined;

  return () => {
    armed.value = row.actor;
  };
}

/**
 * Every matrix marks SELF `never` by convention (`scope.types.ts`), so that row
 * is the identity, not a capability this page lacks. Only ANOTHER actor the
 * declaration resolves no context for is unavailable (`AC1.4`).
 */
function isUnsupported(value: string): boolean {
  const row = rowFor(value);
  return !!row && !row.contextType && value !== ScopeActorTypes.SELF;
}

function contextFor(value: string): string | undefined {
  return rowFor(value)?.contextType ?? undefined;
}

/**
 * Which row the TRIGGER is naming — the panel may not contradict it (`R6-12`).
 * Acting for nobody is acting as self, so the mark rests on self and only a
 * live context moves it to the actor that resolved that context.
 */
function isCurrent(value: string): boolean {
  return currentContext.value
    ? actorScope.value === value
    : value === ScopeActorTypes.SELF;
}

function sessionLabel(entry: SessionEntry, id: string): string {
  return (
    entry.user?.publicName ?? entry.user?.fullName ?? entry.user?.email ?? id
  );
}

function clientItem(
  id: string,
  label: string,
  source: string
): ComboboxItemProps {
  return {
    value: id,
    label,
    selectedLabel: label,
    tag: t(source),
    dataAttrs: { "data-test-key": "acting-for-client", "data-test-value": id }
  };
}

/** What a context is CALLED, where anything the app knows says so. */
function labelFor(id: string): string {
  const entry = get(pool.value, id);
  if (entry) return sessionLabel(entry, id);

  return find(recentContexts.value, ["id", id])?.label ?? id;
}

/** Land the scope path this context resolves to; the composable re-boots on it. */
async function applyContext(id: string) {
  const type = contextType.value;
  const actor = target.value?.actor;
  if (!type || !actor || isEmpty(id)) return;

  remember({ type, id, label: labelFor(id) });

  await router.push(
    preserveQuery(
      buildScopePath({
        page: page.value,
        brandId: brandId.value,
        actor,
        context: { type, id }
      })
    )
  );
}

async function applyId() {
  const id = idInput.value.trim();
  if (isEmpty(id)) return;

  idInput.value = "";
  await applyContext(id);
}

async function clear() {
  armed.value = undefined;

  await router.push(
    preserveQuery(
      buildScopePath({
        page: page.value,
        brandId: brandId.value,
        actor: actorScope.value
      })
    )
  );
}
</script>
