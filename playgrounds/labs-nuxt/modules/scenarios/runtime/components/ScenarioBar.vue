<template>
  <div
    role="group"
    :aria-label="t('labs.scenario_bar')"
    data-test-key="scenario-bar"
    :data-test-value="status"
    :class="scenarioBar.root()"
  >
    <div :class="scenarioBar.controls({ playing: isPlaying })">
      <Text variant="muted" size="xs" class="font-bold tracking-wide uppercase">
        {{ t("labs.scenarios") }}
      </Text>

      <ScenarioMenu
        :tracks="tracks"
        :armed="armed"
        :preset="preset"
        :disabled="!player.isAvailable"
        @select="choose"
      />

      <template v-if="armed">
        <Spinner
          v-if="isBusy"
          size="sm"
          :label="t('text.loading')"
          :data-attrs="{ 'data-test-key': 'scene-busy' }"
        />

        <Transport
          class="mx-auto"
          :playing="isPlaying"
          :playhead="playhead"
          :scene-count="armed.scenes.length"
          :busy="isBusy"
          @play="player.play"
          @pause="player.pause"
          @prev="player.prev"
          @next="player.next"
          @stop="player.stop"
        />

        <Badge
          v-if="isPlaying"
          appearance="outline"
          variant="primary"
          size="sm"
          data-test-key="replay-chip"
        >
          {{ t("labs.replay_chip") }}
        </Badge>
      </template>

      <Tooltip v-if="failure" :label="failure">
        <Badge
          size="sm"
          variant="danger"
          appearance="muted"
          :class="scenarioBar.failure()"
          :data-test-key="'scene-failure'"
        >
          {{ t("labs.scene_failed", { reason: failure }) }}
        </Badge>
      </Tooltip>

      <div :class="scenarioBar.tail()">
        <SheetToggle />
      </div>
    </div>

    <div v-if="armed" :class="scenarioBar.rail()">
      <!-- The position line stands where the track name did: the rail already
           names the scenario, and the bar is instrument, not prose. -->
      <p
        :class="scenarioBar.trackName()"
        data-test-key="scene-position"
        :data-test-value="armed.slug"
      >
        {{
          t("labs.scene_position", {
            current: playhead + 1,
            total: armed.scenes.length,
            line: armed.scenes[playhead]?.text ?? armed.name
          })
        }}
      </p>

      <SceneRail v-model="playhead" :scenes="armed.scenes" />
    </div>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ScenarioBar
 * @description The page's scenario bar and its media bar are ONE component in
 * two states, never two bars (`G9 unified`, `AC2.2`): the same node holds the
 * playlist on Live and grows the transport and the scene rail when a track is
 * armed. Nothing here is mounted per state at the ROOT — the states are children
 * of one element — so selecting a track morphs the bar in place and stopping
 * returns it in place, which is exactly what a second bar appearing beneath the
 * first could never do.
 *
 * It draws in TWO rows. The controls sit on the bar itself; the scene rail is
 * its own full-width row BELOW it, where a whole Gherkin sentence per stop can
 * be read (`R7-8`) — inline beside the transport those labels were five
 * truncated fragments, which is a progress bar nobody can follow. The rail row
 * exists only while a track is armed, so Live is one row and one row only.
 *
 * At the head of that row stands the POSITION LINE — *scene n of m*, carrying
 * the stop's own Gherkin sentence — not the track name it replaced. With the
 * chips gone (`R7-10`) the bar has nowhere to say a whole sentence, and the row
 * that reads as the page's progress is exactly where the scene that progress is
 * AT should be written: whole, never ellipsised. The track's own name is in the
 * menu that armed it and in the Scenario sheet; repeating it here said what the
 * user already knew and left *where am I* unanswered. The line falls back to
 * the track name only before the first scene runs, when there is no stop yet.
 *
 * On Live it offers no transport at all (`S12`, `AC2.3`). That is not a disabled
 * instrument: there is nothing to play, so the controls do not exist.
 *
 * The ONE menu beside Live is where every non-live state is chosen — the
 * scenarios in one group, the forced states in another (`R7-10`, `R7-11`) — and
 * this is the component that holds both handles, so it is here that arming one
 * releases the other. A track arms the `replay` preset itself (design §3.1
 * ruling 1), so a preset picked while a track plays would be a second hand on
 * the same worker: the track is stopped first, and the two can never be on at
 * once.
 *
 * It holds no playback state whatsoever: the player is handed in, and every
 * control asks it for the call it is named after. The scene rail's scrub is a
 * `seek`, which REPLAYS from scene 0 rather than stepping back — nothing can
 * un-fire a step (design §3.1 ruling 1) — and the pending of a scene in flight
 * is shown beside the track it belongs to (`E12`/`S14`), because an arm from a
 * pasted link is a scene running that no control was pressed for.
 *
 * A scene that THREW is said out loud in the same row (`S14`, `R6-13`). Every
 * control discards the promise the player hands back, so without this the only
 * trace of a failed arm or a refused assertion is a bar that has quietly
 * stopped moving — which reads as a dead control. It sits OUTSIDE the armed
 * block: an arm can fail before a track is ever held.
 */

import { Badge, Spinner, Text, Tooltip } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useForcedState } from "../composables/useForcedState";
import { SCENARIO_PLAYER_STATUS } from "../composables/useScenarioPlayer.types";
import { scenarioBar } from "./ScenarioBar.styles";
import { SCENARIO_CHOICE } from "./ScenarioMenu.types";
import ScenarioMenu from "./ScenarioMenu.vue";
import SceneRail from "./SceneRail.vue";
import SheetToggle from "./SheetToggle.vue";
import Transport from "./Transport.vue";
import { get, isNil, toString } from "lodash-es";
import type { ScenarioBarProps } from "./ScenarioBar.types";
import type { ScenarioChoice } from "./ScenarioMenu.types";
// -----------------------------------------------------------------------------

const props = defineProps<ScenarioBarProps>();

const { t } = useI18n();

const { preset, arm, disarm } = useForcedState();

const armed = computed(() => props.player.track.value);
const status = computed(() => props.player.status.value);
const isBusy = computed(() => props.player.isBusy.value);
const isPlaying = computed(
  () => status.value === SCENARIO_PLAYER_STATUS.PLAYING
);

// The reason as the thrower wrote it. `DetailedError` and `Error` alike carry
// it on `message`; anything else is said as it came, because a reason nobody
// can read is the same silence.
const failure = computed(() => {
  const reason = props.player.failure.value;
  return isNil(reason) ? undefined : toString(get(reason, "message", reason));
});

const playhead = computed({
  get: () => props.player.playhead.value,
  set: index => {
    void props.player.seek(index);
  }
});

async function choose(choice: ScenarioChoice): Promise<void> {
  if (choice.kind === SCENARIO_CHOICE.TRACK)
    return void props.player.arm(choice.track);

  const playing = !!armed.value;

  // `stop()` releases the worker as well as the track, so Live needs nothing
  // else when one is playing — and a preset must wait for that release before
  // it arms its own handlers over the same worker.
  if (playing) await props.player.stop();

  if (choice.kind === SCENARIO_CHOICE.FORCE) await arm(choice.preset);
  else if (!playing) await disarm();
}
</script>
