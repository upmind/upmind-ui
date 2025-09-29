import { cva } from "class-variance-authority";

export default {
  sonner: {
    neutral: {
      toast: cva(
        "toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:shadow-sm has-[svg]:pl-4 group-[.toaster]:data-[type=neutral]:bg-background-accent-neutral-muted! group-[.toaster]:data-[type=neutral]:border-background-accent-neutral-muted! group-[.toaster]:data-[type=neutral]:text-text-accent-neutral-muted-contrast!"
      ),
      actionButton: cva(
        "group-data-[type=neutral]:from-background-button-neutral-0 group-data-[type=neutral]:to-background-button-neutral-1 group-data-[type=neutral]:text-text-accent-neutral-muted! transition-all! duration-300! group-data-[type=neutral]:bg-gradient-to-br group-data-[type=neutral]:hover:opacity-80!"
      ),
      closeButton: cva(
        "group-data-[type=neutral]:text-text-accent-neutral-muted! transition-all! duration-300! group-data-[type=neutral]:hover:opacity-80!"
      )
    },

    success: {
      toast: cva(
        "toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:shadow-sm has-[svg]:pl-4 group-[.toaster]:data-[type=success]:bg-background-accent-success-muted! group-[.toaster]:data-[type=success]:border-background-accent-success-muted! group-[.toaster]:data-[type=success]:text-text-accent-success-muted-contrast!"
      ),
      actionButton: cva(
        "group-data-[type=success]:bg-background-accent-success! group-data-[type=success]:text-text-accent-success-muted! transition-all! duration-300! group-data-[type=success]:hover:opacity-80!"
      ),
      closeButton: cva(
        "group-data-[type=success]:text-text-accent-success-muted! transition-all! duration-300! group-data-[type=success]:hover:opacity-80!"
      )
    },

    danger: {
      toast: cva(
        "toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:shadow-sm has-[svg]:pl-4 group-[.toaster]:data-[type=danger]:bg-background-accent-danger-muted! group-[.toaster]:data-[type=danger]:border-background-accent-danger-muted! group-[.toaster]:data-[type=danger]:text-text-accent-danger-muted-contrast!"
      ),
      actionButton: cva(
        "group-data-[type=danger]:bg-background-accent-danger! group-data-[type=danger]:text-text-accent-danger-muted! transition-all! duration-300! group-data-[type=danger]:hover:opacity-80!"
      ),
      closeButton: cva(
        "group-data-[type=danger]:text-text-accent-danger-muted! transition-all! duration-300! group-data-[type=danger]:hover:opacity-80!"
      )
    },

    warning: {
      toast: cva(
        "toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:shadow-sm has-[svg]:pl-4 group-[.toaster]:data-[type=warning]:bg-background-accent-warning-muted! group-[.toaster]:data-[type=warning]:border-background-accent-warning-muted! group-[.toaster]:data-[type=warning]:text-text-accent-warning-muted-contrast!"
      ),
      actionButton: cva(
        "group-data-[type=warning]:bg-background-accent-warning! group-data-[type=warning]:text-text-accent-warning-muted! transition-all! duration-300! group-data-[type=warning]:hover:opacity-80!"
      ),
      closeButton: cva(
        "group-data-[type=warning]:text-text-accent-warning-muted! transition-all! duration-300! group-data-[type=warning]:hover:opacity-80!"
      )
    },

    info: {
      toast: cva(
        "toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:shadow-sm has-[svg]:pl-4 group-[.toaster]:data-[type=info]:bg-background-accent-info-muted! group-[.toaster]:data-[type=info]:border-background-accent-info-muted! group-[.toaster]:data-[type=info]:text-text-accent-info-muted-contrast!"
      ),
      actionButton: cva(
        "group-data-[type=info]:bg-background-accent-info! group-data-[type=info]:text-text-accent-info-muted! transition-all! duration-300! group-data-[type=info]:hover:opacity-80!"
      ),
      closeButton: cva(
        "group-data-[type=info]:text-text-accent-info-muted! transition-all! duration-300! group-data-[type=info]:hover:opacity-80!"
      )
    },

    promo: {
      toast: cva(
        "toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group group-[.toaster]:shadow-sm has-[svg]:pl-4 group-[.toaster]:data-[type=promo]:bg-background-accent-promo-muted! group-[.toaster]:data-[type=promo]:border-background-accent-promo-muted! group-[.toaster]:data-[type=promo]:text-text-accent-promo-muted-contrast!"
      ),
      actionButton: cva(
        "group-data-[type=promo]:bg-background-accent-promo! group-data-[type=promo]:text-text-accent-promo-muted! transition-all! duration-300! group-data-[type=promo]:hover:opacity-80!"
      ),
      closeButton: cva(
        "group-data-[type=promo]:text-text-accent-promo-muted transition-all! duration-300! group-data-[type=promo]:hover:opacity-80!"
      )
    }
  }
};
