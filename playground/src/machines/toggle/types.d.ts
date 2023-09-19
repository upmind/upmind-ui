export interface ToggleContext {
  count: number;
}

export type ToggleEvent = {
  type: "TOGGLE";
};

export type ResetEvent = {
  type: "RESET";
};

// Create a type which represents only one of the above types
// but you aren't sure which it is yet.
type ToggleEvents = ResetEvent | ToggleEvent;
