<template>
  <DropdownMenu v-if="hasMembers || isActing" :items="[]" class="w-80">
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

    <DropdownMenuLabel
      class="text-muted border-surface border-b text-xs tracking-wider uppercase"
    >
      {{ t("labs.acting_for_pick_context") }}
    </DropdownMenuLabel>

    <!-- SELECTOR members: the type IS the whole answer, so each is one row and
         picking it is the whole act. -->
    <DropdownMenuGroup
      v-if="availableSelectorMembers.length"
      class="flex flex-col p-1"
    >
      <DropdownMenuItem
        v-for="member in availableSelectorMembers"
        :key="member.type"
        :data-attrs="{
          'data-test-key': 'acting-for-context',
          'data-test-value': member.type
        }"
        @select="selectMember(member)"
      >
        <span class="truncate text-sm font-medium">
          {{ startCase(member.type) }}
        </span>
      </DropdownMenuItem>
    </DropdownMenuGroup>

    <!-- RETARGET members: the type names an entity, so each one takes an id.
         A client is the one entity the session store already knows by name, so
         the known sessions are offered as rows beneath its id field. -->
    <template v-for="member in retargetMembers" :key="member.type">
      <DropdownMenuLabel
        class="text-muted border-surface border-b text-xs tracking-wider uppercase"
      >
        {{ t("labs.acting_for_by_id", { type: startCase(member.type) }) }}
      </DropdownMenuLabel>

      <div class="p-2">
        <Input
          v-model="idInputs[member.type]"
          :placeholder="
            t('labs.acting_for_id_placeholder', {
              type: startCase(member.type)
            })
          "
          size="sm"
          :data-attrs="{
            'data-test-key': 'acting-for-id-input',
            'data-test-value': member.type
          }"
          @keydown.stop
          @keyup.enter="applyId(member)"
        >
          <template #leading>
            <Icon icon="user-01" size="xs" class="text-muted" />
          </template>
          <template v-if="trim(idInputs[member.type])" #trailing>
            <Button
              variant="ghost"
              size="xs"
              :data-attrs="{
                'data-test-key': 'acting-for-id-apply',
                'data-test-value': member.type
              }"
              @click="applyId(member)"
            >
              <Icon icon="arrow-right" size="xs" />
            </Button>
          </template>
        </Input>
      </div>

      <DropdownMenuGroup
        v-if="isClientType(member.type)"
        class="flex flex-col p-1"
      >
        <DropdownMenuItem
          v-for="client in availableClients"
          :key="String(client.id)"
          :data-attrs="{
            'data-test-key': 'acting-for-client',
            'data-test-value': client.id
          }"
          @select="selectClient(client)"
        >
          <span class="flex min-w-0 items-center gap-2">
            <Avatar size="sm" :alt="client.name">
              <template #fallback>
                <span class="text-xs font-medium">{{
                  initials(client.name)
                }}</span>
              </template>
            </Avatar>
            <span class="flex min-w-0 flex-col">
              <span class="truncate text-sm font-medium">{{
                client.name
              }}</span>
              <span v-if="client.email" class="text-muted truncate text-xs">
                {{ client.email }}
              </span>
            </span>
          </span>
        </DropdownMenuItem>

        <p
          v-if="!availableClients.length && !isActing"
          class="text-muted py-4 text-center text-sm"
        >
          {{ t("labs.acting_for_no_clients") }}
        </p>
      </DropdownMenuGroup>
    </template>

    <p v-if="!hasMembers" class="text-muted py-4 text-center text-sm">
      {{ t("labs.acting_for_no_contexts") }}
    </p>

    <!-- The active context, whatever its pattern, and the one way out of it. -->
    <div
      v-if="isActing"
      class="bg-canvas border-surface flex items-center gap-2 border-t p-2"
    >
      <Avatar v-if="isRetargeting" size="sm" :alt="activeLabel">
        <template #fallback>
          <span class="text-xs font-medium">{{ initials(activeLabel) }}</span>
        </template>
      </Avatar>
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-sm font-medium">{{ activeLabel }}</span>
        <span class="text-muted text-xs">{{ t("labs.acting_for") }}</span>
      </span>
      <Tooltip :label="t('labs.acting_for_clear')">
        <Button
          size="sm"
          variant="ghost"
          icon-only
          :aria-label="t('labs.acting_for_clear')"
          :data-attrs="{ 'data-test-key': 'acting-for-clear' }"
          @click="clear"
        >
          <Icon icon="x-close" size="xs" />
        </Button>
      </Tooltip>
    </div>
  </DropdownMenu>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/scope/ActingForSegment
 * @description The scope bar's "acting for" picker. It is driven by the scope
 * matrix the page registered, and by nothing else: every context member the
 * matrix declares for the url's actor is offered, and the member's PATTERN
 * decides how it is picked.
 *
 * - A RETARGET member names an entity, so it takes an id. The row is an id
 *   field for that type. For `client` — the one entity the session store
 *   already knows — the held client sessions are offered beneath the field and
 *   an unknown id is impersonated into the pool first.
 * - A SELECTOR member IS the whole answer (which catalogue), so it is one row
 *   and picking it is the act. No id, no session, nothing to remember.
 *
 * Either way the pick becomes `/for/:type[/:id]` on the url (`buildScopePath`),
 * whatever actor the url names — SELF included. The page reads the context back
 * off the route and boots `.for()` from it.
 */

import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  Input,
  Tooltip
} from "@upmind/ui";
import { computed, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@upmind-automation/client-vue";
import {
  ScopeActorTypes,
  ScopeContextPatterns,
  useSessionStore
} from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  buildScopePath,
  useActorScope,
  useContextScope
} from "../../composables/scope";
import { usePlaygroundUrlState } from "../../composables/usePlaygroundUrlState";
import { impersonateClient } from "../../services/impersonation";
import { useContextScopeSelector } from "./useContextScopeSelector";
import {
  filter,
  find,
  get,
  has,
  isEmpty,
  map,
  reject,
  startCase,
  trim,
  uniqBy
} from "lodash-es";
import type { AvailableContext } from "./useContextScopeSelector";
import type { ScopeContext, SessionEntry } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

interface ClientOption {
  id: string;
  name: string;
  email?: string;
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const actorScope = useActorScope();
const currentContext = useContextScope();
const { preserveQuery } = usePlaygroundUrlState();
const { availableContexts, recentContexts, remember } =
  useContextScopeSelector();

const store = useSessionStore();
const { clientSessions } = store.useContext();
const { isAvailable } = store.useMeta();

/** One pending id per RETARGET member, keyed by the member's type. */
const idInputs = reactive<Record<string, string>>({});

const isActing = computed(() => !!currentContext.value);

// A RETARGET context names an entity by id; a SELECTOR one IS the whole answer
// and carries none. The two are mutually exclusive, so the id's presence is
// what tells the two apart on the active context.
const isRetargeting = computed(() => currentContext.value?.id !== undefined);

/** Whether a context type names a client — the entity the store knows by name. */
const isClientType = (type: string): boolean => type === AccessRoleTypes.CLIENT;

/**
 * Every member the registered matrix declares for the actor the url names.
 * `SELF` resolves to whoever is active, so it is offered every declared member
 * rather than none; the same type declared under two actors is one member.
 */
const members = computed<AvailableContext[]>(() =>
  uniqBy(
    filter(
      availableContexts.value,
      ctx =>
        actorScope.value === ScopeActorTypes.SELF ||
        ctx.actor === actorScope.value
    ),
    ctx => `${ctx.pattern}:${ctx.type}`
  )
);

const hasMembers = computed(() => !isEmpty(members.value));

const selectorMembers = computed<AvailableContext[]>(() =>
  filter(members.value, { pattern: ScopeContextPatterns.SELECTOR })
);

const retargetMembers = computed<AvailableContext[]>(() =>
  filter(members.value, { pattern: ScopeContextPatterns.RETARGET })
);

/** The selectors not already active — the active one is shown below, with clear. */
const availableSelectorMembers = computed<AvailableContext[]>(() =>
  reject(
    selectorMembers.value,
    member => member.type === currentContext.value?.type
  )
);

const brandId = computed(() => route.params.brandIdOrOrg as string | undefined);

const page = computed(() => {
  const segments = filter(route.path.split("/"), Boolean);
  return (brandId.value ? segments[1] : segments[0]) ?? "";
});

/** What the active context is called: the type, or the entity it names. */
const activeLabel = computed(() => {
  const context = currentContext.value;
  if (!context) return "";
  if (context.id === undefined) return startCase(context.type);
  return isClientType(context.type)
    ? labelFor(context.id)
    : `${startCase(context.type)} · ${context.id}`;
});

const triggerLabel = computed(() =>
  currentContext.value
    ? t("labs.acting_for_active", { label: activeLabel.value })
    : t("labs.acting_for_none")
);

const triggerIcon = computed(() =>
  currentContext.value ? "layers-three-01" : "user-square"
);

const pool = computed<Record<string, SessionEntry>>(() =>
  isAvailable.value ? clientSessions.value : {}
);

const poolClients = computed<ClientOption[]>(() =>
  map(pool.value, (entry, id) => ({
    id,
    name:
      entry.user?.publicName ?? entry.user?.fullName ?? entry.user?.email ?? id,
    email: entry.user?.email
  }))
);

const recentClients = computed<ClientOption[]>(() => {
  const poolIds = new Set(map(poolClients.value, "id"));
  return map(
    filter(
      recentContexts.value,
      (r): r is (typeof recentContexts.value)[number] & { id: string } =>
        isClientType(r.type) && !!r.id && !poolIds.has(r.id)
    ),
    r => ({ id: r.id, name: r.label ?? r.id, email: undefined })
  );
});

const allClients = computed<ClientOption[]>(() => [
  ...poolClients.value,
  ...recentClients.value
]);

const availableClients = computed<ClientOption[]>(() => {
  const activeId = currentContext.value?.id;
  if (!activeId) return allClients.value;
  return reject(allClients.value, c => c.id === activeId);
});

function initials(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function labelFor(id: string): string {
  const entry = get(pool.value, id);
  if (entry) {
    return (
      entry.user?.publicName ?? entry.user?.fullName ?? entry.user?.email ?? id
    );
  }
  const recent = find(recentContexts.value, ["id", id]);
  if (recent?.label) return recent.label;
  return id;
}

/**
 * A client id that is not in the pool is impersonated into it first, so the
 * page reads as that client. Any other entity is named by id alone.
 */
async function ensureClientSession(id: string): Promise<boolean> {
  if (has(pool.value, id)) return true;

  try {
    const token = await impersonateClient(id);
    const { registerImpersonation, add } = store.useActions();
    registerImpersonation(id);
    await add(token);
    return true;
  } catch {
    return false;
  }
}

/** Act for the entity typed into a RETARGET member's id field. */
async function applyId(member: AvailableContext): Promise<void> {
  const id = trim(idInputs[member.type] ?? "");
  if (!id) return;

  if (isClientType(member.type) && !(await ensureClientSession(id))) return;

  remember({
    type: member.type,
    id,
    label: isClientType(member.type) ? labelFor(id) : id
  });
  idInputs[member.type] = "";

  await navigate({ type: member.type, id });
}

/** Act for a client the store already holds, or has held before. */
async function selectClient(client: ClientOption): Promise<void> {
  if (!(await ensureClientSession(client.id))) return;

  remember({ type: AccessRoleTypes.CLIENT, id: client.id, label: client.name });

  await navigate({ type: AccessRoleTypes.CLIENT, id: client.id });
}

/** Act for a SELECTOR member — the type is the whole answer. */
async function selectMember(member: AvailableContext): Promise<void> {
  await navigate({ type: member.type });
}

async function clear(): Promise<void> {
  await navigate();
}

/** The one navigation every pick ends on: the page, at the actor, for the context. */
async function navigate(context?: ScopeContext): Promise<void> {
  await router
    .push(
      preserveQuery(
        buildScopePath({
          page: page.value,
          brandId: brandId.value,
          actor: actorScope.value,
          context
        })
      )
    )
    .catch(() => undefined);
}
</script>
