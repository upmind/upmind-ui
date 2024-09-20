import type { ActorRef, Sender, EventObject } from "xstate";

export interface TActor<T> extends ActorRef<any, T> {
  state: any;
  send: Sender<EventObject>;
}
