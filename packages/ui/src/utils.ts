import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Preset for Glass Effect
export const glass =
  "bg-background/80 backdrop-blur-md border-b border-border/50";
