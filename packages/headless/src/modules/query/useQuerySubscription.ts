// --- external
import { isFunction } from "xstate/lib/utils";
import { getQueryClient } from "./utils";

// --- types
import { type QueryCacheNotifyEvent } from "@tanstack/query-core";
type QuerySubscriptionFilter = (event: QueryCacheNotifyEvent) => boolean;
export type { QueryCacheNotifyEvent, QuerySubscriptionFilter };

// ---

const queryClient = getQueryClient();

// --------------------------------------------------------
/**
 * Query Subscription - this is used by the other machines to listen for changes/messages from the query service
 * based on the query key. This allows stale data to be updated in the machine automatically
 * @param callback
 * @returns
 */
export function querySubscription(callback: any, onReceive: any) {
  // We allow machines to provide us with a filter to only listen to specific events
  // this is useful in preventing unnecessary updates to the machine
  let filter: QuerySubscriptionFilter | undefined = undefined;

  onReceive((event: any) => {
    switch (event.type) {
      case "FILTER":
        filter = event.data;
        break;
      default:
        break;
    }
  });

  const unsubscribe = queryClient.getQueryCache().subscribe((event: any) => {
    // We only want to listen to  events if we have a filter otherwise we will listen to all events which is not ideal
    const matches = isFunction(filter) ? filter(event) : false;

    console.debug("querySubscription", "event", {
      type: typeof event,
      queryKey: event?.query?.queryKey,
      matches,
      isFiltered: isFunction(filter),
      event,
    });

    if (event?.action?.type && matches) {
      // send the query event to the machine as the event type
      callback({
        type: `QUERY.${event?.action?.type?.toUpperCase()}`,
        queryKey: event.query.queryKey.toString(),
        ...event.action.data,
      });
    }
  });

  return () => {
    // The subscriber has unsubscribed from this service
    // typically when the transitioning out of the state node
    // we dont need to do anything here as we are consuming a global service
    // console.debug('clientStore', 'checkClient', 'unsubscribed');
    unsubscribe();
  };
}
