// --- external
import { interpret, InterpreterStatus } from "xstate";

// --- internal
import feedbackMachine from "./feedback.machine";

// --- utils
import { useTime } from "../../utils";
import { get, isString } from "lodash-es";

// --- types
import { messageTypes } from "./types";
import { messageDisplays, type Message } from "./types";
export * from "./useFeedback";
export * from "./types";

// -----------------------------------------------------------------------------
// create a global instance of the feedback machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(feedbackMachine, { devTools: true });

// -----------------------------------------------------------------------------

export const useFeedback = () => {
  // --- state
  if (service.status == InterpreterStatus.NotStarted) service.start();

  // ---  // methods

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
      i18nKey: message?.i18nKey,
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
      i18nKey: message?.i18nKey,
      title: message?.title,
      subtitle: message?.subtitle,
      copy: isString(message) ? message : message?.copy,
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

  // ---------------------------------------------------------------------------
  return {
    service,
    // ---
    getSnapshot: service.getSnapshot,
    getMessages: () => service.getSnapshot().context.messages,
    getMessage: (id: any) => get(service.getSnapshot().context.messages, id),
    // ---
    add,
    addError,
    addSuccess,
    dismiss,
  };
};
