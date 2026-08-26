<template>
  <div
    role="group"
    :aria-label="t('labs.scope_bar')"
    class="flex min-w-0 flex-1 items-center gap-2.5"
    data-test-key="scope-bar"
  >
    <Text
      as="span"
      size="xs"
      class="text-promo font-bold tracking-widest uppercase"
    >
      {{ t("labs.scope_bar") }}
    </Text>

    <div data-segment class="flex min-w-0 items-center empty:hidden">
      <BrandSegment />
    </div>

    <div data-segment class="flex min-w-0 items-center empty:hidden">
      <SessionSwitcher />
    </div>

    <div data-segment class="flex min-w-0 items-center empty:hidden">
      <ActingForSegment />
    </div>

    <div v-if="pool.length" class="ms-auto flex items-center gap-2.5">
      <Tooltip
        v-if="next"
        :label="t('labs.scope_pool_cycle', { label: next.label })"
      >
        <Button
          variant="ghost"
          size="sm"
          :aria-label="t('labs.scope_pool_cycle', { label: next.label })"
          :data-attrs="{ 'data-test-key': 'scope-pool-cycle' }"
          @click="cycle"
        >
          <AvatarGroup size="xs" :overflow="overflow">
            <Avatar
              v-for="member in shown"
              :key="member.id"
              size="xs"
              :src="member.avatar?.src"
              :alt="member.avatar?.caption"
              :force-caption="member.avatar?.forceCaption"
            >
              <template #fallback>{{ member.avatar?.caption }}</template>
            </Avatar>
          </AvatarGroup>
        </Button>
      </Tooltip>

      <AvatarGroup v-else size="xs" :overflow="overflow">
        <Avatar
          v-for="member in shown"
          :key="member.id"
          size="xs"
          :src="member.avatar?.src"
          :alt="member.avatar?.caption"
          :force-caption="member.avatar?.forceCaption"
        >
          <template #fallback>{{ member.avatar?.caption }}</template>
        </Avatar>
      </AvatarGroup>

      <Text as="span" variant="muted" size="sm">
        {{ t("labs.scope_live_sessions", pool.length) }}
      </Text>
    </div>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/scope/ScopeBar
 * @description The app chrome's ONE scope cluster — brand · identity ·
 * acting-for read as a single grouped control (`G11` · `AC1.1`). Scope is
 * global, so the cluster lives in the layout while scenarios stay on the page
 * (`G9`).
 *
 * The artifact draws it as a full-bleed band ABOVE all chrome, not as a boxed
 * group inside the header — so the layout mounts it in `PortalShell`'s
 * `#announcement` slot, which is that band by definition. The row reads
 * `SCOPE` · the three segments · the session pool, right-aligned.
 *
 * It owns the grouping, and ONE write of its own. Each segment owns its own
 * trigger, panel, scope write and whether it renders at all — so the bar never
 * gates what a segment offers: a page's matrix greys actor rows inside the
 * acting-for picker and never reaches the global session pool (`AC1.4` ·
 * `ESC5`). The exception is the avatar stack's `cycle()`: the pool is already
 * the list of everything live, so stepping through it is the cheapest possible
 * switch, and it goes through the SAME `switchSession` the pool's own rows call
 * rather than a second path.
 */

import { Avatar, AvatarGroup, Button, Text, Tooltip } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import ActingForSegment from "./ActingForSegment.vue";
import BrandSegment from "./BrandSegment.vue";
import SessionSwitcher from "./SessionSwitcher.vue";
import { useActorScopeSelector } from "./useActorScopeSelector";
import { compact, find, findIndex, reject, size, take } from "lodash-es";
// -----------------------------------------------------------------------------

/** How many faces the stack shows before it counts the rest. */
const SHOWN = 3;

const { t } = useI18n();

const { sessionItems, switchSession } = useActorScopeSelector();

/** Every session the app holds — the pool the switcher lists, counted here. */
const pool = computed(() => sessionItems.value);

const active = computed(() => find(pool.value, "isActive"));

/**
 * The faces, ACTIVE ONE LAST. `AvatarGroup` overlaps with `-space-x-2` and sets
 * no z-index, so paint order is DOM order and the last sibling is the only face
 * nothing covers. The session being acted as is the one that must read cleanly,
 * so it takes that slot — and because the stack is a switch, its face changes
 * every press, which is the feedback the press gives.
 *
 * Taking it out first also guarantees it is drawn at all: a pool deeper than
 * `SHOWN` would otherwise leave the active session inside the `+N` count.
 */
const shown = computed(() =>
  compact([...take(reject(pool.value, "isActive"), SHOWN - 1), active.value])
);

// Counted against what is actually DRAWN, never against `SHOWN`: with no
// active session `compact` drops the undefined tail, so the stack shows one
// fewer face than `SHOWN` and a fixed subtrahend undercounts the rest by one.
const overflow = computed(() =>
  Math.max(0, size(pool.value) - size(shown.value))
);

/**
 * The session a press would land on — the one AFTER the active session, wrapping
 * at the end. It is what makes the stack a control rather than a readout: the
 * pool is already the list of everything live, so stepping through it is the
 * cheapest possible switch, and the panel behind `SessionSwitcher` stays the way
 * to pick one by name.
 *
 * `undefined` while the pool holds a single session — there is nowhere to go,
 * so the stack stays the plain readout it was and never offers a dead press.
 */
const next = computed(() => {
  if (size(pool.value) < 2) return undefined;

  const at = findIndex(pool.value, "isActive");
  return pool.value[(at + 1) % size(pool.value)];
});

/** Activate the next session — the SAME write the pool's own rows make. */
function cycle() {
  if (!next.value) return;
  switchSession(next.value.actor, next.value.id);
}
</script>
