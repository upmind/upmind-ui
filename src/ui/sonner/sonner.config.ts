import { cva } from "class-variance-authority";

export default {
  sonner: {
    base: {
      toast: cva(
        "toast group-[.toaster]:border-border group group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg has-[svg]:pl-4"
      ),
      actionButton: cva(
        "!transition-all !duration-300 group-data-[type=base]:bg-base-foreground group-data-[type=base]:text-base-background group-data-[type=base]:hover:bg-base-800"
      ),
      closeButton: cva(
        "group-data-[type=base]:!bg-base-muted group-data-[type=base]:hover:!bg-base-muted !transition-all !duration-300 group-data-[type=base]:!text-base-foreground"
      )
    },

    primary: {
      toast: cva(
        "group-[.toaster]:data-[type=primary]:bg-primary-muted group-[.toaster]:shadow-lg group-[.toaster]:data-[type=primary]:border-primary-200 group-[.toaster]:data-[type=primary]:text-primary"
      ),
      actionButton: cva(
        "!transition-all !duration-300 group-data-[type=primary]:bg-primary group-data-[type=primary]:text-primary-foreground group-data-[type=primary]:hover:bg-primary-400"
      ),
      closeButton: cva(
        "group-data-[type=primary]:!bg-primary-muted group-data-[type=primary]:hover:!bg-primary-muted !transition-all !duration-300 group-data-[type=primary]:!border-primary-200 group-data-[type=primary]:!text-primary group-data-[type=primary]:hover:!border-primary-200"
      )
    },

    secondary: {
      toast: cva(
        "group-[.toaster]:data-[type=secondary]:bg-secondary-muted group-[.toaster]:shadow-lg group-[.toaster]:data-[type=secondary]:border-secondary-200 group-[.toaster]:data-[type=secondary]:text-secondary"
      ),
      actionButton: cva(
        "!transition-all !duration-300 group-data-[type=secondary]:bg-secondary group-data-[type=secondary]:text-secondary-foreground group-data-[type=secondary]:hover:bg-secondary-400"
      ),
      closeButton: cva(
        "group-data-[type=secondary]:!bg-secondary-muted group-data-[type=secondary]:hover:!bg-secondary-muted !transition-all !duration-300 group-data-[type=secondary]:!border-secondary-200 group-data-[type=secondary]:!text-secondary group-data-[type=secondary]:hover:!border-secondary-200"
      )
    },

    accent: {
      toast: cva(
        "group-[.toaster]:data-[type=accent]:bg-accent-muted group-[.toaster]:shadow-lg group-[.toaster]:data-[type=accent]:border-accent-200 group-[.toaster]:data-[type=accent]:text-accent"
      ),
      actionButton: cva(
        "!transition-all !duration-300 group-data-[type=accent]:bg-accent group-data-[type=accent]:text-accent-foreground group-data-[type=accent]:hover:bg-accent-400"
      ),
      closeButton: cva(
        "group-data-[type=accent]:!bg-accent-muted group-data-[type=accent]:hover:!bg-accent-muted !transition-all !duration-300 group-data-[type=accent]:!border-accent-200 group-data-[type=accent]:!text-accent group-data-[type=accent]:hover:!border-accent-200"
      )
    },

    success: {
      toast: cva(
        "group-[.toaster]:data-[type=success]:bg-success-muted group-[.toaster]:shadow-lg group-[.toaster]:data-[type=success]:border-success-200 group-[.toaster]:data-[type=success]:text-success"
      ),
      actionButton: cva(
        "!transition-all !duration-300 group-data-[type=success]:bg-success group-data-[type=success]:text-success-foreground group-data-[type=success]:hover:bg-success-400"
      ),
      closeButton: cva(
        "group-data-[type=success]:!bg-success-muted group-data-[type=success]:hover:!bg-success-muted !transition-all !duration-300 group-data-[type=success]:!border-success-200 group-data-[type=success]:!text-success group-data-[type=success]:hover:!border-success-200"
      )
    },

    error: {
      toast: cva(
        "group-[.toaster]:data-[type=error]:bg-error-muted group-[.toaster]:shadow-lg group-[.toaster]:data-[type=error]:border-error-200 group-[.toaster]:data-[type=error]:text-error"
      ),
      actionButton: cva(
        "!transition-all !duration-300 group-data-[type=error]:bg-error group-data-[type=error]:text-error-foreground group-data-[type=error]:hover:bg-error-400"
      ),
      closeButton: cva(
        "group-data-[type=error]:!bg-error-muted group-data-[type=error]:hover:!bg-error-muted !transition-all !duration-300 group-data-[type=error]:!border-error-200 group-data-[type=error]:!text-error group-data-[type=error]:hover:!border-error-200"
      )
    },

    warning: {
      toast: cva(
        "group-[.toaster]:data-[type=warning]:bg-warning-muted group-[.toaster]:shadow-lg group-[.toaster]:data-[type=warning]:border-warning-200 group-[.toaster]:data-[type=warning]:text-warning"
      ),
      actionButton: cva(
        "!transition-all !duration-300 group-data-[type=warning]:bg-warning group-data-[type=warning]:text-warning-foreground group-data-[type=warning]:hover:bg-warning-400"
      ),
      closeButton: cva(
        "group-data-[type=warning]:!bg-warning-muted group-data-[type=warning]:hover:!bg-warning-muted !transition-all !duration-300 group-data-[type=warning]:!border-warning-200 group-data-[type=warning]:!text-warning group-data-[type=warning]:hover:!border-warning-200"
      )
    },

    info: {
      toast: cva(
        "group-[.toaster]:data-[type=info]:bg-info-muted group-[.toaster]:shadow-lg group-[.toaster]:data-[type=info]:border-info-200 group-[.toaster]:data-[type=info]:text-info"
      ),
      actionButton: cva(
        "!transition-all !duration-300 group-data-[type=info]:bg-info group-data-[type=info]:text-info-foreground group-data-[type=info]:hover:bg-info-400"
      ),
      closeButton: cva(
        "group-data-[type=info]:!bg-info-muted group-data-[type=info]:hover:!bg-info-muted !transition-all !duration-300 group-data-[type=info]:!border-info-200 group-data-[type=info]:!text-info group-data-[type=info]:hover:!border-info-200"
      )
    },

    promotion: {
      toast: cva(
        "group-[.toaster]:data-[type=promotion]:bg-promotion-muted group-[.toaster]:shadow-lg group-[.toaster]:data-[type=promotion]:border-promotion-200 group-[.toaster]:data-[type=promotion]:text-promotion"
      ),
      actionButton: cva(
        "!transition-all !duration-300 group-data-[type=promotion]:bg-promotion group-data-[type=promotion]:text-promotion-foreground group-data-[type=promotion]:hover:bg-promotion-400"
      ),
      closeButton: cva(
        "group-data-[type=promotion]:!bg-promotion-muted group-data-[type=promotion]:hover:!bg-promotion-muted !transition-all !duration-300 group-data-[type=promotion]:!border-promotion-200 group-data-[type=promotion]:!text-promotion group-data-[type=promotion]:hover:!border-promotion-200"
      )
    },

    destructive: {
      toast: cva(
        "group-[.toaster]:data-[type=destructive]:bg-destructive-muted group-[.toaster]:shadow-lg group-[.toaster]:data-[type=destructive]:border-destructive-200 group-[.toaster]:data-[type=destructive]:text-destructive"
      ),
      actionButton: cva(
        "!transition-all !duration-300 group-data-[type=destructive]:bg-destructive group-data-[type=destructive]:text-destructive-foreground group-data-[type=destructive]:hover:bg-destructive-400"
      ),
      closeButton: cva(
        "group-data-[type=destructive]:!bg-destructive-muted group-data-[type=destructive]:hover:!bg-destructive-muted !transition-all !duration-300 group-data-[type=destructive]:!border-destructive-200 group-data-[type=destructive]:!text-destructive group-data-[type=destructive]:hover:!border-destructive-200"
      )
    }
  }
};
