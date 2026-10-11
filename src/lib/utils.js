import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes and handles conditional class names cleanly.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
