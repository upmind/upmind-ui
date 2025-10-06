import { cva } from "class-variance-authority";

export default {
  sonner: {
    neutral: {
      toast: cva(
        "group group-[.toaster]:data-[type=neutral]:border-[var(--color-bg-accent-neutral-muted)]! group-[.toaster]:data-[type=neutral]:bg-[var(--color-bg-accent-neutral-muted)]! group-[.toaster]:data-[type=neutral]:text-[var(--color-text-accent-neutral-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=neutral]:bg-[var(--color-bg-accent-neutral)]! group-data-[type=neutral]:text-[var(--color-text-accent-neutral-contrast)]! group-data-[type=neutral]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=neutral]:text-[var(--color-text-accent-neutral-muted-contrast)]! group-data-[type=neutral]:hover:opacity-80!"
      )
    },

    success: {
      toast: cva(
        "group group-[.toaster]:data-[type=success]:border-[var(--color-bg-accent-success-muted)]! group-[.toaster]:data-[type=success]:bg-[var(--color-bg-accent-success-muted)]! group-[.toaster]:data-[type=success]:text-[var(--color-text-accent-success-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=success]:bg-[var(--color-bg-accent-success)]! group-data-[type=success]:text-[var(--color-text-accent-success-contrast)]! group-data-[type=success]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=success]:text-[var(--color-text-accent-success-muted-contrast)]! group-data-[type=success]:hover:opacity-80!"
      )
    },

    danger: {
      toast: cva(
        "group group-[.toaster]:data-[type=danger]:border-[var(--color-bg-accent-danger-muted)]! group-[.toaster]:data-[type=danger]:bg-[var(--color-bg-accent-danger-muted)]! group-[.toaster]:data-[type=danger]:text-[var(--color-text-accent-danger-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=danger]:bg-[var(--color-bg-accent-danger)]! group-data-[type=danger]:text-[var(--color-text-accent-danger-contrast)]! group-data-[type=danger]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=danger]:text-[var(--color-text-accent-danger-muted-contrast)]! group-data-[type=danger]:hover:opacity-80!"
      )
    },

    warning: {
      toast: cva(
        "group group-[.toaster]:data-[type=warning]:border-[var(--color-bg-accent-warning-muted)]! group-[.toaster]:data-[type=warning]:bg-[var(--color-bg-accent-warning-muted)]! group-[.toaster]:data-[type=warning]:text-[var(--color-text-accent-warning-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=warning]:bg-[var(--color-bg-accent-warning)]! group-data-[type=warning]:text-[var(--color-text-accent-warning-contrast)]! group-data-[type=warning]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=warning]:text-[var(--color-text-accent-warning-muted-contrast)]! group-data-[type=warning]:hover:opacity-80!"
      )
    },

    info: {
      toast: cva(
        "group group-[.toaster]:data-[type=info]:border-[var(--color-bg-accent-info-muted)]! group-[.toaster]:data-[type=info]:bg-[var(--color-bg-accent-info-muted)]! group-[.toaster]:data-[type=info]:text-[var(--color-text-accent-info-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=info]:bg-[var(--color-bg-accent-info)]! group-data-[type=info]:text-[var(--color-text-accent-info-contrast)]! group-data-[type=info]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=info]:text-[var(--color-text-accent-info-muted-contrast)]! group-data-[type=info]:hover:opacity-80!"
      )
    },

    promo: {
      toast: cva(
        "group group-[.toaster]:data-[type=promo]:border-[var(--color-bg-accent-promo-muted)]! group-[.toaster]:data-[type=promo]:bg-[var(--color-bg-accent-promo-muted)]! group-[.toaster]:data-[type=promo]:text-[var(--color-text-accent-promo-muted-contrast)]!"
      ),
      actionButton: cva(
        "transition-all! duration-200! group-data-[type=promo]:bg-[var(--color-bg-accent-promo)]! group-data-[type=promo]:text-[var(--color-text-accent-promo-contrast)]! group-data-[type=promo]:hover:opacity-90!"
      ),
      closeButton: cva(
        "transition-all! duration-200! group-data-[type=promo]:text-[var(--color-text-accent-promo-muted-contrast)]! group-data-[type=promo]:hover:opacity-80!"
      )
    }
  }
};
