import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module inspector/styles
 * @description CVA configuration for Inspector component.
 */

export default {
  inspector: {
    root: cva("flex flex-col gap-0 overflow-hidden p-0"),

    tabs: cva("bg-canvas h-full flex-1 overflow-hidden p-4"),

    spacer: cva("flex-1"),

    content: cva("max-h-[calc(100vh-8rem)] overflow-y-auto"),

    section: cva(""),

    sectionHeader: cva("border-surface relative mb-3 border-b pt-3 pb-1"),

    sectionTitle: cva("text-display text-sm font-bold"),

    stateValue: cva("bg-canvas block rounded px-3 py-2 text-xs"),

    statePath: cva("flex flex-wrap items-center gap-1"),

    stateSeparator: cva("text-muted mx-0.5 text-xs"),

    alert: cva("mb-4"),

    errorDetails: cva("mb-4"),

    errorSummary: cva(
      "cursor-pointer list-none [&::-webkit-details-marker]:hidden"
    ),

    errorPre: cva(
      "bg-accent-danger-muted text-accent-danger mt-2 max-h-48 w-full overflow-auto rounded-lg p-3 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap"
    ),

    metaList: cva("flex flex-wrap gap-2"),

    metaBadge: cva(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      {
        variants: {
          active: {
            true: "bg-accent-success-muted text-accent-success",
            false: "bg-canvas text-muted"
          }
        },
        defaultVariants: {
          active: false
        }
      }
    ),

    contextList: cva("space-y-1"),

    collapsible: cva("mt-3"),

    collapsibleTrigger: cva(
      "text-muted hover:text-display cursor-pointer text-xs font-semibold tracking-wider uppercase transition-colors"
    ),

    contextPre: cva(
      "bg-canvas mt-2 max-h-48 overflow-auto rounded p-2 text-xs"
    ),

    scopeMatrix: cva("mt-2 space-y-1"),

    scopeMatrixRow: cva("flex items-center gap-2 text-xs"),

    scopeMatrixActor: cva("text-muted min-w-16 font-medium"),

    scopeMatrixArrow: cva("text-faint"),

    scopeMatrixContexts: cva("")
  }
};
