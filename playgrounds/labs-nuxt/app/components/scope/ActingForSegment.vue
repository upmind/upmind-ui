<template>
  <DropdownMenu
    v-if="hasRows"
    :items="items"
    :label="t('labs.acting_for')"
    class="border-promo shadow-overlay w-72 rounded-xl"
  >
    <template #trigger>
      <Button
        :class="
          isActing ? 'bg-control-selected text-control-selected' : 'text-muted'
        "
        size="sm"
        variant="ghost"
        :data-attrs="{ 'data-test-key': 'acting-for' }"
      >
        <Icon :icon="triggerIcon" size="xs" />
        {{ triggerLabel }}
        <Icon icon="chevron-down" size="xs" />
      </Button>
    </template>

    <template #item="{ item }">
      <Tooltip
        v-if="isUnsupported(String(item.value))"
        :label="t('labs.acting_for_unsupported', { actor: item.label })"
      >
        <Button
          :data-attrs="item.dataAttrs"
          class="justify-start"
          block
          disabled
          size="sm"
          variant="ghost"
        >
          {{ item.label }}
        </Button>
      </Tooltip>

      <Button
        v-else
        :data-attrs="item.dataAttrs"
        :aria-current="isCurrent(String(item.value)) ? 'true' : undefined"
        :class="[
          actorRow({ isCurrent: isCurrent(String(item.value)) }),
          'justify-start'
        ]"
        block
        size="sm"
        variant="ghost"
      >
        {{ item.label }}

        <span class="ml-auto flex shrink-0 items-center gap-2">
          <span
            v-if="contextFor(String(item.value))"
            class="text-muted text-xs leading-none text-nowrap"
          >
            {{ contextFor(String(item.value)) }}
          </span>
          <Icon
            v-if="isCurrent(String(item.value))"
            icon="check"
            size="nano"
            class="text-success"
          />
        </span>
      </Button>
    </template>

    <div class="border-control-default border-t p-2">
      <Input
        v-model="searchQuery"
        :disabled="!contextType"
        :placeholder="t('labs.acting_for_search')"
        :data-attrs="{ 'data-test-key': 'acting-for-search' }"
        @keydown="onFieldKeydown"
      >
        <template #leading>
          <Icon icon="search-sm" size="xs" class="text-muted" />
        </template>
      </Input>

      <!-- Hand-assembled, so the roles are stated: the rows are a single-select
           LIST, and without them a reader hears four unrelated buttons and is
           never told which client is being acted for. -->
      <div
        v-if="contextType"
        role="listbox"
        :aria-label="t('labs.acting_for_search')"
        class="mt-2 max-h-48 overflow-y-auto"
      >
        <Button
          v-for="client in filteredClients"
          :key="String(client.value)"
          role="option"
          :data-attrs="client.dataAttrs"
          :aria-selected="currentContext?.id === client.value"
          :class="[
            actorRow({ isCurrent: currentContext?.id === client.value }),
            'justify-start'
          ]"
          block
          size="sm"
          variant="ghost"
          @click="selectClient(client)"
        >
          {{ client.label }}
          <Icon
            v-if="currentContext?.id === client.value"
            icon="check"
            size="nano"
            class="text-success ml-auto"
          />
        </Button>

        <p
          v-if="!filteredClients.length && searchQuery"
          class="text-muted p-2 text-center text-sm"
        >
          {{ t("labs.acting_for_search_empty") }}
        </p>
      </div>

      <div v-if="contextType" class="border-control-default mt-2 border-t pt-2">
        <Input
          v-model="idInput"
          :placeholder="t('labs.acting_for_id_placeholder')"
          @keydown="onFieldKeydown"
          @keyup.enter="applyId"
        >
          <template #trailing>
            <Tooltip :label="t('labs.acting_for_id_apply')">
              <Button
                :disabled="!idInput"
                icon-only
                size="sm"
                variant="ghost"
                :data-attrs="{ 'data-test-key': 'acting-for-id-apply' }"
                @click="applyId"
              >
                <Icon icon="check" size="xs" />
              </Button>
            </Tooltip>
          </template>
        </Input>
      </div>
    </div>
  </DropdownMenu>
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

import { Button, DropdownMenu, Input, Tooltip } from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@upmind-automation/client-vue";
import { ScopeActorTypes, useSessionStore } from "@upmind-automation/headless";
import {
  buildScopePath,
  useActorScope,
  useContextScope
} from "../../composables/scope";
import { usePlaygroundUrlState } from "../../composables/usePlaygroundUrlState";
import { actorRow } from "./ActingForSegment.styles";
import { useContextScopeSelector } from "./useContextScopeSelector";
import {
  filter,
  find,
  first,
  get,
  has,
  includes,
  isEmpty,
  map,
  reject,
  toLower
} from "lodash-es";
import type { ActorContextRow } from "./useContextScopeSelector";
import type { ComboboxOption, MenuItem } from "@upmind/ui";
import type { SessionEntry } from "@upmind-automation/headless";

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

const isActing = computed(() => !!currentContext.value);

const idInput = ref("");
const searchQuery = ref("");
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
const items = computed<MenuItem[]>(() =>
  map(actorContexts.value, row => ({
    value: row.actor,
    label: t(ACTOR_LABELS[row.actor]),
    dataAttrs: {
      "data-test-key": "acting-for-actor",
      "data-test-value": row.actor
    },
    onSelect: handlerFor(row)
  }))
);

/** The pool's own known clients — the session store is the one place they live. */
const pool = computed<Record<string, SessionEntry>>(() =>
  isAvailable.value ? clientSessions.value : {}
);

/** The clients the app already knows: the session pool's own, then the recent. */
const clients = computed<ComboboxOption[]>(() => [
  ...map(pool.value, (entry, id) => clientItem(id, sessionLabel(entry, id))),
  ...map(
    reject(filter(recentContexts.value, ["type", contextType.value]), entry =>
      has(pool.value, entry.id)
    ),
    entry => {
      // Prefer pool label if available, else use stored label
      const poolEntry = get(pool.value, entry.id);
      const label = poolEntry
        ? sessionLabel(poolEntry, entry.id)
        : (entry.label ?? entry.id);
      return clientItem(entry.id, label);
    }
  )
]);

/** Clients filtered by search query. */
const filteredClients = computed<ComboboxOption[]>(() => {
  if (!searchQuery.value) return clients.value;
  const query = toLower(searchQuery.value);
  return filter(
    clients.value,
    client =>
      toLower(client.label ?? "").includes(query) ||
      toLower(String(client.value)).includes(query)
  );
});

// --- Methods

function rowFor(value: string) {
  return find(actorContexts.value, ["actor", value]);
}

/** Self returns to the bare scope; a resolving actor arms its context type. */
function handlerFor(
  row: ActorContextRow
): ((event: Event) => void) | undefined {
  if (row.actor === ScopeActorTypes.SELF) {
    return () => {
      clear();
    };
  }
  if (!row.contextType) return undefined;

  return (event: Event) => {
    event.preventDefault(); // Keep menu open for context selection
    armed.value = row.actor;
    searchQuery.value = "";
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

function clientItem(id: string, label: string): ComboboxOption {
  return {
    value: id,
    label,
    dataAttrs: { "data-test-key": "acting-for-client", "data-test-value": id }
  };
}

/** What a context is CALLED, where anything the app knows says so. */
function labelFor(id: string): string {
  // 1. Session pool is most authoritative
  const entry = get(pool.value, id);
  if (entry) return sessionLabel(entry, id);

  // 2. Check clients list (may have label from pool or recentContexts)
  const clientEntry = find(clients.value, ["value", id]);
  if (clientEntry?.label && clientEntry.label !== id) return clientEntry.label;

  // 3. Check recentContexts (use label only if different from ID)
  const recent = find(recentContexts.value, ["id", id]);
  if (recent?.label && recent.label !== id) return recent.label;

  return id;
}

/** Keys the MENU owns, which a field inside it must not swallow. */
const MENU_KEYS = ["Escape", "Tab"];

/**
 * Typing in a field inside a `DropdownMenu` drives the menu's own typeahead and
 * moves focus off the field mid-word, so the keystroke is stopped here. Only
 * these keys are stopped: a blanket `@keydown.stop` also swallowed Escape, and
 * the panel could then not be closed from either field at all.
 */
function onFieldKeydown(event: KeyboardEvent): void {
  if (includes(MENU_KEYS, event.key)) return;
  event.stopPropagation();
}

/** Select a client from the list, using its known label. */
function selectClient(client: ComboboxOption): void {
  const id = String(client.value);
  const label =
    client.label && client.label !== id ? client.label : labelFor(id);
  void applyContextWithLabel(id, label);
}

/** Land the scope path this context resolves to; the composable re-boots on it. */
function applyContext(id: string): void {
  void applyContextWithLabel(id, labelFor(id));
}

async function applyContextWithLabel(id: string, label: string): Promise<void> {
  const type = contextType.value;
  const actor = target.value?.actor;
  if (!type || !actor || isEmpty(id)) return;

  remember({ type, id, label });
  searchQuery.value = "";

  // A guard can redirect or abort this push, and vue-router REJECTS on both —
  // an unhandled rejection for a navigation the app itself chose to redirect.
  // The scope is already remembered, so the landing is the router's to decide.
  await router
    .push(
      preserveQuery(
        buildScopePath({
          page: page.value,
          brandId: brandId.value,
          actor,
          context: { type, id }
        })
      )
    )
    .catch(() => undefined);
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
