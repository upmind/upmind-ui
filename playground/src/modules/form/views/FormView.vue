<template>
  <section class="forms w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Form Demo</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <p>This will render a JSON form that is generated from a JSON schema.</p>

    <JsonForm
      :schema="schema"
      :uischema="uischema"
      class="my-4"
      @reject="doReject"
      @resolve="doResolve"
      debug
    />

    <footer></footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useDate } from "../";
import JsonForm from "../components/Form.vue";

const schema = {
  required: ["name", "rating", "dueDate"],
  properties: {
    name: {
      type: "string",
      minLength: 1,
      description: "The task's name"
    },

    description: {
      title: "Short Description",
      type: "string"
    },

    note: {
      title: "Long Description/Details",
      type: "string"
    },

    done: {
      type: "boolean"
    },

    dueDate: {
      type: "string",
      format: "date",
      description: "The task's due date",
      max: useDate(),
      default: useDate()
    },

    rating: {
      type: "integer",
      maximum: 5
    },

    recurrence: {
      type: "string",
      enum: ["Never", "Daily", "Weekly", "Monthly"]
    },

    recurrenceInterval: {
      type: "integer",
      description: "Days until recurrence"
    }
  }
};

const uischema = {
  type: "HorizontalLayout",
  elements: [
    {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/name"
        },
        {
          type: "Control",
          scope: "#/properties/description"
        },
        {
          type: "Control",
          scope: "#/properties/note",
          options: {
            multi: true
          }
        },
        {
          type: "Control",
          scope: "#/properties/done"
        }
      ]
    },
    {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/dueDate"
        },
        {
          type: "Control",
          scope: "#/properties/rating"
        },
        {
          type: "Control",
          scope: "#/properties/recurrence"
        },
        {
          type: "Control",
          scope: "#/properties/recurrenceInterval"
        }
      ]
    }
  ]
};

function doReject() {
  console.log("doReject");
}

function doResolve(value) {
  console.log("doResolve", value);
}

const model = ref({});
</script>
