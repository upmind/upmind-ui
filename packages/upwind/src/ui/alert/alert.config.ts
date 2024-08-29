import { cva } from "class-variance-authority";

export const alertConfig = {
  root: cva(
    "relative w-full rounded-lg border p-4 [&>i+div]:translate-y-[-3px] [&>i]:absolute [&>i]:left-4 [&>i]:top-4 [&>i~*]:pl-7",
    {
      variants: {
        // Compunds variants do not work without this defined
      },
      compoundVariants: [
        {
          variant: "outlined",
          color: "base",
          class: "border bg-base-background text-base-foreground",
        },
        {
          variant: "outlined",
          color: "primary",
          class: "border-primary bg-primary-50 text-primary",
        },
        {
          variant: "outlined",
          color: "secondary",
          class: "border-secondary bg-secondary-50 text-secondary",
        },
        {
          variant: "outlined",
          color: "accent",
          class: "test border-accent bg-accent-50 text-accent",
        },
        {
          variant: "outlined",
          color: "success",
          class: "border-success bg-success-50 text-success",
        },
        {
          variant: "outlined",
          color: "error",
          class: "border-error bg-error-50 text-error",
        },
        {
          variant: "outlined",
          color: "warning",
          class: "border-warning bg-warning-50 text-warning",
        },
        {
          variant: "outlined",
          color: "info",
          class: "border-info bg-info-50 text-info",
        },
        {
          variant: "outlined",
          color: "promotion",
          class: "border-promotion bg-promotion-50 text-promotion",
        },
        {
          variant: "outlined",
          color: "destructive",
          class: "border-destructive bg-destructive-50 text-destructive",
        },
        {
          variant: "solid",
          color: "base",
          class: "border-base-800 bg-base-800 text-base",
        },
        {
          variant: "solid",
          color: "primary",
          class: "border-primary bg-primary text-primary-50",
        },
        {
          variant: "solid",
          color: "secondary",
          class: "border-secondary bg-secondary text-secondary-50",
        },
        {
          variant: "solid",
          color: "accent",
          class: "border-accent bg-accent text-accent-50",
        },
        {
          variant: "solid",
          color: "success",
          class: "border-success bg-success text-success-50",
        },
        {
          variant: "solid",
          color: "error",
          class: "border-error bg-error text-error-50",
        },
        {
          variant: "solid",
          color: "warning",
          class: "border-warning bg-warning text-warning-50",
        },
        {
          variant: "solid",
          color: "info",
          class: "border-info bg-info text-info-50",
        },
        {
          variant: "solid",
          color: "promotion",
          class: "border-promotion bg-promotion text-promotion-50",
        },
        {
          variant: "solid",
          color: "destructive",
          class: "border-destructive bg-destructive text-destructive-50",
        },
      ],
      defaultVariants: {
        variant: "outlined",
        color: "base",
      },
    }
  ),
  title: cva("mb-1 font-medium leading-none tracking-tight"),
  description: cva("text-sm opacity-75 [&_p]:leading-relaxed"),
  icon: cva("size-[1em]"),
};

export default {
  alert: alertConfig,
};
