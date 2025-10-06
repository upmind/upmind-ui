import { cva } from "class-variance-authority";

export default {
  sonner: {
    neutral: {
      toast: cva(
        "group group-[.toaster]:data-[type=neutral]:border-[var(--bg-accent-neutral-muted)]! group-[.toaster]:data-[type=neutral]:bg-[var(--bg-accent-neutral-muted)]! group-[.toaster]:data-[type=neutral]:text-[var(--color-accent-neutral-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=neutral]:bg-[var(--bg-accent-neutral)]! group-data-[type=neutral]:text-[var(--color-accent-neutral-contrast)]! group-data-[type=neutral]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=neutral]:text-[var(--color-accent-neutral-muted-contrast)]! group-data-[type=neutral]:hover:opacity-80!"
      )
    },

    success: {
      toast: cva(
        "group group-[.toaster]:data-[type=success]:border-[var(--bg-accent-success-muted)]! group-[.toaster]:data-[type=success]:bg-[var(--bg-accent-success-muted)]! group-[.toaster]:data-[type=success]:text-[var(--color-accent-success-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=success]:bg-[var(--bg-accent-success)]! group-data-[type=success]:text-[var(--color-accent-success-contrast)]! group-data-[type=success]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=success]:text-[var(--color-accent-success-muted-contrast)]! group-data-[type=success]:hover:opacity-80!"
      )
    },

    danger: {
      toast: cva(
        "group group-[.toaster]:data-[type=danger]:border-[var(--bg-accent-danger-muted)]! group-[.toaster]:data-[type=danger]:bg-[var(--bg-accent-danger-muted)]! group-[.toaster]:data-[type=danger]:text-[var(--color-accent-danger-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=danger]:bg-[var(--bg-accent-danger)]! group-data-[type=danger]:text-[var(--color-accent-danger-contrast)]! group-data-[type=danger]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=danger]:text-[var(--color-accent-danger-muted-contrast)]! group-data-[type=danger]:hover:opacity-80!"
      )
    },

    warning: {
      toast: cva(
        "group group-[.toaster]:data-[type=warning]:border-[var(--bg-accent-warning-muted)]! group-[.toaster]:data-[type=warning]:bg-[var(--bg-accent-warning-muted)]! group-[.toaster]:data-[type=warning]:text-[var(--color-accent-warning-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=warning]:bg-[var(--bg-accent-warning)]! group-data-[type=warning]:text-[var(--color-accent-warning-contrast)]! group-data-[type=warning]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=warning]:text-[var(--color-accent-warning-muted-contrast)]! group-data-[type=warning]:hover:opacity-80!"
      )
    },

    info: {
      toast: cva(
        "group group-[.toaster]:data-[type=info]:border-[var(--bg-accent-info-muted)]! group-[.toaster]:data-[type=info]:bg-[var(--bg-accent-info-muted)]! group-[.toaster]:data-[type=info]:text-[var(--color-accent-info-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=info]:bg-[var(--bg-accent-info)]! group-data-[type=info]:text-[var(--color-accent-info-contrast)]! group-data-[type=info]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=info]:text-[var(--color-accent-info-muted-contrast)]! group-data-[type=info]:hover:opacity-80!"
      )
    },

    promo: {
      toast: cva(
        "group group-[.toaster]:data-[type=promo]:border-[var(--bg-accent-promo-muted)]! group-[.toaster]:data-[type=promo]:bg-[var(--bg-accent-promo-muted)]! group-[.toaster]:data-[type=promo]:text-[var(--color-accent-promo-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=promo]:bg-[var(--bg-accent-promo)]! group-data-[type=promo]:text-[var(--color-accent-promo-contrast)]! group-data-[type=promo]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=promo]:text-[var(--color-accent-promo-muted-contrast)]! group-data-[type=promo]:hover:opacity-80!"
      )
    }
  }
};
