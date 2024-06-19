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
    console.debug("add message", message);
    service.send({ type: "ADD", data: message });
  }

  function dismiss(id: string) {
    service.send({ type: "REMOVE", data: { id } });
  }

  // --- syntactic sugar

  function addError(
    message: string | Object,
    display?: messageDisplays = messageDisplays.TOAST,
    delay?: number = 0,
    maxAge?: number = useTime().SECOND * 6
  ) {
    if (!message) return; // bail if no message

    return add({
      type: messageTypes.ERROR,
      title: message?.title,
      subtitle: message?.subtitle,
      copy: message?.copy || message,
      data: message?.data,
      display,
      delay,
      maxAge,
    } as Message);
  }

  function addSuccess(
    message: string | Object,
    display: messageDisplays = messageDisplays.TOAST,
    delay: number = 0,
    maxAge: number = useTime().SECOND * 2
  ) {
    if (!message) return; // bail if no message

    return add({
      type: messageTypes.SUCCESS,
      title: message?.title,
      subtitle: message?.subtitle,
      copy: message?.copy || message,
      data: message?.data,
      display,
      delay,
      maxAge,
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
    dismiss,
  };
};
