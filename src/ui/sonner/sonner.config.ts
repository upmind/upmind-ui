import { cva } from "class-variance-authority";

export default {
  sonner: {
    neutral: {
      toast: cva(
        "group group-[.toaster]:data-[type=neutral]:text-accent-neutral-muted-contrast! group-[.toaster]:data-[type=neutral]:bg-accent-neutral-muted! group-[.toaster]:data-[type=neutral]:border-accent-neutral-muted!"
      ),
      actionButton: cva(
        "group-data-[type=neutral]:bg-accent-neutral! group-data-[type=neutral]:text-accent-neutral-contrast! transition-all! duration-200! group-data-[type=neutral]:hover:opacity-90!"
      ),
      closeButton: cva(
        "group-data-[type=neutral]:text-accent-neutral-muted-contrast! transition-all! duration-200!"
      )
    },

    success: {
      toast: cva(
        "group group-[.toaster]:data-[type=success]:text-accent-success-muted-contrast! group-[.toaster]:data-[type=success]:bg-accent-success-muted! group-[.toaster]:data-[type=success]:border-accent-success-muted!"
      ),
      actionButton: cva(
        "group-data-[type=success]:bg-accent-success-contrast! group-data-[type=success]:text-accent-success! transition-all! duration-200! group-data-[type=success]:hover:opacity-90!"
      ),
      closeButton: cva(
        "group-data-[type=success]:text-accent-success-muted-contrast! transition-all! duration-200!"
      )
    },

    danger: {
      toast: cva(
        "group group-[.toaster]:data-[type=danger]:text-accent-danger-muted-contrast! group-[.toaster]:data-[type=danger]:bg-accent-danger-muted! group-[.toaster]:data-[type=danger]:border-accent-danger-muted!"
      ),
      actionButton: cva(
        "group-data-[type=danger]:bg-accent-danger! group-data-[type=danger]:text-accent-danger-contrast! transition-all! duration-200! group-data-[type=danger]:hover:opacity-90!"
      ),
      closeButton: cva(
        "group-data-[type=danger]:text-accent-danger-muted-contrast! transition-all! duration-200!"
      )
    },

    warning: {
      toast: cva(
        "group group-[.toaster]:data-[type=warning]:text-accent-warning-muted-contrast! group-[.toaster]:data-[type=warning]:bg-accent-warning-muted! group-[.toaster]:data-[type=warning]:border-accent-warning-muted!"
      ),
      actionButton: cva(
        "group-data-[type=warning]:bg-accent-warning! group-data-[type=warning]:text-accent-warning-contrast! transition-all! duration-200! group-data-[type=warning]:hover:opacity-90!"
      ),
      closeButton: cva(
        "group-data-[type=warning]:text-accent-warning-muted-contrast! transition-all! duration-200!"
      )
    },

    info: {
      toast: cva(
        "group group-[.toaster]:data-[type=info]:text-accent-info-muted-contrast! group-[.toaster]:data-[type=info]:bg-accent-info-muted! group-[.toaster]:data-[type=info]:border-accent-info-muted!"
      ),
      actionButton: cva(
        "group-data-[type=info]:bg-accent-info! group-data-[type=info]:text-accent-info-contrast! transition-all! duration-200! group-data-[type=info]:hover:opacity-90!"
      ),
      closeButton: cva(
        "group-data-[type=info]:text-accent-info-muted-contrast! transition-all! duration-200!"
      )
    },

    promo: {
      toast: cva(
        "group group-[.toaster]:data-[type=promo]:text-accent-promo-muted-contrast! group-[.toaster]:data-[type=promo]:bg-accent-promo-muted! group-[.toaster]:data-[type=promo]:border-accent-promo-muted!"
      ),
      actionButton: cva(
        "group-data-[type=promo]:bg-accent-promo! group-data-[type=promo]:text-accent-promo-contrast! transition-all! duration-200! group-data-[type=promo]:hover:opacity-90!"
      ),
      closeButton: cva(
        "group-data-[type=promo]:text-accent-promo-muted-contrast! transition-all! duration-200!"
      )
    }
  }
};
