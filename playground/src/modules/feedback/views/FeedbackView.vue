<template>
  <section class="feedback w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Feedback</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions">
          <button
            class="btn btn-ghost"
            @click="processMessages"
            :disabled="meta.isProcessing"
          >
            Add dummy messages
          </button>
        </slot>
      </div>
    </header>

    <div
      class="grid grid-cols-1 gap-4 my-8 rounded-box p-4 bg-base-200 text-base-content"
      :data-theme="activeTheme"
      v-if="!meta.isEmpty"
    >
      <upm-message
        v-for="(message, hash) in messages"
        :key="hash"
        :machine="message"
      ></upm-message>
    </div>

    <div
      class="grid grid-cols-1 gap-4 my-8 rounded-box p-4 bg-base-200 text-base-content"
      :data-theme="activeTheme"
      v-else
    >
      <h4 class="text-inherit m-0">No Active Messages to Display</h4>
    </div>

    <footer>
      <upm-debug
        title="Feedback"
        :state="state"
        :context="messages"
        :meta="meta"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { useFeedback } from "..";
import { UpmDebug } from "@upmind/components";
import UpmMessage from "../components/Message.vue";
import { forEach, random } from "lodash-es";

const activeTheme = inject("activeTheme");

const { state, messages, meta, useTime, add } = useFeedback();

// ---

function getRandomDelay() {
  const value = random(0, 60);
  return !value ? useTime().IMMIDIATE : useTime().SECOND * value;
}

function getRandomMaxAge() {
  const value = random(0, 60);
  return !value ? useTime().IMMIDIATE : useTime().SECOND * value;
}

function getRandomType() {
  return [
    "error",
    "info",
    "neutral",
    "primary",
    "secondary",
    "success",
    "warning"
  ][random(0, 6)];
}

function getRandomDisplay() {
  return ["toast", "notification"][random(0, 1)];
}

// ---

const dummyMessages = [
  // --- message 1 = Success Toasts
  {
    title: "Dolor laboris laborum laborum laborum",
    subtitle:
      "Reprehenderit adipisicing voluptate occaecat elit dolor exercitation elit nostrud",
    copy: "Exercitation duis duis ullamco adipisicing commodo tempor aute excepteur pariatur pariatur laborum ipsum. Tempor occaecat eu sit aute officia fugiat eu cupidatat consectetur cillum. Velit ex sit id eiusmod enim deserunt ullamco est culpa.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "success",
    display: "toast"
  },
  {
    title: "Aute laborum pariatur velit eu qui.",
    subtitle:
      "Voluptate anim nostrud veniam excepteur nostrud nulla tempor quis culpa magna minim enim quis.",
    copy: "Aliqua nulla pariatur velit laborum in excepteur consectetur veniam. Magna cillum laborum ad sint sit est. Officia pariatur incididunt aute elit pariatur reprehenderit laborum irure id exercitation culpa ex dolore ullamco. Quis pariatur officia esse laborum do ad nisi veniam. Sunt mollit enim do officia non proident mollit laboris velit anim anim amet. Non et cupidatat cillum fugiat voluptate. Minim ut ex fugiat enim tempor sit consectetur occaecat.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "success",
    display: "toast"
  },
  {
    title:
      "Amet sint id sint nulla reprehenderit pariatur commodo al,iqua tempor eiusmod.",
    subtitle: "Irure cillum dolore amet sunt eiusmod deserunt excepteur.",
    copy: "Magna sint magna laborum id. Adipisicing deserunt ut non sunt ullamco. Ea cillum qui magna commodo ipsum cupidatat cupidatat sit. Incididunt nulla duis sit proident nulla reprehenderit.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "success",
    display: "toast"
  },
  {
    title: "Cupidatat dolore Lorem officia dolore et voluptate lab,orum.",
    subtitle: "Excepteur ex esse sint minim proident mollit velit eu.",
    copy: "Qui ad consectetur occaecat ullamco in laborum aute irure exercitation exercitation enim. Esse incididunt occaecat laboris irure fugiat veniam id minim velit. Ullamco minim deserunt et ea anim velit tempor. Aliqua ullamco pariatur ullamco cillum in culpa sunt labore eiusmod in laborum excepteur eu. Tempor et irure pariatur nulla fugiat laboris in eu. Dolore ipsum commodo cupidatat in exercitation tempor mollit labore non proident Lorem aliquip dolor.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "success",
    display: "toast"
  },
  {
    title: "Minim ut fugiat in do laboris tempor id pariatur est.",
    subtitle: "Quis proident laborum duis magna aliquip ad et dolore.",
    copy: "Quis elit Lorem deserunt eu occaecat excepteur laborum occaecat eu aliquip enim irure. Culpa sunt incididunt in cupidatat laboris. Deserunt fugiat veniam incididunt tempor qui nulla labore.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "success",
    display: "toast"
  },
  {
    title: "Tempor magna nulla velit culpa.",
    subtitle:
      "Duis aliquip est tempor excepteur eu commodo aute do proident qui.",
    copy: "Laboris amet laboris mollit sunt commodo eu consequat. Exercitation duis voluptate cupidatat nostrud fugiat et exercitation nulla labore dolor nostrud. Consectetur adipisicing pariatur sint pariatur velit enim ipsum. Irure dolor irure labore elit velit. Lorem irure duis esse ipsum nulla culpa cupidatat aliquip proident minim dolore.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "success",
    display: "toast"
  },
  {
    title: "Incididunt id ut nulla culpa ea.",
    subtitle:
      "Adipisicing mollit ea irure pariatur non commodo laboris sit dolore Lorem culpa.",
    copy: "Qui occaecat do ullamco ullamco fugiat mollit sunt laboris veniam pariatur dolor irure nostrud. Incididunt fugiat sit eiusmod dolor mollit duis id voluptate labore exercitation eiusmod pariatur mollit. Ut do consectetur commodo qui ea cupidatat deserunt ad officia ut do laboris esse. Cillum qui do duis sunt eiusmod do labore deserunt sunt consequat irure aute ut. Sint minim est magna pariatur officia ipsum irure mollit dolore fugiat tempor labore eu. Amet ipsum qui aute sit dolore ut enim culpa deserunt aliquip irure aliquip. Tempor labore elit do et aliquip enim mollit sunt duis laboris.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "success",
    display: "toast"
  },

  // --- message 2 = Error Toasts
  {
    title:
      "Officia nostrud sunt excepteur dolor irure cillum et fugiat nostrud nulla ,irure.",
    subtitle:
      "Ad adipisicing labore anim magna culpa nulla in aliqua in cupidatat dolor.",
    copy: "Mollit mollit ad adipisicing et dolore tempor duis velit. Pariatur commodo aute aliqua anim reprehenderit. Anim eiusmod aute ullamco fugiat adipisicing labore fugiat ullamco quis ullamco in minim incididunt. Et anim cupidatat nisi duis ipsum tempor. Enim et est cillum sunt esse ad magna. Duis cupidatat consequat eu deserunt pariatur culpa voluptate dolor ex labore ullamco nulla. Ut in consequat non do qui culpa ut aliquip anim qui anim cillum non culpa.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "error",
    display: "toast"
  },
  {
    title: "Nisi magna cupidatat quis Lorem amet.",
    subtitle:
      "Consequat tempor minim minim fugiat occaecat occaecat consequat aliqua pariatur ex qui.",
    copy: "Amet cillum labore velit sint veniam mollit do. Cillum laborum culpa sint sunt in. Et amet ea id ullamco sunt commodo nisi aliquip pariatur quis reprehenderit.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "error",
    display: "toast"
  },
  {
    title: "Aute eiusmod fugiat nostrud aliqua elit sit.",
    subtitle: "Fugiat et sunt reprehenderit ullamco sint esse.",
    copy: "Incididunt voluptate duis aute magna ipsum eiusmod laboris consectetur commodo culpa reprehenderit. Eu esse anim mollit do consequat culpa enim consequat proident sunt. Exercitation culpa laboris qui adipisicing. Do eiusmod ea qui minim minim adipisicing ut magna sunt pariatur incididunt dolore. Mollit ea enim id eu aute elit velit exercitation id incididunt elit velit consectetur. Mollit enim Lorem ea irure in Lorem commodo do occaecat nulla sint voluptate.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "error",
    display: "toast"
  },
  {
    title:
      "Reprehenderit veniam qui adipisicing dolore id sint de,serunt nisi ullamco.",
    subtitle: "Nostrud dolore do tempor duis in sit sunt irure Lorem.",
    copy: "Nulla culpa veniam cillum veniam proident. Nisi sint dolor do ex. Commodo esse minim laborum sit. Proident labore excepteur anim deserunt Lorem aliquip ea do quis anim ipsum est laborum duis. Sit enim adipisicing quis cillum labore enim ipsum dolor proident.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "error",
    display: "toast"
  },
  {
    title:
      "Laborum est nulla sunt culpa aliquip anim voluptate laboris proident.",
    subtitle:
      "Ipsum esse incididunt excepteur irure incididunt consectetur laboris in Lorem consectetur.",
    copy: "Labore reprehenderit laborum amet id. Adipisicing elit tempor dolore nostrud adipisicing ipsum velit officia cupidatat irure voluptate est amet. Nostrud minim incididunt dolore in eu adipisicing sit. Ullamco exercitation laboris fugiat laboris velit est. Cupidatat nisi reprehenderit fugiat anim duis ex occaecat in anim do pariatur duis et.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "error",
    display: "toast"
  },
  {
    title: "Cillum voluptate magna in eiusmod proident minim ullamco.",
    subtitle:
      "Tempor elit consequat minim reprehenderit elit pariatur fugiat dolore officia ex.",
    copy: "Dolor consectetur laboris adipisicing voluptate magna voluptate. Incididunt ex nisi enim dolor. Laboris mollit ex amet ipsum consequat sint anim commodo esse elit. Minim elit culpa id eu est proident qui proident fugiat et. Magna incididunt nisi fugiat dolore ipsum dolore ullamco aliqua culpa est. Fugiat dolor labore deserunt duis magna exercitation non.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "error",
    display: "toast"
  },
  {
    title: "Enim nisi nulla nisi ad id nisi mollit.",
    subtitle: "Culpa officia ex sunt pariatur id qui nisi et proident.",
    copy: "Qui et consequat dolore reprehenderit non duis do veniam cillum eu cillum ea. Magna dolor id eu proident enim sint culpa amet proident tempor eu cupidatat tempor. Reprehenderit anim excepteur aliquip consequat voluptate aliquip adipisicing aliqua labore quis. Fugiat cupidatat elit anim et cupidatat excepteur eiusmod. Veniam magna aliqua aliquip veniam voluptate excepteur do amet voluptate proident cillum cupidatat veniam cillum.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: "error",
    display: "toast"
  },

  // --- message 3 = random types and display
  {
    title:
      "Culpa proident culpa excepteur culpa excepteu,r ut fugiat fugiat reprehenderit qui proident excepteur aliqua aute.",
    subtitle: "Labore do non anim qui est eiusmod consequat.",
    copy: "Irure excepteur occaecat ex sint Lorem labore officia eiusmod aute duis. Ad occaecat minim sit pariatur. Aliquip enim cillum Lorem magna excepteur aliqua esse labore id. Culpa qui aliquip pariatur cillum. Consectetur aliquip mollit sint et mollit sunt veniam ex aliquip fugiat officia. Ad cupidatat et incididunt eu labore ad do. Elit anim eu anim eiusmod cillum consectetur voluptate in id enim velit dolore nulla irure.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: getRandomType(),
    display: getRandomDisplay()
  },
  {
    title:
      "Officia deserunt irure cillum irure quis duis amet qui sint ,minim nisi enim.",
    subtitle: "Proident ipsum elit veniam ipsum velit id excepteur quis et.",
    copy: "Anim tempor commodo id sunt ipsum voluptate ex anim et. Voluptate minim esse officia incididunt incididunt incididunt non tempor velit. Dolore laboris deserunt qui ipsum quis ut cillum ea ex labore. Sunt consectetur magna est mollit amet dolor quis duis proident.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: getRandomType(),
    display: getRandomDisplay()
  },
  {
    title:
      "Nisi adipisicing consectetur proident exercitation, Lorem consectetur enim ex laboris pariatur.",
    subtitle: "Quis esse velit Lorem nisi eu dolor occaecat amet.",
    copy: "Deserunt quis proident cupidatat sint fugiat id incididunt. Incididunt nisi quis tempor et eu laborum minim amet pariatur. Do deserunt tempor consequat nulla elit est veniam labore ullamco aliqua incididunt voluptate officia.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: getRandomType(),
    display: getRandomDisplay()
  },
  {
    title:
      "Esse tempor commodo magna cupidatat ut enim cupidatat nostrud elit.",
    subtitle:
      "Pariatur nostrud irure dolor laborum consectetur duis commodo sit enim non eu adipisicing.",
    copy: "Aute minim tempor labore pariatur ipsum non ea ex amet veniam id. Lorem tempor ullamco adipisicing dolor commodo esse duis mollit aliquip. Qui elit et nulla ipsum eu culpa ullamco nisi consectetur quis veniam ea. Eiusmod occaecat officia eu occaecat dolor nostrud qui. Cillum dolor voluptate consequat Lorem anim irure dolore non.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: getRandomType(),
    display: getRandomDisplay()
  },
  {
    title:
      "Cupidatat excepteur proident ame,t laborum irure ut officia proident fugiat aute mollit.",
    subtitle: "Ut laborum irure culpa deserunt.",
    copy: "Aute laboris ut elit consectetur incididunt ullamco voluptate deserunt elit. Incididunt officia magna aute ea ut sunt enim exercitation culpa id. Commodo culpa do tempor aliqua aliqua duis ad qui sit et tempor. Amet ex id in sunt enim et tempor culpa. Esse commodo commodo cillum voluptate.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: getRandomType(),
    display: getRandomDisplay()
  },
  {
    title: "Veniam qui dolor in enim ex ea.",
    subtitle: "Mollit non pariatur ex eu est labore et esse adipisicing.",
    copy: "Id labore nisi adipisicing officia consequat exercitation proident irure ipsum minim. Sint adipisicing aute dolore nisi aliquip sit proident occaecat elit adipisicing elit ut. Excepteur cillum aliqua duis consectetur aliquip occaecat excepteur voluptate cillum sint cillum ad. Irure ex occaecat proident enim sunt occaecat.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: getRandomType(),
    display: getRandomDisplay()
  },
  {
    title: "Adipisicing enim ullamco ad,ipisicing id.",
    subtitle: "Tempor est voluptate ex ad.",
    copy: "Ullamco velit voluptate voluptate ut est culpa in ex veniam fugiat do culpa. Aute ad ea reprehenderit sint fugiat laboris. Eiusmod qui velit cillum duis enim.",
    delay: getRandomDelay(),
    maxAge: getRandomMaxAge(),
    type: getRandomType(),
    display: getRandomDisplay()
  }
];

function processMessages() {
  forEach(dummyMessages, message => add(message));
}

// ---
</script>
