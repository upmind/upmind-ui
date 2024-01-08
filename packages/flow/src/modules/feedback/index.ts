// --- external
import { interpret } from "xstate";

// --- internal
import feedbackMachine from "./feedback.machine";

// --- utils
import { useTime } from "../../utils";
import { get } from "lodash-es";

// --- types
import { messageTypes } from "./types.d";
import { messageDisplays, type Message } from "./types.d";

// --------------------------------------------------------
// create a global instance of the feedback machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(feedbackMachine, { devTools: false }).onTransition(
  newState => (state = newState)
);
// --------------------------------------------------------

export const useFeedback = () => {
  // --------------------------------------------------------
  // methods

  function add(message: Message) {
    service.send({ type: "ADD", data: message });
  }

  function dismiss(id: string) {
    service.send({ type: "REMOVE", data: { id } });
  }

  // --- syntactic sugar

  function addError(
    message: string,
    display: messageDisplays = messageDisplays.TOAST,
    delay: number = 0,
    maxAge: number = useTime().SECOND * 6
  ) {
    return add({
      type: messageTypes.ERROR,
      message: message,
      display,
      delay,
      maxAge
    } as Message);
  }

  function addSuccess(
    message: string,
    display: messageDisplays = messageDisplays.TOAST,
    delay: number = 0,
    maxAge: number = useTime().SECOND * 3
  ) {
    return add({
      type: messageTypes.SUCCESS,
      message: message,
      display,
      delay,
      maxAge
    } as Message);
  }

  // maybe?
  // function addDebug(message: string) {
  //   const message: Message = {
  //     id: uniqueId("message_"),
  //     type: messageTypes.DEBUG,
  //     message: message,
  //     display: messageDisplays.CONSOLE,
  //     delay: 0,
  //     maxAge: 0
  //   };

  //   return add(message);
  // }

  // --------------------------------------------------------

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state,

    // ---
    getMessages: () => state.context.messages,
    getMessage: id => get(state.context.messages, id),
    // ---
    add,
    addError,
    addSuccess,
    dismiss
  };
};
