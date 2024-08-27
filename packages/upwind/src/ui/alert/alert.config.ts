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
          class: "text-base-foreground bg-base-background border",
        },
        {
          variant: "outlined",
          color: "primary",
          class: "bg-primary-50 border-primary text-primary",
        },
        {
          variant: "outlined",
          color: "secondary",
          class: "bg-secondary-50 border-secondary text-secondary",
        },
        {
          variant: "outlined",
          color: "accent",
          class: "bg-accent-50 test border-accent text-accent",
        },
        {
          variant: "outlined",
          color: "success",
          class: "text-success bg-success-50 border-success",
        },
        {
          variant: "outlined",
          color: "error",
          class: "text-error bg-error-50 border-error",
        },
        {
          variant: "outlined",
          color: "warning",
          class: "text-warning bg-warning-50 border-warning",
        },
        {
          variant: "outlined",
          color: "info",
          class: "text-info bg-info-50 border-info",
        },
        {
          variant: "outlined",
          color: "promotion",
          class: "text-promotion bg-promotion-50 border-promotion",
        },
        {
          variant: "outlined",
          color: "destructive",
          class: "bg-destructive-50 border-destructive text-destructive",
        },
        {
          variant: "solid",
          color: "base",
          class: "bg-base-800 border-base-800 text-base",
        },
        {
          variant: "solid",
          color: "primary",
          class: "text-primary-50 border-primary bg-primary",
        },
        {
          variant: "solid",
          color: "secondary",
          class: "text-secondary-50 border-secondary bg-secondary",
        },
        {
          variant: "solid",
          color: "accent",
          class: "text-accent-50 border-accent bg-accent",
        },
        {
          variant: "solid",
          color: "success",
          class: "text-success-50 bg-success border-success",
        },
        {
          variant: "solid",
          color: "error",
          class: "text-error-50 bg-error border-error",
        },
        {
          variant: "solid",
          color: "warning",
          class: "text-warning-50 bg-warning border-warning",
        },
        {
          variant: "solid",
          color: "info",
          class: "text-info-50 bg-info border-info",
        },
        {
          variant: "solid",
          color: "promotion",
          class: "text-promotion-50 bg-promotion border-promotion",
        },
        {
          variant: "solid",
          color: "destructive",
          class: "text-destructive-50 border-destructive bg-destructive",
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
