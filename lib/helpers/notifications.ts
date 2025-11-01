// src/lib/helpers/notifications.ts
"use client";

import { toast } from "sonner";

export const notify = {
  success: (message: string) =>
    toast.success(message, { duration: 4000, position: "top-right" }),

  error: (message: string) =>
    toast.error(message, { duration: 5000, position: "top-right" }),

  info: (message: string) =>
    toast(message, { duration: 4000, position: "top-right" }),
};
