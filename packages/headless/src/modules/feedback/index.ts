// --- external
import { interpret } from "xstate";

// --- internal
import feedbackMachine from "./feedback.machine";

// --- utils
import { useTime } from "../../utils";
import { get, isString } from "lodash-es";

// --- types
import { messageTypes } from "./types";
import { messageDisplays, type Message } from "./types";

// --------------------------------------------------------
// create a global instance of the feedback machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(feedbackMachine, { devTools: false });
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
    message: string | object | any,
    display: messageDisplays = messageDisplays.TOAST,
    delay: number = 0,
    maxAge: number = useTime().SECOND * 6
  ) {
    if (!message) return; // bail if no message

    return add({
      type: messageTypes.ERROR,
      title: message?.title,
      subtitle: message?.subtitle,
      copy: isString(message) ? message : message?.copy,
      data: message?.data,
      display,
      delay,
      maxAge,
    } as Message);
  }

  function addSuccess(
    message: string | Object | any,
    display: messageDisplays = messageDisplays.TOAST,
    delay: number = 0,
    maxAge: number = useTime().SECOND * 2
  ) {
    if (!message) return; // bail if no message

    return add({
      type: messageTypes.SUCCESS,
      title: message?.title,
      subtitle: message?.subtitle,
      copy: isString(message) ? message : message?.copy,
      data: message?.data,
      display,
      delay,
      maxAge,
    } as Message);
  }

  function trackEvent(data: object) {
    const message: Message = {
      type: messageTypes.EVENT,
      display: messageDisplays.SILENT,
      data,
    };

    return add(message);
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
    getSnapshot: service.getSnapshot,
    getMessages: () => service.getSnapshot().context.messages,
    getMessage: (id: any) => get(service.getSnapshot().context.messages, id),
    // ---
    add,
    addError,
    addSuccess,
    trackEvent,
    dismiss,
  };
};
