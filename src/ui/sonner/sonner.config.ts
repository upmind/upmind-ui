import { cva } from "class-variance-authority";

export default {
  sonner: {
    neutral: {
      toast: cva(
        "toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:data-[type=neutral]:bg-accent-neutral-muted! group-[.toaster]:data-[type=neutral]:border-background-accent-neutral-muted! group-[.toaster]:data-[type=neutral]:text-accent-neutral-muted-contrast! group-[.toaster]:shadow-sm has-[svg]:pl-4"
      ),
      actionButton: cva(
        "group-data-[type=neutral]:from-background-button-neutral-0 group-data-[type=neutral]:to-background-button-neutral-1 group-data-[type=neutral]:text-accent-neutral-muted! transition-all! duration-300! group-data-[type=neutral]:bg-gradient-to-br group-data-[type=neutral]:hover:opacity-80!"
      ),
      closeButton: cva(
        "group-data-[type=neutral]:text-accent-neutral-muted! transition-all! duration-300! group-data-[type=neutral]:hover:opacity-80!"
      )
    },

    success: {
      toast: cva(
        "toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:data-[type=success]:bg-accent-success-muted! group-[.toaster]:data-[type=success]:border-background-accent-success-muted! group-[.toaster]:data-[type=success]:text-accent-success-muted-contrast! group-[.toaster]:shadow-sm has-[svg]:pl-4"
      ),
      actionButton: cva(
        "group-data-[type=success]:bg-accent-success! group-data-[type=success]:text-accent-success-muted! transition-all! duration-300! group-data-[type=success]:hover:opacity-80!"
      ),
      closeButton: cva(
        "group-data-[type=success]:text-accent-success-muted! transition-all! duration-300! group-data-[type=success]:hover:opacity-80!"
      )
    },

    danger: {
      toast: cva(
        "toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:data-[type=danger]:bg-accent-danger-muted! group-[.toaster]:data-[type=danger]:border-background-accent-danger-muted! group-[.toaster]:data-[type=danger]:text-accent-danger-muted-contrast! group-[.toaster]:shadow-sm has-[svg]:pl-4"
      ),
      actionButton: cva(
        "group-data-[type=danger]:bg-accent-danger! group-data-[type=danger]:text-accent-danger-muted! transition-all! duration-300! group-data-[type=danger]:hover:opacity-80!"
      ),
      closeButton: cva(
        "group-data-[type=danger]:text-accent-danger-muted! transition-all! duration-300! group-data-[type=danger]:hover:opacity-80!"
      )
    },

    warning: {
      toast: cva(
        "toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:data-[type=warning]:bg-accent-warning-muted! group-[.toaster]:data-[type=warning]:border-background-accent-warning-muted! group-[.toaster]:data-[type=warning]:text-accent-warning-muted-contrast! group-[.toaster]:shadow-sm has-[svg]:pl-4"
      ),
      actionButton: cva(
        "group-data-[type=warning]:bg-accent-warning! group-data-[type=warning]:text-accent-warning-muted! transition-all! duration-300! group-data-[type=warning]:hover:opacity-80!"
      ),
      closeButton: cva(
        "group-data-[type=warning]:text-accent-warning-muted! transition-all! duration-300! group-data-[type=warning]:hover:opacity-80!"
      )
    },

    info: {
      toast: cva(
        "toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:data-[type=info]:bg-accent-info-muted! group-[.toaster]:data-[type=info]:border-background-accent-info-muted! group-[.toaster]:data-[type=info]:text-accent-info-muted-contrast! group-[.toaster]:shadow-sm has-[svg]:pl-4"
      ),
      actionButton: cva(
        "group-data-[type=info]:bg-accent-info! group-data-[type=info]:text-accent-info-muted! transition-all! duration-300! group-data-[type=info]:hover:opacity-80!"
      ),
      closeButton: cva(
        "group-data-[type=info]:text-accent-info-muted! transition-all! duration-300! group-data-[type=info]:hover:opacity-80!"
      )
    },

    promo: {
      toast: cva(
        "group-[.toaster]:data-[type=promo]:border-[var(--color-background-accent-promo-muted)]! group-[.toaster]:data-[type=promo]:bg-[var(--color-background-accent-promo-muted)]! group-[.toaster]:data-[type=promo]:text-[var(--color-text-accent-promo-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-300! group-data-[type=promo]:bg-[var(--color-background-accent-promo)]! group-data-[type=promo]:text-[var(--color-text-accent-promo-contrast)]! group-data-[type=promo]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-300! group-data-[type=promo]:text-[var(--color-text-accent-promo-muted-contrast)]! group-data-[type=promo]:hover:opacity-80!"
      )
    }
  }
};
